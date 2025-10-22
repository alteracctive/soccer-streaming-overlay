import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel

from data_manager import (
    data_manager,
    ScoreboardConfig,
    TeamInfoUpdate,
    CustomizationUpdate,
    SetScoreUpdate
)
from websocket_manager import websocket_manager

# --- App Lifecycle ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application starting up...")
    await data_manager.load_config()
    # --- load_presets removed ---
    yield
    print("Application shutting down...")

app = FastAPI(lifespan=lifespan)

# --- CORS Middleware ---
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WebSocket Endpoint ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    
    # Send initial config
    try:
        await websocket.send_json({
            "type": "config", 
            "config": data_manager.get_config().model_dump()
        })
    except Exception as e:
        print(f"Error sending initial config: {e}")

    # --- Initial presets broadcast removed ---

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
        print("Client disconnected")

# --- HTTP API Endpoints ---

# --- Timer Control (use websocket_manager) ---
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

# --- Data Control (Broadcast changes) ---
@app.get("/api/config")
async def get_full_config() -> ScoreboardConfig:
    return data_manager.get_config()
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

# --- Preset endpoints removed ---

# --- Run the App ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)