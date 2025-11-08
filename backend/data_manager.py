import asyncio
import aiofiles
import json
import sys  # <-- Add this
import os   # <-- Add this
from pydantic import BaseModel, Field
from typing import Literal, List

# --- New Helper Function ---
def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        # Not in a PyInstaller bundle, use normal path
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

# --- Use the helper function for your paths ---
CONFIG_FILE = resource_path("team-info-config.json")
SCOREBOARD_STYLE_FILE = resource_path("scoreboard-customization.json")

class ScoreboardStyleConfig(BaseModel):
    primary: str
    secondary: str
    opacity: int = Field(default=75, ge=50, le=100)
    scale: int = Field(default=100, ge=50, le=150)
    matchInfo: str = ""

class ColorConfig(BaseModel):
    primary: str
    secondary: str

class PlayerConfig(BaseModel):
    number: int
    name: str
    onField: bool = False
    yellowCards: int = 0
    redCards: int = 0
    goals: List[int] = []

class TeamConfig(BaseModel):
    name: str
    abbreviation: str
    score: int
    colors: ColorConfig
    players: List[PlayerConfig] = []

class ScoreboardConfig(BaseModel):
    teamA: TeamConfig
    teamB: TeamConfig

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
    card_type: Literal["yellow", "red"]

class ToggleOnFieldUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    number: int

class EditPlayerUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    original_number: int 
    
    number: int
    name: str
    onField: bool
    yellowCards: int
    redCards: int
    goals: List[int]

class ResetStatsUpdate(BaseModel):
    team: Literal["teamA", "teamB"]

class ReplacePlayerUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    number: int
    name: str

class MatchInfoUpdate(BaseModel):
    info: str


class DataManager:
    def __init__(self, file_path: str, scoreboard_style_path: str):
        self.file_path = file_path
        self.scoreboard_style_path = scoreboard_style_path
        self.config: ScoreboardConfig | None = None
        self.scoreboard_style: ScoreboardStyleConfig | None = None
        self._config_lock = asyncio.Lock()
        self._style_lock = asyncio.Lock()

    async def load_config(self):
        async with self._config_lock:
            try:
                async with aiofiles.open(self.file_path, mode='r') as f:
                    content = await f.read()
                    self.config = ScoreboardConfig.model_validate_json(content)
                print("Config loaded successfully.")
            except FileNotFoundError:
                print(f"CRITICAL: {self.file_path} not found.")
                raise
            except Exception as e:
                print(f"Error loading config: {e}. Check {self.file_path}.")
                raise

    async def save_config(self):
        if self.config is None: return
        # --- This path needs to be absolute, not from resource_path ---
        # We will use the original non-helper path for SAVING
        save_path = os.path.join(os.path.abspath("."), "team-info-config.json")
        if not os.path.exists(os.path.abspath(".")):
             save_path = self.file_path # Fallback
             
        async with self._config_lock:
             try:
                 async with aiofiles.open(save_path, mode='w') as f:
                     await f.write(self.config.model_dump_json(indent=2))
                 print(f"Config saved to {save_path}")
             except Exception as e:
                 print(f"!!! Critical Error saving config to {save_path}: {e}")
                 # Try saving to the original path as a last resort
                 async with aiofiles.open(self.file_path, mode='w') as f:
                     await f.write(self.config.model_dump_json(indent=2))
                 print(f"Config saved to fallback path {self.file_path}")


    async def load_scoreboard_style(self):
        async with self._style_lock:
            try:
                async with aiofiles.open(self.scoreboard_style_path, mode='r') as f:
                    content = await f.read()
                    self.scoreboard_style = ScoreboardStyleConfig.model_validate_json(content)
                print("Scoreboard style loaded.")
            except FileNotFoundError:
                 print(f"{self.scoreboard_style_path} not found, using default.")
                 self.scoreboard_style = ScoreboardStyleConfig(primary="#000000", secondary="#FFFFFF", matchInfo="")
                 await self.save_scoreboard_style()
            except Exception as e:
                print(f"Error loading scoreboard style: {e}, using default.")
                self.scoreboard_style = ScoreboardStyleConfig(primary="#000000", secondary="#FFFFFF", matchInfo="")


    async def save_scoreboard_style(self):
        if self.scoreboard_style is None:
            print("Error: Attempted to save scoreboard style, but it's None.")
            return
            
        if not isinstance(self.scoreboard_style, ScoreboardStyleConfig):
             print("Error: scoreboard_style is not a valid ScoreboardStyleConfig instance.")
             try:
                 self.scoreboard_style = ScoreboardStyleConfig.model_validate(self.scoreboard_style)
             except Exception:
                 print("Falling back to default style due to invalid data.")
                 self.scoreboard_style = ScoreboardStyleConfig(primary="#000000", secondary="#FFFFFF", matchInfo="")

        # --- This path also needs to be absolute for saving ---
        save_path = os.path.join(os.path.abspath("."), "scoreboard-customization.json")
        if not os.path.exists(os.path.abspath(".")):
             save_path = self.scoreboard_style_path # Fallback

        try:
            json_data = self.scoreboard_style.model_dump_json(indent=2)
            
            async with self._style_lock:
                 async with aiofiles.open(save_path, mode='w') as f:
                    await f.write(json_data)
            print(f"Scoreboard style successfully saved to {save_path}")
        except Exception as e:
            print(f"!!! Critical Error saving scoreboard style to {save_path}: {e}")
            # Try saving to the original path as a last resort
            async with self._style_lock:
                async with aiofiles.open(self.scoreboard_style_path, mode='w') as f:
                    await f.write(json_data)
            print(f"Scoreboard style saved to fallback path {self.scoreboard_style_path}")


    def get_scoreboard_style(self) -> ScoreboardStyleConfig:
        if self.scoreboard_style is None: raise Exception("Scoreboard style not loaded")
        return self.scoreboard_style

    async def update_scoreboard_style(self, style: ScoreboardStyleConfig) -> ScoreboardStyleConfig:
        style.matchInfo = style.matchInfo if style.matchInfo is not None else self.scoreboard_style.matchInfo
        self.scoreboard_style = style
        await self.save_scoreboard_style()
        return self.scoreboard_style

    async def update_match_info(self, info: str) -> ScoreboardStyleConfig:
        style = self.get_scoreboard_style()
        style.matchInfo = info
        await self.save_scoreboard_style()
        return style

    def get_config(self) -> ScoreboardConfig:
        if self.config is None: raise Exception("Config not loaded")
        return self.config

    # ... (all other methods: update_team_info, update_colors, set_score, etc. are unchanged) ...
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
                if update.card_type == "yellow" and player.yellowCards < 2:
                    player.yellowCards += 1
                    data_changed = True
                    print(f"Yellow card added to player #{update.number} ({update.team}).")
                elif update.card_type == "red" and player.redCards < 1:
                    player.redCards += 1
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
                player.yellowCards = min(update.yellowCards, 2)
                player.redCards = min(update.redCards, 1)
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
            player.yellowCards = 0
            player.redCards = 0
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
                player.yellowCards = 0
                player.redCards = 0
                player.goals = []
                player_found = True
                print(f"Player #{update.number} ({update.team}) replaced with {update.name} and stats reset.")
                break
        
        if not player_found:
             print(f"Could not replace player: Player #{update.number} not found.")
             raise Exception(f"Player #{update.number} not found.")

        await self.save_config()
        return config

data_manager = DataManager(CONFIG_FILE, SCOREBOARD_STYLE_FILE)