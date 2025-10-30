import asyncio
from fastapi import WebSocket
from data_manager import ScoreboardConfig, ScoreboardStyleConfig

class WebSocketManager:
    def __init__(self):
        self._is_running: bool = False
        self._seconds: int = 0
        self._timer_task: asyncio.Task | None = None
        self._active_connections: list[WebSocket] = []
        self._is_game_report_visible: bool = False
        self._is_scoreboard_visible: bool = True # <-- New state (default True)

    def get_status(self):
        """Returns the current timer status."""
        return {"isRunning": self._is_running, "seconds": self._seconds}

    def get_game_report_status(self):
        """Returns the current game report visibility."""
        return {"isVisible": self._is_game_report_visible}

    # --- New Function ---
    def get_scoreboard_status(self):
        """Returns the current scoreboard visibility."""
        return {"isVisible": self._is_scoreboard_visible}

    async def connect(self, websocket: WebSocket):
        """Adds a new client to the broadcast list."""
        await websocket.accept()
        self._active_connections.append(websocket)
        await self.broadcast_status()
        # Send current game report state
        await self.broadcast_game_report_visibility(to_single_client=websocket)
        # --- New Call ---
        # Send current scoreboard state
        await self.broadcast_scoreboard_visibility(to_single_client=websocket)


    def disconnect(self, websocket: WebSocket):
        """Removes a client from the broadcast list."""
        self._active_connections.remove(websocket)

    async def _timer_loop(self):
        # ... (no changes in this method)
        while self._is_running:
            await asyncio.sleep(1)
            self._seconds += 1
            await self.broadcast_time()

    async def broadcast_time(self):
        # ... (no changes in this method)
        message = {"type": "time", "seconds": self._seconds}
        await asyncio.gather(
            *[client.send_json(message) for client in self._active_connections]
        )

    async def broadcast_status(self):
        # ... (no changes in this method)
        status = self.get_status()
        message = {"type": "status", **status}
        await asyncio.gather(
            *[client.send_json(message) for client in self._active_connections]
        )

    async def broadcast_config(self, config: ScoreboardConfig):
        # ... (no changes in this method)
        message = {"type": "config", "config": config.model_dump()}
        await asyncio.gather(
            *[client.send_json(message) for client in self._active_connections]
        )
    
    async def broadcast_scoreboard_style(self, style: ScoreboardStyleConfig):
        # ... (no changes in this method)
        message = {"type": "scoreboard_style", "style": style.model_dump()}
        await asyncio.gather(
            *[client.send_json(message) for client in self._active_connections]
        )

    async def broadcast_game_report_visibility(self, to_single_client: WebSocket | None = None):
        # ... (no changes in this method)
        status = self.get_game_report_status()
        message = {"type": "game_report_visibility", **status}
        
        if to_single_client:
            try:
                await to_single_client.send_json(message)
            except Exception as e:
                print(f"Error sending single game report status: {e}")
        else:
            await asyncio.gather(
                *[client.send_json(message) for client in self._active_connections]
            )

    # --- New Method ---
    async def broadcast_scoreboard_visibility(self, to_single_client: WebSocket | None = None):
        """Sends the scoreboard visibility status to clients."""
        status = self.get_scoreboard_status()
        message = {"type": "scoreboard_visibility", **status}
        
        if to_single_client:
            try:
                await to_single_client.send_json(message)
            except Exception as e:
                print(f"Error sending single scoreboard status: {e}")
        else:
            await asyncio.gather(
                *[client.send_json(message) for client in self._active_connections]
            )


    async def toggle_game_report(self):
        # ... (no changes in this method)
        self._is_game_report_visible = not self._is_game_report_visible
        print(f"Game report toggled: {'Visible' if self._is_game_report_visible else 'Hidden'}")
        await self.broadcast_game_report_visibility()
        return self.get_game_report_status()

    # --- New Method ---
    async def toggle_scoreboard(self):
        """Toggles the scoreboard visibility and broadcasts the change."""
        self._is_scoreboard_visible = not self._is_scoreboard_visible
        print(f"Scoreboard toggled: {'Visible' if self._is_scoreboard_visible else 'Hidden'}")
        await self.broadcast_scoreboard_visibility()
        return self.get_scoreboard_status()


    def start(self):
        # ... (no changes in this method)
        if not self._is_running:
            self._is_running = True
            self._timer_task = asyncio.create_task(self._timer_loop())
            asyncio.create_task(self.broadcast_status())
            print("Timer started")

    def stop(self):
        # ... (no changes in this method)
        if self._is_running:
            self._is_running = False
            if self._timer_task:
                self._timer_task.cancel()
                self._timer_task = None
            asyncio.create_task(self.broadcast_status())
            print("Timer stopped")

    def reset(self):
        # ... (no changes in this method)
        self._seconds = 0
        asyncio.create_task(self.broadcast_time())
        print("Timer reset")

    def set_time(self, new_seconds: int):
        # ... (no changes in this method)
        if new_seconds < 0:
            self._seconds = 0
        else:
            self._seconds = new_seconds
        asyncio.create_task(self.broadcast_time())
        print(f"Timer set to {self._seconds} seconds")

websocket_manager = WebSocketManager()