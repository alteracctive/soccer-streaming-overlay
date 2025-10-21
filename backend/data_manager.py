import asyncio
import aiofiles
from pydantic import BaseModel
from typing import Literal

CONFIG_FILE = "config.json"

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
    
# *** NEW MODEL ***
# Replaces the old ScoreUpdate model
class SetScoreUpdate(BaseModel):
    team: Literal["teamA", "teamB"]
    score: int

# --- Config Manager Class ---

class DataManager:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.config: ScoreboardConfig | None = None
        self._lock = asyncio.Lock()

    async def load_config(self):
        """Loads the config from the JSON file into memory."""
        async with self._lock:
            async with aiofiles.open(self.file_path, mode='r') as f:
                content = await f.read()
                self.config = ScoreboardConfig.model_validate_json(content)
        print("Config loaded successfully.")

    async def save_config(self):
        """Saves the current in-memory config back to the JSON file."""
        if self.config is None:
            return
            
        async with self._lock:
            async with aiofiles.open(self.file_path, mode='w') as f:
                await f.write(self.config.model_dump_json(indent=2))

    def get_config(self) -> ScoreboardConfig:
        """Gets the current config. Loads it if not already in memory."""
        if self.config is None:
            raise Exception("Config not loaded") # Changed to a generic Exception
        return self.config

    async def update_team_info(self, info: TeamInfoUpdate) -> ScoreboardConfig:
        """Updates team names and abbreviations."""
        config = self.get_config()
        config.teamA.name = info.teamA.get('name', config.teamA.name)
        config.teamA.abbreviation = info.teamA.get('abbreviation', config.teamA.abbreviation)
        config.teamB.name = info.teamB.get('name', config.teamB.name)
        config.teamB.abbreviation = info.teamB.get('abbreviation', config.teamB.abbreviation)
        await self.save_config()
        return config

    async def update_colors(self, colors: CustomizationUpdate) -> ScoreboardConfig:
        """Updates team colors."""
        config = self.get_config()
        config.teamA.colors = colors.teamA
        config.teamB.colors = colors.teamB
        await self.save_config()
        return config

    # *** NEW METHOD ***
    # Replaces the old update_score method
    async def set_score(self, score_data: SetScoreUpdate) -> ScoreboardConfig:
        """Sets the score for a single team to an exact value."""
        config = self.get_config()
        
        team_to_update = getattr(config, score_data.team) # Gets config.teamA or config.teamB
        
        if score_data.score < 0:
            team_to_update.score = 0
        else:
            team_to_update.score = score_data.score
            
        await self.save_config()
        return config

# Create a single instance to be used by the app
data_manager = DataManager(CONFIG_FILE)