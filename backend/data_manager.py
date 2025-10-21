import asyncio
import aiofiles
from pydantic import BaseModel
from typing import Literal

CONFIG_FILE = "config.json"
# MAX_TIME_SECONDS = (999 * 60) + 59 # Removed

# --- Pydantic Data Models ---
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

# --- Config Manager Class ---
class DataManager:
    def __init__(self, file_path: str): # <-- Rolled back
        self.file_path = file_path
        self.config: ScoreboardConfig | None = None
        self._config_lock = asyncio.Lock() # <-- Rolled back

    async def load_config(self):
        """Loads the config from the JSON file into memory."""
        async with self._config_lock:
            async with aiofiles.open(self.file_path, mode='r') as f:
                content = await f.read()
                self.config = ScoreboardConfig.model_validate_json(content)
        print("Config loaded successfully.")

    async def save_config(self):
        """Saves the current in-memory config back to the JSON file."""
        if self.config is None:
            return
        async with self._config_lock:
            async with aiofiles.open(self.file_path, mode='w') as f:
                await f.write(self.config.model_dump_json(indent=2))
    
    # --- All preset methods removed ---

    def get_config(self) -> ScoreboardConfig:
        if self.config is None:
            raise Exception("Config not loaded")
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
        if score_data.score < 0:
            team_to_update.score = 0
        else:
            team_to_update.score = score_data.score
        await self.save_config()
        return config

# Create a single instance to be used by the app
data_manager = DataManager(CONFIG_FILE) # <-- Rolled back