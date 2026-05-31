# Soccer Streaming Overlay Control Panel

## Introduction

This project is a complete, self-contained desktop application for managing live soccer match graphics. It provides a comprehensive **Control Panel** to manage all on-screen information in real-time, which is then displayed on a clean, broadcast-ready **Overlay**.

The application is a hybrid: a **FastAPI (Python)** backend handles data, a **Vite (TypeScript)** frontend provides the user interface, and **Electron** wraps it all into a single, portable desktop `.exe` that runs its own local servers.

### Key Features

* **Advanced Scoreboard & Game Management:**
    * **Period Manager:** Easily switch between game states (First Half, Second Half, Break Time, Extra Time, Penalty Shootout, etc.) with a single click.
    * **Full Team Control:** Manage team names, abbreviations, and scores.
    * **Triple Color System:** Customize Primary, Secondary, and Tertiary colors for intricate team branding.
    * **Dynamic Timer:**
        * Supports standard count-up timers.
        * **Futsal Mode:** Toggle a countdown timer via the Settings page.
        * Includes start, stop, reset, set time, and Additional Time (+5') controls.
    * **Red Card Indicators:** Visual indicators appear on the overlay next to the team score for each player sent off.
    * **VAR Control:** A dedicated interface to display Video Assistant Referee (VAR) decisions and messages on the overlay.

* **Full Roster & Stat Management (in Team Info page):**
    * Add, edit, and delete players for each team.
    * Track individual player stats:
        * **Goals:** A list of minutes when goals were scored.
        * **Own Goals:** specific tracking for own goals, differentiating them from standard scoring.
        * **Yellow Cards:** A list of minutes (max 2).
        * **Red Cards:** A list of minutes (max 1).
    * Toggle a player's **On Field** status.
    * Automatic conflict detection when adding a player with a duplicate number.

* **Live Dashboard Controls:**
    * Redesigned team cards show score controls on one side and a **Player Grid** on the other.
    * Click any player's button in the grid to instantly add a goal to their stats *and* increment the team's score.
    * Player buttons are color-coded: **Active** (on-field), **Inactive** (off-field), or **Red** (red card).
    * Hover over a player's button to see their name and current goal count.

* **Dynamic Overlays (Toggleable from Broadcast page):**
    * **Scoreboard:** The main scoreboard, match info bar, and timer.
    * **Details Page:** A comprehensive view containing:
        * **Game Report:** Full-screen graphic showing team names, colors, scores, and a detailed list of goal scorers.
        * **Match Timeline:** A chronological visual representation of match events (goals, cards, substitutions).
    * **Players List:** A full-screen graphic displaying both team rosters side-by-side, complete with color patches. Players are sorted by "On Field" status, then by number. Lists are synchronized and will scroll continuously if they exceed 15 players.

* **Smart Settings (in Setting page):**
    * **Futsal Timer:** Toggle between standard soccer count-up or Futsal count-down timer logic.
    * **Auto-add Score:** Automatically increment the team score when a goal is given to a player.
    * **Auto-convert Cards:** Automatically issue a red card when a player is given their second yellow card.
    * **Import/Export:** Download (Export) your current files as backups. Upload (Import) a file to instantly overwrite and load a new configuration.
    * **Configurable Global Shortcuts:** Customize keyboard shortcuts for most major actions from the settings page.

---

## How to Use

### Installation and Running
This application is distributed as a portable Windows executable (`.exe`). No installation is required.
1.  Download the latest `soccer-streaming-overlay.exe` release.
2.  Double-click the file to launch the application.
3.  The application window will open, displaying the Control Panel. The backend API and overlay web server will start automatically.

### Control Panel Overview
* **Dashboard:** Your live production hub. Control the timer, manage periods (Halves/Breaks), adjust scores, set additional time, and quickly add goals using the player grid.
* **Broadcast:** Toggle the visibility of the main overlay components: Scoreboard, Details Page (Report/Timeline), and Players List.
* **Team Info:** Your pre-game setup page. Set team names, the three team colors, and build your player rosters. You can also manage detailed stats (goals, own goals, cards) from here.
* **Customization:** Adjust the visual appearance of the overlay, including colors, opacity, scale, timer position, and text settings.
* **Setting:** Configure application behavior (Futsal timer mode, auto-stat rules), manage shortcuts, and manage your config files using the Import/Export tool.

---

## Setting up OBS (Open Broadcaster Software)

To display the overlays on your stream, you add them as **Browser Sources** in OBS.

1.  **Get the Overlay URL:**
    * In the Soccer Streaming Overlay application, look at the sidebar on the left.
    * Click the **"Copy"** button under the "Overlay Link" section. This will copy the overlay server URL (`http://localhost:8001/overlay/index.html`) to your clipboard.

2.  **Add to OBS:**
    * Open OBS Studio.
    * In your desired Scene, click the **+** icon in the "Sources" dock and select **Browser**.
    * Name the source (e.g., "Soccer Overlay") and click OK.
    * In the properties window:
        * **URL:** Paste the URL you copied: `http://localhost:8001/overlay/index.html`
        * **Width:** `1920` (or your canvas width).
        * **Height:** `1080` (or your canvas height).
        * **Custom CSS:** Delete *everything* in this field.
        * **Shutdown source when not visible:** Ensure this is **unchecked**. This is important for keeping animations and data synced.
    * Click **OK**.

The overlays will now appear on your canvas. Use the **Broadcast** page in the Control Panel to toggle their visibility live during your stream.

---
## Architecture

This application operates as a self-contained ecosystem on your local machine, comprised of three main parts:

1.  **Electron App (The Wrapper):** The main executable you run. Its job is to start the other two components and display the user interface.
2.  **FastAPI Backend (The Brains):** A Python server that runs on `http://localhost:8000`. It manages all the data, logic, and state of the match. It communicates with the frontend via a REST API and WebSockets for real-time updates.
3.  **Vite Frontend (The Control Panel & Overlay):** A TypeScript-based web interface. The Electron app loads the control panel UI you interact with. A separate part of this frontend is the Overlay, which is served by a dedicated lightweight Express server on `http://localhost:8001` so OBS can access it.

---

## Data & Configuration

All application data is stored in JSON files located in the same folder as the `.exe`. This makes your entire setup portable.

*   `team-info-config.json`: Stores all team information, including names, abbreviations, colors, scores, and the complete player rosters with all their stats (goals, cards, etc.).
*   `scoreboard-customization.json`: Stores all visual settings, including overlay colors, opacity, scale, match info text, and the timer's position.
*   `time-period-setting.json`: Stores the configuration for the game periods (e.g., First Half, Break Time), including their names and duration.
*   `shortcuts.json`: Stores your custom keyboard shortcut configurations.

---

## For Developers

If you want to contribute or run the application in a development environment, you'll need to run the backend and frontend separately.

**1. Backend (FastAPI):**
```bash
cd backend
# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Run the server
python main.py
```

**2. Frontend (Vite):**
```bash
cd frontend
# Install dependencies
npm install
# Run the development server
npm run dev
```
The control panel will be available at `http://localhost:5173` (or another port if 5173 is in use).

---

## Technologies Used

*   **Backend:** Python, FastAPI
*   **Frontend:** TypeScript, Vite, HTML/CSS
*   **Desktop App:** Electron
*   **Real-time Communication:** WebSockets
*   **Configuration:** JSON