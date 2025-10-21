import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel # *** IMPORT BaseModel ***

# Import our managers and data models
from data_manager import (
    data_manager,
    ScoreboardConfig,
    TeamInfoUpdate,
    CustomizationUpdate,
    SetScoreUpdate  # *** IMPORT SetScoreUpdate ***
)
from timer_manager import timer_manager

# --- App Lifecycle ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application starting up...")
    await data_manager.load_config()
    yield
    print("Application shutting down...")


app = FastAPI(lifespan=lifespan)

# --- CORS Middleware ---
origins = [
    "http://localhost:5173",
]
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
    await timer_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        timer_manager.disconnect(websocket)
        print("Client disconnected")


# --- HTTP API Endpoints ---

# --- Timer Control ---
@app.post("/api/timer/start")
async def start_timer():
    timer_manager.start()
    return {"message": "Timer started"}

@app.post("/api/timer/stop")
async def stop_timer():
    timer_manager.stop()
    return {"message": "Timer stopped"}

@app.post("/api/timer/reset")
async def reset_timer():
    timer_manager.reset()
    return {"message": "Timer reset"}

# *** NEW MODEL AND ENDPOINT FOR SETTING TIME ***
class SetTimeUpdate(BaseModel):
    seconds: int

@app.post("/api/timer/set")
async def set_timer(update: SetTimeUpdate):
    timer_manager.set_time(update.seconds)
    return {"message": f"Timer set to {update.seconds} seconds"}

# --- Data Control ---
@app.get("/api/config")
async def get_full_config() -> ScoreboardConfig:
    """Gets the entire current scoreboard configuration."""
    return data_manager.get_config()

# *** UPDATED ENDPOINT FOR SETTING SCORE ***
@app.post("/api/score/set")
async def set_score(update: SetScoreUpdate) -> ScoreboardConfig:
    """Sets the score for one team to an exact value."""
    return await data_manager.set_score(update)

@app.post("/api/team-info")
async def update_team_info(update: TeamInfoUpdate) -> ScoreboardConfig:
    """Sets the team names and abbreviations."""
    return await data_manager.update_team_info(update)

@app.post("/api/customization")
async def update_customization(update: CustomizationUpdate) -> ScoreboardConfig:
    """Sets the team colors."""
    return await data_manager.update_colors(update)


# --- Run the App ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)