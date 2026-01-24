import asyncio
import aiofiles
import json
import sys
import os
from pydantic import BaseModel, Field, ValidationError
from typing import Literal, List, Optional

# --- Helper Function ---
def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        # Not in a PyInstaller bundle, use normal path
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

# --- Path Definitions ---
WRITABLE_DIR = os.path.abspath(".")
WRITABLE_CONFIG_FILE = os.path.join(WRITABLE_DIR, "team-info-config.json")
WRITABLE_STYLE_FILE = os.path.join(WRITABLE_DIR, "scoreboard-customization.json")
WRITABLE_PERIOD_FILE = os.path.join(WRITABLE_DIR, "time-period-setting.json")
WRITABLE_SHORTCUT_FILE = os.path.join(WRITABLE_DIR, "shortcuts.json") # <-- New

BUNDLED_CONFIG_FILE = resource_path("team-info-config.json")
BUNDLED_STYLE_FILE = resource_path("scoreboard-customization.json")
BUNDLED_PERIOD_FILE = resource_path("time-period-setting.json")
BUNDLED_SHORTCUT_FILE = resource_path("shortcuts.json") # <-- New


class ScoreboardStyleConfig(BaseModel):
    primary: str = "#000000"
    secondary: str = "#FFFFFF"
    tertiary: str = "#ffd700"
    opacity: int = Field(default=75, ge=50, le=100)
    scale: int = Field(default=100, ge=50, le=150)
    matchInfo: str = ""
    timerPosition: Literal["Under", "Right"] = "Under"
    showRedCardIndicators: bool = False

class ColorConfig(BaseModel):
    primary: str = "#FF0000"
    secondary: str = "#FFFFFF"

class Goal(BaseModel):
    regMinute: int
    addMinute: int = 0
    isOwnGoal: bool = False

class Card(BaseModel):
    regMinute: int
    addMinute: int = 0

class PlayerConfig(BaseModel):
    number: int
    name: str
    onField: bool = False
    yellowCards: List[Card] = []
    redCards: List[Card] = []
    goals: List[Goal] = []

class TeamConfig(BaseModel):
    name: str = "TEAM"
    abbreviation: str = "TMA"
    score: int = 0
    colors: ColorConfig = Field(default_factory=ColorConfig)
    players: List[PlayerConfig] = []

class ScoreboardConfig(BaseModel):
    teamA: TeamConfig = Field(default_factory=TeamConfig)
    teamB: TeamConfig = Field(default_factory=TeamConfig)
    currentPeriod: str = "First Half"

class PeriodSetting(BaseModel):
    name: str
    endTime: int

# --- New Shortcut Model ---
class Shortcut(BaseModel):
    action_id: str
    label: str
    key: Optional[str] = None # Key code, e.g. "Space", "KeyA"

class ShortcutUpdate(BaseModel):
    action_id: str
    key: Optional[str]

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
    regMinute: int
    addMinute: int
    isOwnGoal: bool

class AddCardUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    number: int
    card_type: Literal["yellow", "red"]
    regMinute: int
    addMinute: int

class ToggleOnFieldUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    number: int

class EditPlayerUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    original_number: int 
    
    number: int
    name: str
    onField: bool
    yellowCards: List[Card]
    redCards: List[Card]
    goals: List[Goal]

class ResetStatsUpdate(BaseModel):
    team: Literal["teamA", "teamB"]

class ReplacePlayerUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    number: int
    name: str

class MatchInfoUpdate(BaseModel):
    info: str

class TimerPositionUpdate(BaseModel):
    position: Literal["Under", "Right"]

class LayoutUpdate(BaseModel):
    position: Literal["Under", "Right"]
    showRedCardIndicators: bool

class StyleUpdate(BaseModel):
    primary: str
    secondary: str
    tertiary: str
    opacity: int
    scale: int
    
class PeriodUpdate(BaseModel):
    name: str


class DataManager:
    def __init__(self, file_path: str, scoreboard_style_path: str):
        self.file_path = file_path
        self.scoreboard_style_path = scoreboard_style_path
        self.config: ScoreboardConfig | None = None
        self.scoreboard_style: ScoreboardStyleConfig | None = None
        self.period_settings: List[PeriodSetting] = []
        self.shortcuts: List[Shortcut] = [] # <-- Shortcuts state
        self._config_lock = asyncio.Lock()
        self._style_lock = asyncio.Lock()

    async def _save_config_nolock(self):
        if self.config is None: return
        try:
            async with aiofiles.open(self.file_path, mode='w') as f:
                await f.write(self.config.model_dump_json(indent=2, exclude={'currentPeriod'}))
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

    # --- New Shortcut Methods ---
    async def load_shortcuts(self):
        default_shortcuts = [
            Shortcut(action_id="toggle_timer", label="Start/Stop Timer", key="Space")
        ]
        
        try:
            path = WRITABLE_SHORTCUT_FILE
            if not os.path.exists(path):
                # Save defaults if not exists
                self.shortcuts = default_shortcuts
                async with aiofiles.open(path, mode='w') as f:
                    await f.write(json.dumps([s.model_dump() for s in self.shortcuts], indent=2))
                print("Default shortcuts created.")
                return

            async with aiofiles.open(path, mode='r') as f:
                content = await f.read()
                data = json.loads(content)
                loaded_shortcuts = [Shortcut.model_validate(item) for item in data]
                
                # Merge with defaults to ensure all actions exist (in case of updates)
                final_shortcuts = []
                loaded_map = {s.action_id: s for s in loaded_shortcuts}
                
                for default in default_shortcuts:
                    if default.action_id in loaded_map:
                        final_shortcuts.append(loaded_map[default.action_id])
                    else:
                        final_shortcuts.append(default)
                
                self.shortcuts = final_shortcuts
            print("Shortcuts loaded.")
        except Exception as e:
            print(f"Error loading shortcuts: {e}")
            self.shortcuts = default_shortcuts

    def get_shortcuts(self) -> List[Shortcut]:
        return self.shortcuts

    async def update_shortcut(self, update: ShortcutUpdate) -> List[Shortcut]:
        for s in self.shortcuts:
            if s.action_id == update.action_id:
                s.key = update.key
                break
        
        # Save to file
        async with aiofiles.open(WRITABLE_SHORTCUT_FILE, mode='w') as f:
            await f.write(json.dumps([s.model_dump() for s in self.shortcuts], indent=2))
        return self.shortcuts

    # ... (load_config, load_scoreboard_style, load_period_settings remain unchanged) ...
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
                                if 'goals' in player:
                                    new_goals = []
                                    for g in player['goals']:
                                        if isinstance(g, int):
                                            is_og = g < 0
                                            minute = abs(g)
                                            new_goals.append({"regMinute": minute, "addMinute": 0, "isOwnGoal": is_og})
                                            migrated = True
                                        else: new_goals.append(g)
                                    player['goals'] = new_goals
                                if 'yellowCards' in player:
                                    new_yellows = []
                                    for y in player['yellowCards']:
                                        if isinstance(y, int):
                                            new_yellows.append({"regMinute": y, "addMinute": 0})
                                            migrated = True
                                        else: new_yellows.append(y)
                                    player['yellowCards'] = new_yellows
                                if 'redCards' in player:
                                    new_reds = []
                                    for r in player['redCards']:
                                        if isinstance(r, int):
                                            new_reds.append({"regMinute": r, "addMinute": 0})
                                            migrated = True
                                        else: new_reds.append(r)
                                    player['redCards'] = new_reds
                    if 'currentPeriod' not in data: data['currentPeriod'] = "First Half"
                    self.config = ScoreboardConfig.model_validate(data)
                print("Config loaded successfully.")
                if migrated: await self._save_config_nolock()
            except (FileNotFoundError, ValidationError):
                print(f"Writable config not found. Loading default.")
                try:
                    async with aiofiles.open(BUNDLED_CONFIG_FILE, mode='r') as f:
                        content = await f.read()
                        self.config = ScoreboardConfig.model_validate_json(content)
                    await self._save_config_nolock() 
                except Exception as e: print(f"CRITICAL: Could not load bundled config: {e}"); raise

    async def load_scoreboard_style(self):
        async with self._style_lock:
            try:
                async with aiofiles.open(self.scoreboard_style_path, mode='r') as f:
                    content = await f.read()
                    data = json.loads(content)
                    if 'textColorPrimary' in data: data['secondary'] = data.pop('textColorPrimary')
                    if 'textColorTertiary' in data: data['tertiary'] = data.pop('textColorTertiary')
                    if 'textColorSecondary' in data: data['tertiary'] = data.pop('textColorSecondary')
                    if 'showRedCardBoxes' in data: data['showRedCardIndicators'] = data.pop('showRedCardBoxes')
                    if 'timerPosition' not in data: data['timerPosition'] = 'Under'
                    if 'matchInfo' not in data: data['matchInfo'] = ''
                    if 'showRedCardIndicators' not in data: data['showRedCardIndicators'] = False
                    if 'secondary' not in data: data['secondary'] = '#FFFFFF'
                    if 'tertiary' not in data: data['tertiary'] = '#ffd700'
                    self.scoreboard_style = ScoreboardStyleConfig.model_validate(data)
                print("Scoreboard style loaded.")
            except (FileNotFoundError, ValidationError):
                print(f"Writable style not found. Loading default.")
                try:
                    async with aiofiles.open(BUNDLED_STYLE_FILE, mode='r') as f:
                        content = await f.read()
                        data = json.loads(content)
                        if 'textColorPrimary' in data: data['secondary'] = data.pop('textColorPrimary')
                        if 'textColorTertiary' in data: data['tertiary'] = data.pop('textColorTertiary')
                        if 'textColorSecondary' in data: data['tertiary'] = data.pop('textColorSecondary')
                        if 'showRedCardBoxes' in data: data['showRedCardIndicators'] = data.pop('showRedCardBoxes')
                        if 'timerPosition' not in data: data['timerPosition'] = 'Under'
                        if 'matchInfo' not in data: data['matchInfo'] = ''
                        if 'showRedCardIndicators' not in data: data['showRedCardIndicators'] = False
                        if 'secondary' not in data: data['secondary'] = '#FFFFFF'
                        if 'tertiary' not in data: data['tertiary'] = '#ffd700'
                        self.scoreboard_style = ScoreboardStyleConfig.model_validate(data)
                    await self._save_scoreboard_style_nolock()
                except Exception as e:
                    print(f"CRITICAL: Could not load bundled style: {e}")
                    self.scoreboard_style = ScoreboardStyleConfig()
                    await self._save_scoreboard_style_nolock()

    async def load_period_settings(self):
        try:
            path = WRITABLE_PERIOD_FILE if os.path.exists(WRITABLE_PERIOD_FILE) else BUNDLED_PERIOD_FILE
            async with aiofiles.open(path, mode='r') as f:
                content = await f.read()
                data = json.loads(content)
                self.period_settings = [PeriodSetting.model_validate(item) for item in data]
            print("Period settings loaded.")
        except Exception as e:
             print(f"Error loading period settings: {e}")
             self.period_settings = []

    def get_period_settings(self) -> List[PeriodSetting]: return self.period_settings
    async def set_current_period(self, period_name: str) -> ScoreboardConfig:
        config = self.get_config()
        config.currentPeriod = period_name
        await self.save_config()
        return config

    # --- Updated Raw JSON handling ---
    async def get_raw_json(self, file_name: str) -> str:
        path_to_read = None
        if file_name == "team-info-config.json": path_to_read = self.file_path
        elif file_name == "scoreboard-customization.json": path_to_read = self.scoreboard_style_path
        elif file_name == "time-period-setting.json": path_to_read = WRITABLE_PERIOD_FILE if os.path.exists(WRITABLE_PERIOD_FILE) else BUNDLED_PERIOD_FILE
        elif file_name == "shortcuts.json": path_to_read = WRITABLE_SHORTCUT_FILE if os.path.exists(WRITABLE_SHORTCUT_FILE) else BUNDLED_SHORTCUT_FILE

        if path_to_read and os.path.exists(path_to_read):
            async with aiofiles.open(path_to_read, mode='r') as f: return await f.read()
        raise FileNotFoundError(f"{file_name} not found.")

    async def set_raw_json(self, file_name: str, raw_json_data: str) -> List[str]:
        """Returns a list of warning messages (e.g. failed shortcut imports)"""
        path_to_write = None
        data_to_write = ""
        warnings = []

        try:
            if file_name == "team-info-config.json":
                model = ScoreboardConfig.model_validate_json(raw_json_data)
                path_to_write = self.file_path
                data_to_write = model.model_dump_json(indent=2, exclude={'currentPeriod'})
            elif file_name == "scoreboard-customization.json":
                model = ScoreboardStyleConfig.model_validate_json(raw_json_data)
                path_to_write = self.scoreboard_style_path
                data_to_write = model.model_dump_json(indent=2)
            elif file_name == "time-period-setting.json":
                raw_list = json.loads(raw_json_data)
                if not isinstance(raw_list, list): raise ValueError("Root element must be a list")
                models = [PeriodSetting.model_validate(item) for item in raw_list]
                path_to_write = WRITABLE_PERIOD_FILE
                data_to_write = json.dumps([m.model_dump() for m in models], indent=2)
                
            elif file_name == "shortcuts.json":
                # --- Specific Import Logic for Shortcuts ---
                imported_shortcuts = json.loads(raw_json_data)
                if not isinstance(imported_shortcuts, list):
                    raise ValueError("Root element must be a list")
                
                # 1. Map existing valid shortcuts by ID
                existing_map = {s.action_id: s for s in self.shortcuts}
                
                # 2. Iterate imported data
                for item in imported_shortcuts:
                    action_id = item.get("action_id")
                    key = item.get("key")
                    
                    if action_id in existing_map:
                        # Valid action: update key
                        existing_map[action_id].key = key
                    else:
                        # Unknown action: ignore and warn
                        warnings.append(f"Unknown shortcut action ignored: {action_id}")
                
                # 3. Save Updated List
                path_to_write = WRITABLE_SHORTCUT_FILE
                data_to_write = json.dumps([s.model_dump() for s in self.shortcuts], indent=2)
                
            else: raise Exception("Invalid file name.")
            
            async with aiofiles.open(path_to_write, mode='w') as f: await f.write(data_to_write)
            
            # Reload
            if file_name == "team-info-config.json": await self.load_config()
            elif file_name == "scoreboard-customization.json": await self.load_scoreboard_style()
            elif file_name == "time-period-setting.json": await self.load_period_settings()
            elif file_name == "shortcuts.json": await self.load_shortcuts()
            
            return warnings

        except ValidationError as e:
            raise Exception(f"Invalid JSON structure. {str(e)}")
        except Exception as e: raise e

    # ... (Rest of DataManager methods unchanged: get_scoreboard_style, update_scoreboard_style, update_match_info, update_layout, get_config, update_team_info, update_colors, set_score, add_player, clear_player_list, delete_player, add_goal, add_card, toggle_on_field, edit_player, reset_team_stats, replace_player) ...
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
        style.showRedCardIndicators = layout.showRedCardIndicators
        await self.save_scoreboard_style()
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
            if player.number == update.number: raise Exception(f"Player number {update.number} already exists.")
        new_player = PlayerConfig(number=update.number, name=update.name)
        team_to_update.players.append(new_player)
        team_to_update.players.sort(key=lambda p: p.number)
        await self.save_config()
        return config

    async def clear_player_list(self, update: ClearPlayersUpdate) -> ScoreboardConfig:
        config = self.get_config()
        team_to_update = getattr(config, update.team)
        team_to_update.players.clear()
        await self.save_config()
        return config

    async def delete_player(self, update: DeletePlayerUpdate) -> ScoreboardConfig:
        config = self.get_config()
        team_to_update = getattr(config, update.team)
        original_count = len(team_to_update.players)
        team_to_update.players = [p for p in team_to_update.players if p.number != update.number]
        if original_count != len(team_to_update.players): await self.save_config()
        return config

    async def add_goal(self, update: AddGoalUpdate) -> ScoreboardConfig:
        config = self.get_config()
        team_to_update = getattr(config, update.team)
        for player in team_to_update.players:
            if player.number == update.number:
                new_goal = Goal(
                    regMinute=update.regMinute,
                    addMinute=update.addMinute,
                    isOwnGoal=update.isOwnGoal
                )
                player.goals.append(new_goal)
                player.goals.sort(key=lambda g: (g.regMinute, g.addMinute))
                await self.save_config()
                break
        return config

    async def add_card(self, update: AddCardUpdate) -> ScoreboardConfig:
        config = self.get_config()
        team = getattr(config, update.team)
        for player in team.players:
            if player.number == update.number:
                new_card = Card(regMinute=update.regMinute, addMinute=update.addMinute)
                if update.card_type == "yellow" and len(player.yellowCards) < 2:
                    player.yellowCards.append(new_card)
                    player.yellowCards.sort(key=lambda c: (c.regMinute, c.addMinute))
                    await self.save_config()
                elif update.card_type == "red" and len(player.redCards) < 1:
                    player.redCards.append(new_card)
                    await self.save_config()
                break
        return config

    async def toggle_on_field(self, update: ToggleOnFieldUpdate) -> ScoreboardConfig:
        config = self.get_config()
        team = getattr(config, update.team)
        for player in team.players:
            if player.number == update.number:
                player.onField = not player.onField 
                await self.save_config()
                break
        return config

    async def edit_player(self, update: EditPlayerUpdate) -> ScoreboardConfig:
        config = self.get_config()
        team = getattr(config, update.team)
        if update.original_number != update.number:
            for p in team.players:
                if p.number == update.number: raise Exception(f"Player number {update.number} already exists.")
        for player in team.players:
            if player.number == update.original_number:
                player.number = update.number
                player.name = update.name
                player.onField = update.onField
                player.yellowCards = sorted(update.yellowCards, key=lambda c: (c.regMinute, c.addMinute))[:2]
                player.redCards = sorted(update.redCards, key=lambda c: (c.regMinute, c.addMinute))[:1]
                player.goals = sorted(update.goals, key=lambda g: (g.regMinute, g.addMinute))
                await self.save_config()
                break
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
        return config
        
    async def replace_player(self, update: ReplacePlayerUpdate) -> ScoreboardConfig:
        config = self.get_config()
        team = getattr(config, update.team)
        for player in team.players:
            if player.number == update.number:
                player.name = update.name
                player.onField = False
                player.yellowCards = []
                player.redCards = []
                player.goals = []
                await self.save_config()
                break
        return config

data_manager = DataManager(WRITABLE_CONFIG_FILE, WRITABLE_STYLE_FILE)