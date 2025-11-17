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
        self._is_scoreboard_visible: bool = True
        self._is_players_list_visible: bool = False
        self._extra_time_minutes: int = 0
        self._is_extra_time_visible: bool = False
        self._is_match_info_visible: bool = False
        self._is_futsal_clock_on: bool = False
        self._last_set_futsal_time: int = 0

    def get_status(self):
        """Returns the current timer status."""
        return {"isRunning": self._is_running, "seconds": self._seconds}

    def get_game_report_status(self):
        """Returns the current game report visibility."""
        return {"isVisible": self._is_game_report_visible}

    def get_scoreboard_status(self):
        """Returns the current scoreboard visibility."""
        return {"isVisible": self._is_scoreboard_visible}

    def get_players_list_status(self):
        """Returns the current players list visibility."""
        return {"isVisible": self._is_players_list_visible}

    def get_extra_time_status(self):
        """Returns the current extra time status."""
        return {"minutes": self._extra_time_minutes, "isVisible": self._is_extra_time_visible}

    def get_match_info_visibility(self):
        """Returns the current match info visibility."""
        return {"isVisible": self._is_match_info_visible}

    def get_futsal_clock_status(self):
        """Returns the futsal clock status."""
        return {"isOn": self._is_futsal_clock_on}

    async def connect(self, websocket: WebSocket):
        """Adds a new client to the broadcast list."""
        await websocket.accept()
        self._active_connections.append(websocket)
        await self.broadcast_status()
        await self.broadcast_game_report_visibility(to_single_client=websocket)
        await self.broadcast_scoreboard_visibility(to_single_client=websocket)
        await self.broadcast_players_list_visibility(to_single_client=websocket)
        await self.broadcast_extra_time_status(to_single_client=websocket)
        await self.broadcast_match_info_visibility(to_single_client=websocket)
        await self.broadcast_futsal_clock_status(to_single_client=websocket)


    def disconnect(self, websocket: WebSocket):
        """Removes a client from the broadcast list."""
        self._active_connections.remove(websocket)

    async def _timer_loop(self):
        while self._is_running:
            await asyncio.sleep(1)
            
            if self._is_futsal_clock_on:
                # Futsal logic (count down)
                if self._seconds > 0:
                    self._seconds -= 1
                else:
                    self._seconds = 0
                    self.stop() # Stop timer at 0
            else:
                # Soccer logic (count up)
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
    
    async def broadcast_scoreboard_style(self, style: ScoreboardStyleConfig):
        message = {"type": "scoreboard_style", "style": style.model_dump()}
        await asyncio.gather(
            *[client.send_json(message) for client in self._active_connections]
        )

    async def broadcast_game_report_visibility(self, to_single_client: WebSocket | None = None):
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

    async def broadcast_scoreboard_visibility(self, to_single_client: WebSocket | None = None):
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

    async def broadcast_players_list_visibility(self, to_single_client: WebSocket | None = None):
        status = self.get_players_list_status()
        message = {"type": "players_list_visibility", **status}
        
        if to_single_client:
            try:
                await to_single_client.send_json(message)
            except Exception as e:
                print(f"Error sending single players list status: {e}")
        else:
            await asyncio.gather(
                *[client.send_json(message) for client in self._active_connections]
            )

    async def broadcast_extra_time_status(self, to_single_client: WebSocket | None = None):
        status = self.get_extra_time_status()
        message = {"type": "extra_time_status", **status}
        
        if to_single_client:
            try:
                await to_single_client.send_json(message)
            except Exception as e:
                print(f"Error sending single extra time status: {e}")
        else:
            await asyncio.gather(
                *[client.send_json(message) for client in self._active_connections]
            )

    async def broadcast_match_info_visibility(self, to_single_client: WebSocket | None = None):
        status = self.get_match_info_visibility()
        message = {"type": "match_info_visibility", **status}
        
        if to_single_client:
            try:
                await to_single_client.send_json(message)
            except Exception as e:
                print(f"Error sending single match info status: {e}")
        else:
            await asyncio.gather(
                *[client.send_json(message) for client in self._active_connections]
            )
            
    async def broadcast_futsal_clock_status(self, to_single_client: WebSocket | None = None):
        """Sends the futsal clock status to clients."""
        status = self.get_futsal_clock_status()
        message = {"type": "futsal_clock_status", **status}
        
        if to_single_client:
            try:
                await to_single_client.send_json(message)
            except Exception as e:
                print(f"Error sending single futsal clock status: {e}")
        else:
            await asyncio.gather(
                *[client.send_json(message) for client in self._active_connections]
            )


    async def toggle_game_report(self):
        self._is_game_report_visible = not self._is_game_report_visible
        print(f"Game report toggled: {'Visible' if self._is_game_report_visible else 'Hidden'}")
        await self.broadcast_game_report_visibility()
        return self.get_game_report_status()

    async def toggle_scoreboard(self):
        self._is_scoreboard_visible = not self._is_scoreboard_visible
        print(f"Scoreboard toggled: {'Visible' if self._is_scoreboard_visible else 'Hidden'}")
        await self.broadcast_scoreboard_visibility()
        return self.get_scoreboard_status()

    async def toggle_players_list(self):
        self._is_players_list_visible = not self._is_players_list_visible
        print(f"Players list toggled: {'Visible' if self._is_players_list_visible else 'Hidden'}")
        await self.broadcast_players_list_visibility()
        return self.get_players_list_status()

    async def toggle_extra_time_visibility(self):
        self._is_extra_time_visible = not self._is_extra_time_visible
        print(f"Extra time toggled: {'Visible' if self._is_extra_time_visible else 'Hidden'}")
        await self.broadcast_extra_time_status()
        return self.get_extra_time_status()
        
    async def toggle_match_info_visibility(self):
        self._is_match_info_visible = not self._is_match_info_visible
        print(f"Match info toggled: {'Visible' if self._is_match_info_visible else 'Hidden'}")
        await self.broadcast_match_info_visibility()
        return self.get_match_info_visibility()

    def set_futsal_clock(self, is_on: bool):
        """Sets the futsal clock mode."""
        if self._is_running:
            self.stop() # Stop timer to prevent errors
            
        self._is_futsal_clock_on = is_on
        
        if is_on and self._seconds == 0:
            self._seconds = self._last_set_futsal_time
            asyncio.create_task(self.broadcast_time())
        elif not is_on and self._seconds == 0:
             self._last_set_futsal_time = 0
            
        print(f"Futsal clock mode set to: {is_on}")
        asyncio.create_task(self.broadcast_futsal_clock_status())


    def set_extra_time(self, minutes: int):
        if minutes < 0:
            self._extra_time_minutes = 0
        else:
            self._extra_time_minutes = minutes
        print(f"Extra time set to {self._extra_time_minutes} minutes")
        asyncio.create_task(self.broadcast_extra_time_status())


    def start(self):
        if self._is_futsal_clock_on and self._seconds <= 0:
            print("Cannot start futsal clock at 0.")
            return

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
        if self._is_futsal_clock_on:
            self._seconds = self._last_set_futsal_time
        else:
            self._seconds = 0
            
        if self._is_running:
            self.stop()
            
        asyncio.create_task(self.broadcast_time())
        print("Timer reset")

    def set_time(self, new_seconds: int):
        if new_seconds < 0:
            self._seconds = 0
        else:
            self._seconds = new_seconds
        
        if self._is_futsal_clock_on:
            self._last_set_futsal_time = new_seconds
            
        asyncio.create_task(self.broadcast_time())
        print(f"Timer set to {self._seconds} seconds")

websocket_manager = WebSocketManager()