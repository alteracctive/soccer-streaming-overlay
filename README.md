# Soccer Streaming Overlay

## Introduction

Soccer Streaming Overlay is a complete, self-contained desktop application designed to manage broadcast graphics for soccer matches. It combines a user-friendly control panel with a dynamic, web-based overlay that can be easily integrated into streaming software like OBS or vMix.

The application is built using a hybrid tech stack, leveraging the speed of a **FastAPI (Python)** backend for data management and the responsiveness of a **Vite (TypeScript)** frontend, all wrapped in an **Electron** shell for a seamless desktop experience.

### Key Features

* **Real-time Scoreboard:** Manage team names, abbreviations, scores, and team colors instantly.
* **Game Timer:** Precise control over the match clock, including start, stop, reset, and custom time setting.
* **Additional Time:** Dedicated display for stoppage time (e.g., +5').
* **Match Information:** Custom text field for displaying tournament phase or match details (e.g., "Semi-Finals").
* **Roster Management:** Full management of team rosters, including player names and numbers.
* **In-Game Statistics:** Track goals, yellow cards, and red cards for individual players.
* **Smart Interactions:**
    * *Auto-Score:* Optionally increment the main team score automatically when a goal is assigned to a player.
    * *Card Rules:* Automatically issue a red card when a player receives their second yellow card.
* **Dynamic Overlays:** Toggleable overlay components including the main scoreboard, a detailed game report (summarizing scorers), and a full players list.
* **Customization:** Adjust the overlay's scale, opacity, and colors directly from the control panel.

---

## How to Use

### Installation and Running
This application is distributed as a portable Windows executable (`.exe`). No installation is required.
1.  Download the latest `Soccer Streaming Overlay.exe` release.
2.  Double-click the file to launch the application.
3.  The application window will open, displaying the Control Panel. The necessary background services (API server and overlay server) start automatically.

### Control Panel Overview
* **Dashboard:** The main hub for live game management. Control the timer, update scores, and set additional time here.
* **Broadcast:** Use this page to toggle which elements are currently visible on the stream overlay (Scoreboard, Game Report, Players List, etc.).
* **Team Info:** Manage team names, colors, and player rosters. You can add players, track their stats live during the game, and set who is currently "On Field".
* **Customization:** Adjust the visual appearance of the overlay to match your broadcast's style.
* **Setting:** Configure application behavior, such as dark mode and smart interaction rules (Auto-Score, Auto-Red Card).

---

## Setting up OBS (Open Broadcaster Software)

To display the overlay on your stream, you need to add it as a browser source in OBS.

1.  **Get the Overlay URL:**
    * In the Soccer Streaming Overlay application, look at the sidebar on the left.
    * Click the **"Copy"** button under the "Overlay Link" section. This will copy the local server URL (typically `http://localhost:8001/overlay/index.html`) to your clipboard.

2.  **Add to OBS:**
    * Open OBS Studio.
    * In your desired Scene, click the **+** icon in the "Sources" dock and select **Browser**.
    * Name the source (e.g., "Soccer Scoreboard") and click OK.
    * In the properties window:
        * **URL:** Paste the URL you copied from the control panel.
        * **Width:** `1920` (or the width of your canvas).
        * **Height:** `1080` (or the height of your canvas).
        * **Delete CSS:** Clear everything in the "Custom CSS" field so it doesn't interfere with the overlay's own styles.
        * Ensure "Shutdown source when not visible" is **unchecked** if you want the timer to keep running smoothly while the source is hidden in OBS.
    * Click **OK**.

The overlay should now appear on your stream canvas. Use the Control Panel "Broadcast" tab to show or hide specific elements.

---

## Technical Details & Data

### Data Storage
The application stores all match data locally in JSON files located in the same directory as the internal backend resources.
* `team-info-config.json`: Stores team names, colors, scores, and full player rosters with their stats.
* `scoreboard-customization.json`: Stores visual settings and current match info text.

### Network Ports
The application uses local network ports to communicate between the control panel, the backend, and OBS. Ensure these ports are free on your system:
* **Port 8000:** Used by the Python FastAPI backend for data operations.
* **Port 8001:** Used by the internal Express server to serve the overlay files to OBS.

### Development Info
For developers looking to build from source:
1.  **Backend:** Requires Python 3.11+. Install dependencies and use PyInstaller to package `main.py` into a one-file executable.
2.  **Frontend:** Requires Node.js. Run `npm install` and `npm run build` to generate the static files.
3.  **Desktop App:** Requires Node.js. Place the packaged backend `.exe` into `desktop-app/resources`, copy the frontend build to `desktop-app/dist`, and run `npm run package` to generate the final Electron executable.