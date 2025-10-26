import asyncio
from fastapi import WebSocket
from data_manager import ScoreboardConfig, ScoreboardStyleConfig

class WebSocketManager:
    def __init__(self):
        self._is_running: bool = False
        self._seconds: int = 0
        self._timer_task: asyncio.Task | None = None
        self._active_connections: list[WebSocket] = []

    def get_status(self):
        """Returns the current timer status."""
        return {"isRunning": self._is_running, "seconds": self._seconds}

    async def connect(self, websocket: WebSocket):
        """Adds a new client to the broadcast list."""
        await websocket.accept()
        self._active_connections.append(websocket)
        await self.broadcast_status()

    def disconnect(self, websocket: WebSocket):
        """Removes a client from the broadcast list."""
        self._active_connections.remove(websocket)

    async def _timer_loop(self):
        """The core timer. Runs as an async task."""
        while self._is_running:
            await asyncio.sleep(1)
            self._seconds += 1
            await self.broadcast_time()

    async def broadcast_time(self):
        """Sends the current time to all connected clients."""
        message = {"type": "time", "seconds": self._seconds}
        await asyncio.gather(
            *[client.send_json(message) for client in self._active_connections]
        )

    async def broadcast_status(self):
        """Sends the current status (running/stopped) to all clients."""
        status = self.get_status()
        message = {"type": "status", **status}
        await asyncio.gather(
            *[client.send_json(message) for client in self._active_connections]
        )

    async def broadcast_config(self, config: ScoreboardConfig):
        """Sends the full config data to all connected clients."""
        message = {"type": "config", "config": config.model_dump()}
        await asyncio.gather(
            *[client.send_json(message) for client in self._active_connections]
        )
    
    async def broadcast_scoreboard_style(self, style: ScoreboardStyleConfig):
        message = {"type": "scoreboard_style", "style": style.model_dump()}
        await asyncio.gather(
            *[client.send_json(message) for client in self._active_connections]
        )

    def start(self):
        """Starts the timer if not already running."""
        if not self._is_running:
            self._is_running = True
            self._timer_task = asyncio.create_task(self._timer_loop())
            asyncio.create_task(self.broadcast_status())
            print("Timer started")

    def stop(self):
        """Stops the timer if it is running."""
        if self._is_running:
            self._is_running = False
            if self._timer_task:
                self._timer_task.cancel()
                self._timer_task = None
            asyncio.create_task(self.broadcast_status())
            print("Timer stopped")

    def reset(self):
        """Resets the timer to 0."""
        self._seconds = 0
        asyncio.create_task(self.broadcast_time())
        print("Timer reset")

    def set_time(self, new_seconds: int):
        """Sets the timer to an exact number of seconds."""
        if new_seconds < 0:
            self._seconds = 0
        else:
            self._seconds = new_seconds
        asyncio.create_task(self.broadcast_time())
        print(f"Timer set to {self._seconds} seconds")

websocket_manager = WebSocketManager()