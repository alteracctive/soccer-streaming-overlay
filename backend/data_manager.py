import asyncio
import aiofiles
import json
import sys
import os
from pydantic import BaseModel, Field, ValidationError
from typing import Literal, List

# --- Helper Function ---
def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

# --- Path Definitions ---
WRITABLE_DIR = os.path.abspath(".")
WRITABLE_CONFIG_FILE = os.path.join(WRITABLE_DIR, "team-info-config.json")
WRITABLE_STYLE_FILE = os.path.join(WRITABLE_DIR, "scoreboard-customization.json")

BUNDLED_CONFIG_FILE = resource_path("team-info-config.json")
BUNDLED_STYLE_FILE = resource_path("scoreboard-customization.json")


class ScoreboardStyleConfig(BaseModel):
    primary: str = "#000000"
    secondary: str = "#FFFFFF"   # <-- Renamed (was textColorPrimary)
    tertiary: str = "#ffd700"    # <-- Renamed (was textColorTertiary)
    opacity: int = Field(default=75, ge=50, le=100)
    scale: int = Field(default=100, ge=50, le=150)
    matchInfo: str = ""
    timerPosition: Literal["Under", "Right"] = "Under"
    showRedCardBoxes: bool = False

class ColorConfig(BaseModel):
    primary: str = "#FF0000"
    secondary: str = "#FFFFFF"

class PlayerConfig(BaseModel):
    number: int
    name: str
    onField: bool = False
    yellowCards: List[int] = []
    redCards: List[int] = []
    goals: List[int] = []

class TeamConfig(BaseModel):
    name: str = "TEAM"
    abbreviation: str = "TMA"
    score: int = 0
    colors: ColorConfig = Field(default_factory=ColorConfig)
    players: List[PlayerConfig] = []

class ScoreboardConfig(BaseModel):
    teamA: TeamConfig = Field(default_factory=TeamConfig)
    teamB: TeamConfig = Field(default_factory=TeamConfig)

class TeamInfoUpdate(BaseModel):
    teamA: dict
    teamB: dict

class CustomizationUpdate(BaseModel):
    teamA: ColorConfig
    teamB: ColorConfig

class SetScoreUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    score: int

class AddPlayerUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    number: int
    name: str

class ClearPlayersUpdate(BaseModel):
    team: Literal["teamA", "teamB"]

class DeletePlayerUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    number: int

class AddGoalUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    number: int
    minute: int

class AddCardUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    number: int
    card_type: Literal["yellow", "red"]
    minute: int

class ToggleOnFieldUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    number: int

class EditPlayerUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    original_number: int 
    
    number: int
    name: str
    onField: bool
    yellowCards: List[int]
    redCards: List[int]
    goals: List[int]

class ResetStatsUpdate(BaseModel):
    team: Literal["teamA", "teamB"]

class ReplacePlayerUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    number: int
    name: str

class MatchInfoUpdate(BaseModel):
    info: str

class LayoutUpdate(BaseModel):
    position: Literal["Under", "Right"]
    showRedCardBoxes: bool

class StyleUpdate(BaseModel):
    primary: str
    secondary: str  # <-- Renamed
    tertiary: str # <-- Renamed
    opacity: int
    scale: int


class DataManager:
    def __init__(self, file_path: str, scoreboard_style_path: str):
        self.file_path = file_path
        self.scoreboard_style_path = scoreboard_style_path
        self.config: ScoreboardConfig | None = None
        self.scoreboard_style: ScoreboardStyleConfig | None = None
        self._config_lock = asyncio.Lock()
        self._style_lock = asyncio.Lock()

    async def _save_config_nolock(self):
        if self.config is None: return
        try:
            async with aiofiles.open(self.file_path, mode='w') as f:
                await f.write(self.config.model_dump_json(indent=2))
            print(f"Config saved to {self.file_path}")
        except Exception as e:
            print(f"!!! Critical Error saving config to {self.file_path}: {e}")

    async def save_config(self):
        async with self._config_lock:
            await self._save_config_nolock()

    async def _save_scoreboard_style_nolock(self):
        if self.scoreboard_style is None:
            self.scoreboard_style = ScoreboardStyleConfig()
            
        if not isinstance(self.scoreboard_style, ScoreboardStyleConfig):
             print("Error: scoreboard_style is not a valid ScoreboardStyleConfig instance. Resetting.")
             self.scoreboard_style = ScoreboardStyleConfig()
        
        try:
            async with aiofiles.open(self.scoreboard_style_path, mode='w') as f:
                await f.write(self.scoreboard_style.model_dump_json(indent=2))
            print(f"Scoreboard style successfully saved to {self.scoreboard_style_path}")
        except Exception as e:
            print(f"!!! Critical Error saving scoreboard style to {self.scoreboard_style_path}: {e}")

    async def save_scoreboard_style(self):
        async with self._style_lock:
            await self._save_scoreboard_style_nolock()

    async def load_config(self):
        async with self._config_lock:
            try:
                async with aiofiles.open(self.file_path, mode='r') as f:
                    content = await f.read()
                    data = json.loads(content)
                    migrated = False
                    for team_key in ['teamA', 'teamB']:
                        if team_key in data and 'players' in data[team_key]:
                            for player in data[team_key]['players']:
                                if isinstance(player.get('yellowCards'), int):
                                    player['yellowCards'] = []
                                    migrated = True
                                if isinstance(player.get('redCards'), int):
                                    player['redCards'] = []
                                    migrated = True
                    self.config = ScoreboardConfig.model_validate(data)
                print("Config loaded successfully from writable file.")
                if migrated:
                    print("Migrated old card data structure.")
                    await self._save_config_nolock()

            except (FileNotFoundError, ValidationError):
                print(f"Writable config '{self.file_path}' not found or invalid. Loading from bundled default.")
                try:
                    async with aiofiles.open(BUNDLED_CONFIG_FILE, mode='r') as f:
                        content = await f.read()
                        self.config = ScoreboardConfig.model_validate_json(content)
                    await self._save_config_nolock() 
                    print("Loaded from bundled default and created new writable config.")
                except Exception as e:
                    print(f"CRITICAL: Could not load bundled config '{BUNDLED_CONFIG_FILE}': {e}")
                    raise

    async def load_scoreboard_style(self):
        async with self._style_lock:
            try:
                async with aiofiles.open(self.scoreboard_style_path, mode='r') as f:
                    content = await f.read()
                    data = json.loads(content)
                    
                    # --- Migration Logic ---
                    if 'textColorPrimary' in data:
                        data['secondary'] = data.pop('textColorPrimary')
                    if 'textColorTertiary' in data:
                        data['tertiary'] = data.pop('textColorTertiary')
                    if 'textColorSecondary' in data:
                        data['tertiary'] = data.pop('textColorSecondary')
                    # --- End Migration ---
                        
                    if 'timerPosition' not in data:
                        data['timerPosition'] = 'Under'
                    if 'matchInfo' not in data:
                        data['matchInfo'] = ''
                    if 'showRedCardBoxes' not in data:
                        data['showRedCardBoxes'] = False
                    if 'secondary' not in data:
                        data['secondary'] = '#FFFFFF'
                    if 'tertiary' not in data:
                        data['tertiary'] = '#ffd700'
                        
                    self.scoreboard_style = ScoreboardStyleConfig.model_validate(data)
                print("Scoreboard style loaded successfully from writable file.")
            except (FileNotFoundError, ValidationError):
                print(f"Writable style '{self.scoreboard_style_path}' not found or invalid. Loading from bundled default.")
                try:
                    async with aiofiles.open(BUNDLED_STYLE_FILE, mode='r') as f:
                        content = await f.read()
                        data = json.loads(content)
                        # --- Migration Logic ---
                        if 'textColorPrimary' in data:
                            data['secondary'] = data.pop('textColorPrimary')
                        if 'textColorTertiary' in data:
                            data['tertiary'] = data.pop('textColorTertiary')
                        if 'textColorSecondary' in data:
                            data['tertiary'] = data.pop('textColorSecondary')
                        # --- End Migration ---
                        if 'timerPosition' not in data:
                            data['timerPosition'] = 'Under'
                        if 'matchInfo' not in data:
                            data['matchInfo'] = ''
                        if 'showRedCardBoxes' not in data:
                            data['showRedCardBoxes'] = False
                        if 'secondary' not in data:
                            data['secondary'] = '#FFFFFF'
                        if 'tertiary' not in data:
                            data['tertiary'] = '#ffd700'
                        self.scoreboard_style = ScoreboardStyleConfig.model_validate(data)
                    await self._save_scoreboard_style_nolock()
                    print("Loaded from bundled default and created new writable style file.")
                except Exception as e:
                    print(f"CRITICAL: Could not load bundled style '{BUNDLED_STYLE_FILE}': {e}")
                    self.scoreboard_style = ScoreboardStyleConfig()
                    await self._save_scoreboard_style_nolock()


    async def get_raw_json(self, file_name: str) -> str:
        path_to_read = None
        if file_name == "team-info-config.json":
            path_to_read = self.file_path
        elif file_name == "scoreboard-customization.json":
            path_to_read = self.scoreboard_style_path
        
        if path_to_read and os.path.exists(path_to_read):
            async with aiofiles.open(path_to_read, mode='r') as f:
                return await f.read()
        raise FileNotFoundError(f"{file_name} not found.")

    async def set_raw_json(self, file_name: str, raw_json_data: str):
        path_to_write = None
        
        try:
            if file_name == "team-info-config.json":
                ScoreboardConfig.model_validate_json(raw_json_data)
                path_to_write = self.file_path
            elif file_name == "scoreboard-customization.json":
                ScoreboardStyleConfig.model_validate_json(raw_json_data)
                path_to_write = self.scoreboard_style_path
            else:
                raise Exception("Invalid file name specified.")

            async with aiofiles.open(path_to_write, mode='w') as f:
                await f.write(raw_json_data)
            
            await self.load_config()
            await self.load_scoreboard_style()
            
        except ValidationError as e:
            print(f"JSON validation failed: {e}")
            raise Exception(f"Invalid JSON structure. {str(e)}")
        except Exception as e:
            print(f"Error setting raw JSON: {e}")
            raise e

    def get_scoreboard_style(self) -> ScoreboardStyleConfig:
        if self.scoreboard_style is None: raise Exception("Scoreboard style not loaded")
        return self.scoreboard_style

    async def update_scoreboard_style(self, style_update: StyleUpdate) -> ScoreboardStyleConfig:
        current_style = self.get_scoreboard_style()
        
        current_style.primary = style_update.primary
        current_style.secondary = style_update.secondary
        current_style.tertiary = style_update.tertiary
        current_style.opacity = style_update.opacity
        current_style.scale = style_update.scale
        
        self.scoreboard_style = current_style 
        
        await self.save_scoreboard_style()
        return self.scoreboard_style

    async def update_match_info(self, info: str) -> ScoreboardStyleConfig:
        style = self.get_scoreboard_style()
        style.matchInfo = info
        await self.save_scoreboard_style()
        return style

    async def update_layout(self, layout: LayoutUpdate) -> ScoreboardStyleConfig:
        style = self.get_scoreboard_style()
        style.timerPosition = layout.position
        style.showRedCardBoxes = layout.showRedCardBoxes
        await self.save_scoreboard_style()
        print(f"Layout updated: Pos={layout.position}, RedCards={layout.showRedCardBoxes}")
        return style

    def get_config(self) -> ScoreboardConfig:
        if self.config is None: raise Exception("Config not loaded")
        return self.config
        
    async def update_team_info(self, info: TeamInfoUpdate) -> ScoreboardConfig:
        config = self.get_config()
        config.teamA.name = info.teamA.get('name', config.teamA.name)
        config.teamA.abbreviation = info.teamA.get('abbreviation', config.teamA.abbreviation)
        config.teamB.name = info.teamB.get('name', config.teamB.name)
        config.teamB.abbreviation = info.teamB.get('abbreviation', config.teamB.abbreviation)
        await self.save_config()
        return config

    async def update_colors(self, colors: CustomizationUpdate) -> ScoreboardConfig:
        config = self.get_config()
        config.teamA.colors = colors.teamA
        config.teamB.colors = colors.teamB
        await self.save_config()
        return config

    async def set_score(self, score_data: SetScoreUpdate) -> ScoreboardConfig:
        config = self.get_config()
        team_to_update = getattr(config, score_data.team)
        if score_data.score < 0: team_to_update.score = 0
        else: team_to_update.score = score_data.score
        await self.save_config()
        return config

    async def add_player(self, update: AddPlayerUpdate) -> ScoreboardConfig:
        config = self.get_config()
        
        team_to_update = getattr(config, update.team)
        
        for player in team_to_update.players:
            if player.number == update.number:
                print(f"Player with number {update.number} already exists for {update.team}.")
                raise Exception(f"Player number {update.number} already exists.")

        new_player = PlayerConfig(
            number=update.number,
            name=update.name
        )
        
        team_to_update.players.append(new_player)
        team_to_update.players.sort(key=lambda p: p.number)
        
        await self.save_config()
        return config

    async def clear_player_list(self, update: ClearPlayersUpdate) -> ScoreboardConfig:
        config = self.get_config()
        
        team_to_update = getattr(config, update.team)
        team_to_update.players.clear()
        
        await self.save_config()
        print(f"Player list for {update.team} cleared.")
        return config

    async def delete_player(self, update: DeletePlayerUpdate) -> ScoreboardConfig:
        config = self.get_config()
        
        team_to_update = getattr(config, update.team)
        
        original_count = len(team_to_update.players)
        team_to_update.players = [p for p in team_to_update.players if p.number != update.number]
        new_count = len(team_to_update.players)

        if original_count != new_count:
            await self.save_config()
            print(f"Player #{update.number} deleted from {update.team}.")
        else:
            print(f"Player #{update.number} not found in {update.team}.")
            
        return config

    async def add_goal(self, update: AddGoalUpdate) -> ScoreboardConfig:
        config = self.get_config()
        
        team_to_update = getattr(config, update.team)
        
        player_found = False
        for player in team_to_update.players:
            if player.number == update.number:
                player.goals.append(update.minute)
                player.goals.sort() 
                player_found = True
                break
        
        if player_found:
            await self.save_config()
            print(f"Goal added to player #{update.number} ({update.team}) at minute {update.minute}.")
        else:
            print(f"Could not add goal: Player #{update.number} not found in {update.team}.")
            
        return config

    async def add_card(self, update: AddCardUpdate) -> ScoreboardConfig:
        config = self.get_config()
        team = getattr(config, update.team)
        
        player_found = False
        data_changed = False
        for player in team.players:
            if player.number == update.number:
                if update.card_type == "yellow" and len(player.yellowCards) < 2:
                    player.yellowCards.append(update.minute)
                    player.yellowCards.sort()
                    data_changed = True
                    print(f"Yellow card added to player #{update.number} ({update.team}).")
                elif update.card_type == "red" and len(player.redCards) < 1:
                    player.redCards.append(update.minute)
                    data_changed = True
                    print(f"Red card added to player #{update.number} ({update.team}).")
                else:
                    print(f"Card limit reached for player #{update.number} ({update.team}).")
                player_found = True
                break
        
        if player_found and data_changed:
            await self.save_config()
        elif not player_found:
            print(f"Could not add card: Player #{update.number} not found in {update.team}.")

        return config

    async def toggle_on_field(self, update: ToggleOnFieldUpdate) -> ScoreboardConfig:
        config = self.get_config()
        team = getattr(config, update.team)
        
        player_found = False
        for player in team.players:
            if player.number == update.number:
                player.onField = not player.onField 
                player_found = True
                print(f"Player #{update.number} ({update.team}) onField set to {player.onField}.")
                break
                
        if player_found:
            await self.save_config()
        else:
            print(f"Could not toggle onField: Player #{update.number} not found in {update.team}.")
            
        return config

    async def edit_player(self, update: EditPlayerUpdate) -> ScoreboardConfig:
        config = self.get_config()
        team = getattr(config, update.team)
        
        if update.original_number != update.number:
            for p in team.players:
                if p.number == update.number:
                    print(f"Error editing player: Number {update.number} already exists.")
                    raise Exception(f"Player number {update.number} already exists.")

        player_found = False
        for player in team.players:
            if player.number == update.original_number:
                player.number = update.number
                player.name = update.name
                player.onField = update.onField
                player.yellowCards = sorted(update.yellowCards)[:2]
                player.redCards = sorted(update.redCards)[:1]
                player.goals = sorted(update.goals) 
                player_found = True
                break
                
        if player_found:
            team.players.sort(key=lambda p: p.number) 
            await self.save_config()
            print(f"Player #{update.original_number} ({update.team}) successfully edited.")
        else:
            print(f"Could not edit player: Player #{update.original_number} not found.")
            raise Exception(f"Player #{update.original_number} not found.")
            
        return config

    async def reset_team_stats(self, update: ResetStatsUpdate) -> ScoreboardConfig:
        config = self.get_config()
        team = getattr(config, update.team)
        
        for player in team.players:
            player.goals = []
            player.yellowCards = []
            player.redCards = []
            player.onField = False
            
        await self.save_config()
        print(f"Stats for {update.team} have been reset.")
        return config
        
    async def replace_player(self, update: ReplacePlayerUpdate) -> ScoreboardConfig:
        config = self.get_config()
        team = getattr(config, update.team)
        
        player_found = False
        for player in team.players:
            if player.number == update.number:
                player.name = update.name
                player.onField = False
                player.yellowCards = []
                player.redCards = []
                player.goals = []
                player_found = True
                print(f"Player #{update.number} ({update.team}) replaced with {update.name} and stats reset.")
                break
        
        if not player_found:
             print(f"Could not replace player: Player #{update.number} not found.")
             raise Exception(f"Player #{update.number} not found.")

        await self.save_config()
        return config

data_manager = DataManager(WRITABLE_CONFIG_FILE, WRITABLE_STYLE_FILE)