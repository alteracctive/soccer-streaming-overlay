# Soccer Streaming Overlay Control Panel

## Introduction

This project is a complete, self-contained desktop application for managing live soccer match graphics. It provides a comprehensive **Control Panel** to manage all on-screen information in real-time, which is then displayed on a clean, broadcast-ready **Overlay**.

The application is a hybrid: a **FastAPI (Python)** backend handles data, a **Vite (TypeScript)** frontend provides the user interface, and **Electron** wraps it all into a single, portable desktop `.exe` that runs its own local servers.

### Key Features

* **Real-time Scoreboard:**
    * Full control over team names, abbreviations, scores, and primary/secondary colors.
    * Separate **Match Info** bar for event titles (e.g., "Regional Finals").
    * Dynamic **Timer** with start, stop, reset, and set functions (up to 999:59).
    * **Additional Time** module for stoppage time (e.g., "+5'").
    * **Red Card Indicators** that appear next to the team score for each on-field player who has been sent off.
    * **Customizable Layout:** Choose to display the timer *under* the scoreboard or move it to the *right* of the score row.

* **Full Roster & Stat Management (in Team Info page):**
    * Add, edit, and delete players for each team.
    * Track individual player stats:
        * **Goals:** A list of minutes when goals were scored.
        * **Yellow Cards:** A list of minutes (max 2).
        * **Red Cards:** A list of minutes (max 1).
    * Toggle a player's **On Field** status.
    * "Reset Stats" and "Delete List" buttons for full team management.
    * Automatic conflict detection when adding a player with a duplicate number.

* **Live Dashboard Controls:**
    * Redesigned team cards show score controls on one side and a **Player Grid** on the other.
    * Click any player's button in the grid to instantly add a goal to their stats *and* increment the team's score.
    * Player buttons are color-coded: **Active** (on-field), **Inactive** (off-field), or **Red** (red card).
    * Hover over a player's button to see their name and current goal count.

* **Dynamic Overlays (Toggleable from Broadcast page):**
    * **Scoreboard:** The main scoreboard, match info bar, and timer.
    * **Game Report:** A full-screen graphic showing team names, colors, scores, and a detailed list of goal scorers for each team.
    * **Players List:** A full-screen graphic displaying both team rosters side-by-side, complete with color patches. Players are sorted by "On Field" status, then by number. Lists are synchronized and will scroll continuously if they exceed 15 players.

* **Smart Settings (in Setting page):**
    * **Auto-add Score:** Automatically increment the team score when a goal is given to a player from the Team Info or Dashboard page.
    * **Auto-convert Cards:** Automatically issue a red card when a player is given their second yellow card.
    * **Import/Export:** Download (Export) your current `team-info-config.json` or `scoreboard-customization.json` files as backups. Upload (Import) a file to instantly overwrite and load a new configuration.

---

## How to Use

### Installation and Running
This application is distributed as a portable Windows executable (`.exe`). No installation is required.
1.  Download the latest `soccer-streaming-overlay.exe` release.
2.  Double-click the file to launch the application.
3.  The application window will open, displaying the Control Panel. The backend API and overlay web server will start automatically.

### Control Panel Overview
* **Dashboard:** Your live production hub. Control the timer, adjust scores, set additional time, and quickly add goals using the player grid.
* **Broadcast:** Toggle the visibility of the three main overlay components: Scoreboard, Game Report, and Players List.
* **Team Info:** Your pre-game setup page. Set team names, colors, and build your player rosters. You can also manage detailed stats (goals, cards) from here.
* **Customization:** Adjust the visual appearance of the overlay, including colors, opacity, scale, timer position, and the Match Info text.
* **Setting:** Configure application behavior (like dark mode and auto-stat rules) and manage your config files using the Import/Export tool.

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
        * Ensure "Shutdown source when not visible" is **unchecked**. This is important for keeping animations and data synced.
    * Click **OK**.

The overlays will now appear on your canvas. Use the **Broadcast** page in the Control Panel to toggle their visibility live during your stream.

---

## Technical Details & Data

### Data Storage
The application stores all data in two JSON files, located in the same folder as the `.exe`:
* `team-info-config.json`: Stores all team information, including names, abbreviations, colors, scores, and the complete player rosters with all their stats (goals, cards, etc.).
* `scoreboard-customization.json`: Stores all visual settings, including overlay colors, opacity, scale, match info text, and the timer's position.

### Network Ports
The application uses local network ports to communicate. Ensure these ports are free on your system:
* **Port 8000:** Used by the Python FastAPI backend for all data and logic.
* **Port 8001:** Used by the internal Express server to serve the overlay's HTML/CSS/JS files to OBS.