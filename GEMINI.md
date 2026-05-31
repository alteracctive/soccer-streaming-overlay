# Soccer Streaming Overlay - Gemini Instructions

Welcome to the `soccer-streaming-overlay` project! This file (`GEMINI.md`) serves as the core instruction manual for Gemini Code Assist and Gemini CLI agents working on this repository. These mandates supersede any general defaults.

## 🏗️ Architecture & Tech Stack

This project is a multi-component sports broadcasting graphic system.
*   **Frontend (`/frontend`)**: Built with **Vanilla TypeScript**, **Vanilla CSS**, and **Vite**. NO frontend frameworks (React, Vue, etc.) or utility CSS (Tailwind) are used. 
    *   **Control Panel** (`/frontend/control_panel`): The dashboard UI for the operator to update scores, team info, and broadcast settings.
    *   **Overlay** (`/frontend/overlay`): The transparent HTML/CSS application that receives data and displays the graphics (intended for OBS/vMix browser sources).
*   **Backend (`/backend`)**: Built with **Python, FastAPI, and WebSockets**. It serves as the single source of truth, managing application state (`data_manager.py`) and pushing real-time updates to connected clients (`websocket_manager.py`).
*   **Desktop App (`/desktop-app`)**: An **Electron** wrapper that serves the application locally, packaging the frontend into a standalone executable (`electron-builder`).
*   **Configurations (`/example-config`)**: JSON files defining team data, styling customizations, and time period settings.

## 🧩 Core Architectural Philosophies & Preferences

*   **Zero-Dependency Frontend**: We strictly rely on Vanilla TypeScript and DOM APIs. Do not introduce any frontend UI libraries (React, Vue, Svelte) or CSS frameworks (Tailwind, Bootstrap). Maintain strict separation of concerns (HTML/TS/CSS).
*   **Modular Architecture**: Keep the frontend modular. Use specific CSS files for specific components. Organize new UI elements clearly within their respective domains.
*   **Single Source of Truth**: The Python backend is the authoritative source for all state. WebSockets are used for unidirectional data flow to the clients (Overlay and Control Panel), with the Control Panel sending commands via HTTP or WebSocket back to the backend.
*   **Robust Typing**: TypeScript `strict` mode is enabled. Pydantic is used on the backend. Both must perfectly mirror the expected application state to ensure type safety across the network boundary.

## 🛠️ Development Guidelines

### 1. General Rules
*   **Preserve the Stack**: Do not introduce new massive libraries unless absolutely necessary. Stick to Vanilla TypeScript/DOM manipulation and native CSS features. 
*   **Full-Stack Awareness**: A typical feature involves 3 steps: 
    1. Updating the Python backend state/WebSocket schema.
    2. Adding a control UI in `frontend/control_panel/`.
    3. Rendering the data visually in `frontend/overlay/`.

### 2. Frontend (Vite + Vanilla TS)
*   **Typing**: Maintain strict TypeScript typing (`tsconfig.json` is strict). Avoid `any`. Define interfaces for all state objects, configuration payloads, and WebSocket messages.
*   **State Management**: `frontend/control_panel/stateManager.ts` handles the WebSocket connection and state synchronization with the backend. Route all state mutations through this manager. Do not store authoritative state locally in UI components—always read from and write to the state manager.
*   **Styling**: 
    *   Keep CSS modular. Use the existing structure in `frontend/control_panel/css/` (e.g., `variables.css`, `components.css`).
    *   Always reuse CSS variables for colors, typography, and spacing to maintain aesthetic consistency.
    *   Avoid inline styles in TS/JS files unless dynamically calculating properties (like a progress bar width or positioning).
*   **DOM Manipulation**: Use native `document.getElementById` or `document.querySelector`. Always handle cases where DOM elements might be `null` or `undefined` gracefully.
*   **File Organization**: Group new pages in `frontend/control_panel/pages/`. Reusable logic/helpers should go in root `control_panel` or appropriate subdirectories to prevent cluttering the main logic files.

### 3. Backend (Python + FastAPI)
*   **Data Models**: Use **Pydantic** models to validate any new data structures sent over HTTP or WebSockets. Ensure models accurately reflect the TypeScript interfaces.
*   **File I/O**: The backend persists configuration via JSON files (like `time-period-setting.json` and `shortcuts.json`). When modifying the state shape, ensure the read/write logic in `data_manager.py` is safely updated, parsing is correct, and defaults are handled safely.
*   **WebSockets**: Ensure `websocket_manager.py` broadcasts to all clients (`overlay` and `control_panel`) efficiently when state changes. Do not spam WebSocket messages; batch updates where logical.

### 4. Running the Project Locally
When testing or validating your code changes, use the following commands:
*   **Frontend**: `cd frontend && npm install && npm run dev`
*   **Backend**: **DO NOT run the backend yourself via shell commands.** Ask the user to start the backend locally on their machine, as the AI environment may not successfully run the FastAPI server. The user should run `cd backend && uvicorn main:app --reload` (or provide them with instructions on how to do it).
*   **Desktop**: `cd desktop-app && npm install && npm start`
*   **Validation**: Always run `cd frontend && npm run build` (which includes `tsc`) to ensure no TypeScript compilation errors were introduced.

## 🗺️ Feature Implementation Workflow (Planning)

To prevent code structure from conflicting or becoming messy over time, strictly adhere to this workflow when adding new features:

1.  **State Definition (Backend First)**: 
    *   Define the data structure needed for the feature. 
    *   Update `backend/data_manager.py` to handle storage and retrieval (if persistent).
    *   Create or update Pydantic models for strict validation.
2.  **API/WebSocket Contract**: 
    *   Define the WebSocket messages (events) that will broadcast this new state.
    *   If HTTP endpoints are needed (e.g., for file uploads or specific actions), define them in `backend/main.py`.
3.  **Frontend State Manager Integration**: 
    *   Update TS interfaces in the frontend to match backend models.
    *   Update `frontend/control_panel/stateManager.ts` to listen for new WebSocket events and expose the new state safely.
4.  **Control Panel UI**:
    *   Build the operator UI in `frontend/control_panel/pages/` (or extend an existing page).
    *   Hook up UI inputs to send updates via `stateManager.ts` to the backend. Ensure optimistic UI updates are avoided in favor of reacting to WebSocket confirmations.
5.  **Overlay Rendering**: 
    *   Update `frontend/overlay/main.ts` to listen for state changes and update the DOM in the overlay UI.
    *   Add corresponding animations/styles in `frontend/overlay/overlay.css`.

## 🔒 Security & Safe Execution
*   Never commit generated executables or `node_modules`/`venv` folders.
*   When executing shell commands for the user (e.g., installing a new dependency), prioritize the quiet/silent flags to keep terminal output clean.
