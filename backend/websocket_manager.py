import asyncio
from fastapi import WebSocket
from data_manager import ScoreboardConfig 

class WebSocketManager:
    def __init__(self):
        self._is_running: bool = False
        self._seconds: int = 0
        self._timer_task: asyncio.Task | None = None
        self._active_connections: list[WebSocket] = []

    def get_status(self):
        return {"isRunning": self._is_running, "seconds": self._seconds}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self._active_connections.append(websocket)
        await self.broadcast_status()

    def disconnect(self, websocket: WebSocket):
        self._active_connections.remove(websocket)

    async def _timer_loop(self):
        while self._is_running:
            await asyncio.sleep(1)
            self._seconds += 1
            await self.broadcast_time()

    async def broadcast_time(self):
        message = {"type": "time", "seconds": self._seconds}
        await asyncio.gather(
            *[client.send_json(message) for client in self._active_connections]
        )

    async def broadcast_status(self):
        status = self.get_status()
        message = {"type": "status", **status}
        await asyncio.gather(
            *[client.send_json(message) for client in self._active_connections]
        )

    async def broadcast_config(self, config: ScoreboardConfig):
        message = {"type": "config", "config": config.model_dump()}
        await asyncio.gather(
            *[client.send_json(message) for client in self._active_connections]
        )
        
    # --- broadcast_presets method removed ---

    def start(self):
        if not self._is_running:
            self._is_running = True
            self._timer_task = asyncio.create_task(self._timer_loop())
            asyncio.create_task(self.broadcast_status())
            print("Timer started")

    def stop(self):
        if self._is_running:
            self._is_running = False
            if self._timer_task:
                self._timer_task.cancel()
                self._timer_task = None
            asyncio.create_task(self.broadcast_status())
            print("Timer stopped")

    def reset(self):
        self._seconds = 0
        asyncio.create_task(self.broadcast_time())
        print("Timer reset")

    def set_time(self, new_seconds: int):
        if new_seconds < 0:
            self._seconds = 0
        else:
            self._seconds = new_seconds
        asyncio.create_task(self.broadcast_time())
        print(f"Timer set to {self._seconds} seconds")

websocket_manager = WebSocketManager()