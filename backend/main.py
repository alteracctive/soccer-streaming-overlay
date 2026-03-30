import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel, ValidationError
from typing import Literal, List, Optional

from data_manager import (
    data_manager, ScoreboardConfig, TeamInfoUpdate, CustomizationUpdate, SetScoreUpdate, ScoreboardStyleConfig,
    StyleUpdate, AddPlayerUpdate, ClearPlayersUpdate, DeletePlayerUpdate, AddGoalUpdate, AddCardUpdate,
    ToggleOnFieldUpdate, EditPlayerUpdate, ResetStatsUpdate, ReplacePlayerUpdate, MatchInfoUpdate,
    TimerPositionUpdate, LayoutUpdate, PeriodSetting, PeriodUpdate, Shortcut, ShortcutUpdate
)
from websocket_manager import websocket_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application starting up...")
    await data_manager.load_config()
    await data_manager.load_scoreboard_style()
    await data_manager.load_period_settings()
    await data_manager.load_shortcuts() # <-- Load Shortcuts
    
    periods = data_manager.get_period_settings()
    if periods and len(periods) > 0:
        await data_manager.set_current_period(periods[0].name)
    yield
    print("Application shutting down...")

app = FastAPI(lifespan=lifespan)
origins = ["*"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    try: await websocket.send_json({"type": "config", "config": data_manager.get_config().model_dump()})
    except Exception as e: print(f"Error sending config: {e}")
    try: await websocket.send_json({"type": "scoreboard_style", "style": data_manager.get_scoreboard_style().model_dump()})
    except Exception as e: print(f"Error sending style: {e}")
    try:
        while True: await websocket.receive_text()
    except WebSocketDisconnect: websocket_manager.disconnect(websocket); print("Client disconnected")

# --- Timer Control ---
@app.post("/api/timer/start", tags=["Timer Control"])
async def start_timer(): websocket_manager.start(); return {"message": "Timer started"}

@app.post("/api/timer/stop", tags=["Timer Control"])
async def stop_timer(): websocket_manager.stop(); return {"message": "Timer stopped"}

class SetTimeUpdate(BaseModel): seconds: int
@app.post("/api/timer/set", tags=["Timer Control"])
async def set_timer(update: SetTimeUpdate): websocket_manager.set_time(update.seconds); return {"message": f"Timer set to {update.seconds} seconds"}

class SetExtraTimeUpdate(BaseModel): minutes: int
@app.post("/api/extra-time/set", tags=["Timer Control"])
async def set_extra_time(update: SetExtraTimeUpdate): websocket_manager.set_extra_time(update.minutes); return {"message": f"Extra time set to {update.minutes} minutes"}

@app.post("/api/extra-time/toggle", tags=["Timer Control"])
async def toggle_extra_time(): status = await websocket_manager.toggle_extra_time_visibility(); return status

class SetFutsalClockUpdate(BaseModel): is_on: bool
@app.post("/api/timer/futsal-toggle", tags=["Timer Control"])
async def set_futsal_clock(update: SetFutsalClockUpdate): websocket_manager.set_futsal_clock(update.is_on); return {"message": f"Futsal clock set to {update.is_on}"}

@app.get("/api/periods-settings", tags=["Timer Control"])
async def get_periods() -> List[PeriodSetting]: return data_manager.get_period_settings()

class PeriodsUpdate(BaseModel):
    periods: List[PeriodSetting]
    is_ascending: bool

@app.post("/api/periods-settings", tags=["Timer Control"])
async def save_periods(update: PeriodsUpdate):
    await data_manager.save_period_settings(update.periods, update.is_ascending)
    return {"message": "Period settings saved"}

@app.post("/api/period", tags=["Timer Control"])
async def set_current_period(update: PeriodUpdate): config = await data_manager.set_current_period(update.name); await websocket_manager.broadcast_config(config); return {"message": f"Period set to {update.name}"}

# --- Shortcut Endpoints ---
@app.get("/api/shortcuts", tags=["Shortcuts"])
async def get_shortcuts() -> List[Shortcut]:
    return data_manager.get_shortcuts()

@app.post("/api/shortcuts", tags=["Shortcuts"])
async def update_shortcut(update: ShortcutUpdate):
    shortcuts = await data_manager.update_shortcut(update)
    # Broadcast or let client refetch? Let's just return list.
    # Ideally broadcast to all clients if multiple are open.
    # For now, let's keep it simple.
    return shortcuts

# --- Team & Player Data ---
@app.get("/api/config", tags=["Team & Player Data"])
async def get_full_config() -> ScoreboardConfig: return data_manager.get_config()

@app.post("/api/score/set", tags=["Team & Player Data"])
async def set_score(update: SetScoreUpdate) -> ScoreboardConfig: config = await data_manager.set_score(update); await websocket_manager.broadcast_config(config); return config

@app.post("/api/team-info", tags=["Team & Player Data"])
async def update_team_info(update: TeamInfoUpdate) -> ScoreboardConfig: config = await data_manager.update_team_info(update); await websocket_manager.broadcast_config(config); return config

@app.post("/api/customization", tags=["Team & Player Data"])
async def update_customization(update: CustomizationUpdate) -> ScoreboardConfig: config = await data_manager.update_colors(update); await websocket_manager.broadcast_config(config); return config

@app.post("/api/player/add", tags=["Team & Player Data"])
async def add_player(update: AddPlayerUpdate): config = await data_manager.add_player(update); await websocket_manager.broadcast_config(config); return config

@app.post("/api/player/replace", tags=["Team & Player Data"])
async def replace_player(update: ReplacePlayerUpdate): config = await data_manager.replace_player(update); await websocket_manager.broadcast_config(config); return config

@app.post("/api/player/clear", tags=["Team & Player Data"])
async def clear_player_list(update: ClearPlayersUpdate): config = await data_manager.clear_player_list(update); await websocket_manager.broadcast_config(config); return config

@app.post("/api/player/delete", tags=["Team & Player Data"])
async def delete_player(update: DeletePlayerUpdate): config = await data_manager.delete_player(update); await websocket_manager.broadcast_config(config); return config

@app.post("/api/player/goal", tags=["Team & Player Data"])
async def add_goal(update: AddGoalUpdate): config = await data_manager.add_goal(update); await websocket_manager.broadcast_config(config); return config

@app.post("/api/player/card", tags=["Team & Player Data"])
async def add_card(update: AddCardUpdate): config = await data_manager.add_card(update); await websocket_manager.broadcast_config(config); return config

@app.post("/api/player/togglefield", tags=["Team & Player Data"])
async def toggle_on_field(update: ToggleOnFieldUpdate): config = await data_manager.toggle_on_field(update); await websocket_manager.broadcast_config(config); return config

@app.post("/api/player/edit", tags=["Team & Player Data"])
async def edit_player(update: EditPlayerUpdate): config = await data_manager.edit_player(update); await websocket_manager.broadcast_config(config); return config

@app.post("/api/player/resetstats", tags=["Team & Player Data"])
async def reset_player_stats(update: ResetStatsUpdate): config = await data_manager.reset_team_stats(update); await websocket_manager.broadcast_config(config); return config

# --- Scoreboard & Overlays ---
class VarUpdate(BaseModel):
    isVisible: Optional[bool] = None
    scenario: Optional[str] = None
    message: Optional[str] = None
    decision: Optional[str] = None

@app.post("/api/var-update", tags=["VAR Control"])
async def update_var(update: VarUpdate):
    await websocket_manager.broadcast_var_update(update.model_dump(exclude_none=True))
    return {"message": "VAR updated"}

@app.post("/api/match-info", tags=["Scoreboard & Overlays"])
async def update_match_info(update: MatchInfoUpdate): new_style = await data_manager.update_match_info(update.info); await websocket_manager.broadcast_scoreboard_style(new_style); return new_style

@app.post("/api/match-info/toggle", tags=["Scoreboard & Overlays"])
async def toggle_match_info(): status = await websocket_manager.toggle_match_info_visibility(); return status

@app.post("/api/layout", tags=["Scoreboard & Overlays"])
async def update_layout(update: LayoutUpdate): new_style = await data_manager.update_layout(update); await websocket_manager.broadcast_scoreboard_style(new_style); return new_style

@app.post("/api/scoreboard-style", tags=["Scoreboard & Overlays"])
async def update_scoreboard_style(style: StyleUpdate): new_style = await data_manager.update_scoreboard_style(style); await websocket_manager.broadcast_scoreboard_style(new_style); return new_style

@app.post("/api/game-report/toggle", tags=["Scoreboard & Overlays"])
async def toggle_game_report(): status = await websocket_manager.toggle_game_report(); return status

@app.post("/api/scoreboard/toggle", tags=["Scoreboard & Overlays"])
async def toggle_scoreboard(): status = await websocket_manager.toggle_scoreboard(); return status

class SetPlayersListVisibility(BaseModel):
    visibleA: bool
    visibleB: bool

@app.post("/api/players-list/toggle-a", tags=["Scoreboard & Overlays"])
async def toggle_players_list_a(): return await websocket_manager.toggle_players_list_a()

@app.post("/api/players-list/toggle-b", tags=["Scoreboard & Overlays"])
async def toggle_players_list_b(): return await websocket_manager.toggle_players_list_b()

@app.post("/api/players-list/set", tags=["Scoreboard & Overlays"])
async def set_players_list_visibility(update: SetPlayersListVisibility):
    return await websocket_manager.set_players_list_visibility(update.visibleA, update.visibleB)

# --- Import & Export ---
@app.get("/api/json/{file_name}", tags=["Import & Export"])
async def get_json_file(file_name: str):
    try:
        content = await data_manager.get_raw_json(file_name)
        return Response(content=content, media_type="application/json")
    except FileNotFoundError: raise HTTPException(status_code=404, detail="File not found.")
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

class UploadData(BaseModel):
    file_name: Literal["team-info-config.json", "scoreboard-customization.json", "time-period-setting.json", "shortcuts.json"]
    json_data: str

@app.post("/api/json/upload", tags=["Import & Export"])
async def upload_json_file(data: UploadData):
    try:
        # data_manager.set_raw_json returns list of warnings now
        warnings = await data_manager.set_raw_json(data.file_name, data.json_data)
        
        await websocket_manager.broadcast_config(data_manager.get_config())
        await websocket_manager.broadcast_scoreboard_style(data_manager.get_scoreboard_style())
        
        return {"message": "File imported successfully.", "warnings": warnings}
    except ValidationError as e: raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")
    except Exception as e: raise HTTPException(status_code=500, detail=f"Error: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
