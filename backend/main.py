import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Literal

from data_manager import (
    data_manager,
    ScoreboardConfig,
    TeamInfoUpdate,
    CustomizationUpdate,
    SetScoreUpdate,
    ScoreboardStyleConfig,
    AddPlayerUpdate,
    ClearPlayersUpdate,
    DeletePlayerUpdate,
    AddGoalUpdate,
    AddCardUpdate,
    ToggleOnFieldUpdate,
    EditPlayerUpdate,
    ResetStatsUpdate,
    ReplacePlayerUpdate,
    MatchInfoUpdate
)
from websocket_manager import websocket_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application starting up...")
    await data_manager.load_config()
    await data_manager.load_scoreboard_style()
    yield
    print("Application shutting down...")

app = FastAPI(lifespan=lifespan)

# Allow all origins, which is safe for a local desktop app
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    
    try:
        await websocket.send_json({
            "type": "config", 
            "config": data_manager.get_config().model_dump()
        })
    except Exception as e:
        print(f"Error sending initial config: {e}")

    try:
        await websocket.send_json({
            "type": "scoreboard_style",
            "style": data_manager.get_scoreboard_style().model_dump()
        })
    except Exception as e: print(f"Error sending initial scoreboard style: {e}")

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
        print("Client disconnected")

# --- Timer Control ---
@app.post("/api/timer/start")
async def start_timer():
    websocket_manager.start()
    return {"message": "Timer started"}

@app.post("/api/timer/stop")
async def stop_timer():
    websocket_manager.stop()
    return {"message": "Timer stopped"}

@app.post("/api/timer/reset")
async def reset_timer():
    websocket_manager.reset()
    return {"message": "Timer reset"}

class SetTimeUpdate(BaseModel):
    seconds: int

@app.post("/api/timer/set")
async def set_timer(update: SetTimeUpdate):
    websocket_manager.set_time(update.seconds)
    return {"message": f"Timer set to {update.seconds} seconds"}

class SetExtraTimeUpdate(BaseModel):
    minutes: int

@app.post("/api/extra-time/set")
async def set_extra_time(update: SetExtraTimeUpdate):
    websocket_manager.set_extra_time(update.minutes)
    return {"message": f"Extra time set to {update.minutes} minutes"}

@app.post("/api/extra-time/toggle")
async def toggle_extra_time():
    status = await websocket_manager.toggle_extra_time_visibility()
    return status


# --- Data Control ---
@app.get("/api/config")
async def get_full_config() -> ScoreboardConfig:
    return data_manager.get_config()

@app.post("/api/match-info")
async def update_match_info(update: MatchInfoUpdate):
    try:
        new_style = await data_manager.update_match_info(update.info)
        await websocket_manager.broadcast_scoreboard_style(new_style)
        return new_style
    except Exception as e:
        print(f"Error updating match info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/match-info/toggle")
async def toggle_match_info():
    status = await websocket_manager.toggle_match_info_visibility()
    return status

@app.post("/api/score/set")
async def set_score(update: SetScoreUpdate) -> ScoreboardConfig:
    config = await data_manager.set_score(update)
    await websocket_manager.broadcast_config(config)
    return config

@app.post("/api/team-info")
async def update_team_info(update: TeamInfoUpdate) -> ScoreboardConfig:
    config = await data_manager.update_team_info(update)
    await websocket_manager.broadcast_config(config)
    return config

@app.post("/api/customization")
async def update_customization(update: CustomizationUpdate) -> ScoreboardConfig:
    config = await data_manager.update_colors(update)
    await websocket_manager.broadcast_config(config)
    return config

@app.post("/api/game-report/toggle")
async def toggle_game_report():
    status = await websocket_manager.toggle_game_report()
    return status

@app.post("/api/scoreboard/toggle")
async def toggle_scoreboard():
    status = await websocket_manager.toggle_scoreboard()
    return status

@app.post("/api/players-list/toggle")
async def toggle_players_list():
    status = await websocket_manager.toggle_players_list()
    return status

@app.post("/api/player/add")
async def add_player(update: AddPlayerUpdate):
    try:
        config = await data_manager.add_player(update)
        await websocket_manager.broadcast_config(config)
        return config
    except Exception as e:
        print(f"Error adding player: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/player/replace")
async def replace_player(update: ReplacePlayerUpdate):
    try:
        config = await data_manager.replace_player(update)
        await websocket_manager.broadcast_config(config)
        return config
    except Exception as e:
        print(f"Error replacing player: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/player/clear")
async def clear_player_list(update: ClearPlayersUpdate):
    try:
        config = await data_manager.clear_player_list(update)
        await websocket_manager.broadcast_config(config)
        return config
    except Exception as e:
        print(f"Error clearing player list: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/player/delete")
async def delete_player(update: DeletePlayerUpdate):
    try:
        config = await data_manager.delete_player(update)
        await websocket_manager.broadcast_config(config)
        return config
    except Exception as e:
        print(f"Error deleting player: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/player/goal")
async def add_goal(update: AddGoalUpdate):
    try:
        config = await data_manager.add_goal(update)
        await websocket_manager.broadcast_config(config)
        return config
    except Exception as e:
        print(f"Error adding goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/player/card")
async def add_card(update: AddCardUpdate):
    try:
        config = await data_manager.add_card(update)
        await websocket_manager.broadcast_config(config)
        return config
    except Exception as e:
        print(f"Error adding card: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/player/togglefield")
async def toggle_on_field(update: ToggleOnFieldUpdate):
    try:
        config = await data_manager.toggle_on_field(update)
        await websocket_manager.broadcast_config(config)
        return config
    except Exception as e:
        print(f"Error toggling onField: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/player/edit")
async def edit_player(update: EditPlayerUpdate):
    try:
        config = await data_manager.edit_player(update)
        await websocket_manager.broadcast_config(config)
        return config
    except Exception as e:
        print(f"Error editing player: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/player/resetstats")
async def reset_player_stats(update: ResetStatsUpdate):
    try:
        config = await data_manager.reset_team_stats(update)
        await websocket_manager.broadcast_config(config)
        return config
    except Exception as e:
        print(f"Error resetting team stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scoreboard-style")
async def update_scoreboard_style(style: ScoreboardStyleConfig):
    try:
        new_style = await data_manager.update_scoreboard_style(style)
        await websocket_manager.broadcast_scoreboard_style(new_style)
        return new_style
    except Exception as e:
        print(f"Error updating scoreboard style: {e}")
        raise HTTPException(status_code=500, detail="Failed to save scoreboard style.")

if __name__ == "__main__":
    # --- THIS IS THE FIX ---
    # 1. Pass the 'app' object directly, not the string "main:app"
    # 2. Ensure reload=False (which is the default, so we just remove it)
    uvicorn.run(app, host="0.0.0.0", port=8000)