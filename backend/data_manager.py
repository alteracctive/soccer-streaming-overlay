import asyncio
import aiofiles
import json
from pydantic import BaseModel, Field
from typing import Literal, List

CONFIG_FILE = "team-info-config.json"
# Ensure this filename is exactly correct
SCOREBOARD_STYLE_FILE = "scoreboard-customization.json"

class ScoreboardStyleConfig(BaseModel):
    primary: str
    secondary: str
    opacity: int = Field(default=75, ge=50, le=100)
    scale: int = Field(default=100, ge=50, le=150)

class ColorConfig(BaseModel):
    primary: str
    secondary: str

class TeamConfig(BaseModel):
    name: str
    abbreviation: str
    score: int
    colors: ColorConfig

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
            async with aiofiles.open(self.file_path, mode='r') as f:
                content = await f.read()
                self.config = ScoreboardConfig.model_validate_json(content)
        print("Config loaded successfully.")

    async def save_config(self):
        if self.config is None: return
        async with self._config_lock:
            async with aiofiles.open(self.file_path, mode='w') as f:
                await f.write(self.config.model_dump_json(indent=2))

    async def load_scoreboard_style(self):
        async with self._style_lock:
            try:
                async with aiofiles.open(self.scoreboard_style_path, mode='r') as f:
                    content = await f.read()
                    # Pydantic validates scale range on load
                    self.scoreboard_style = ScoreboardStyleConfig.model_validate_json(content)
                print("Scoreboard style loaded.")
            except FileNotFoundError:
                 print(f"{self.scoreboard_style_path} not found, using default.")
                 # Default model includes default scale
                 self.scoreboard_style = ScoreboardStyleConfig()
                 await self.save_scoreboard_style()
            except Exception as e:
                print(f"Error loading scoreboard style: {e}, using default.")
                self.scoreboard_style = ScoreboardStyleConfig()


    async def save_scoreboard_style(self):
        """Saves the current style back to the JSON file."""
        if self.scoreboard_style is None:
            print("Error: Attempted to save scoreboard style, but it's None.")
            return
            
        # Ensure the data to be saved is a valid model instance
        if not isinstance(self.scoreboard_style, ScoreboardStyleConfig):
             print("Error: scoreboard_style is not a valid ScoreboardStyleConfig instance.")
             # Try to re-validate just in case, or use default
             try:
                 self.scoreboard_style = ScoreboardStyleConfig.model_validate(self.scoreboard_style)
             except Exception:
                 print("Falling back to default style due to invalid data.")
                 self.scoreboard_style = ScoreboardStyleConfig(primary="#000000", secondary="#FFFFFF")

        try:
            # Generate the JSON string *before* the lock/file open
            json_data = self.scoreboard_style.model_dump_json(indent=2)
            
            async with self._style_lock:
                async with aiofiles.open(self.scoreboard_style_path, mode='w') as f:
                    await f.write(json_data)
            print(f"Scoreboard style successfully saved to {self.scoreboard_style_path}") # Confirmation
        except Exception as e:
            print(f"!!! Critical Error saving scoreboard style to {self.scoreboard_style_path}: {e}")

    def get_scoreboard_style(self) -> ScoreboardStyleConfig:
        if self.scoreboard_style is None: raise Exception("Scoreboard style not loaded")
        return self.scoreboard_style

    async def update_scoreboard_style(self, style: ScoreboardStyleConfig) -> ScoreboardStyleConfig:
        # Pydantic validates incoming style, including scale
        self.scoreboard_style = style
        await self.save_scoreboard_style()
        return self.scoreboard_style

    def get_config(self) -> ScoreboardConfig: # ... (unchanged below)
        if self.config is None: raise Exception("Config not loaded")
        return self.config
    async def update_team_info(self, info: TeamInfoUpdate) -> ScoreboardConfig: # ...
        config = self.get_config()
        config.teamA.name = info.teamA.get('name', config.teamA.name)
        config.teamA.abbreviation = info.teamA.get('abbreviation', config.teamA.abbreviation)
        config.teamB.name = info.teamB.get('name', config.teamB.name)
        config.teamB.abbreviation = info.teamB.get('abbreviation', config.teamB.abbreviation)
        await self.save_config()
        return config
    async def update_colors(self, colors: CustomizationUpdate) -> ScoreboardConfig: # ...
        config = self.get_config()
        config.teamA.colors = colors.teamA
        config.teamB.colors = colors.teamB
        await self.save_config()
        return config
    async def set_score(self, score_data: SetScoreUpdate) -> ScoreboardConfig: # ...
        config = self.get_config()
        team_to_update = getattr(config, score_data.team)
        if score_data.score < 0: team_to_update.score = 0
        else: team_to_update.score = score_data.score
        await self.save_config()
        return config

data_manager = DataManager(CONFIG_FILE, SCOREBOARD_STYLE_FILE)