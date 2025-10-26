// --- Type Definitions ---
export interface ColorConfig {
  primary: string;
  secondary: string;
}

export interface TeamConfig {
  name: string;
  abbreviation: string;
  score: number;
  colors: ColorConfig;
}

export interface ScoreboardConfig {
  teamA: TeamConfig;
  teamB: TeamConfig;
}

export interface TimerStatus {
  isRunning: boolean;
  seconds: number;
}

export interface ScoreboardStyleConfig {
  primary: string;
  secondary: string;
  opacity: number;
  scale: number;
}

// --- API and WebSocket URLs ---
const API_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws';

// --- State and Event Emitter ---
// This holds the "source of truth" for the app
let appState: {
  config: ScoreboardConfig | null;
  timer: TimerStatus;
  isConnected: boolean;
  scoreboardStyle: ScoreboardStyleConfig | null; // Keep this
} = {
  config: null,
  timer: { isRunning: false, seconds: 0 },
  isConnected: false,
  // Default includes opacity
  scoreboardStyle: { primary: '#000000', secondary: '#FFFFFF', opacity: 75, scale: 100 },
};

// Allows pages to "listen" for changes to the state
export const stateEmitter = new EventTarget();
export const STATE_UPDATE_EVENT = 'stateupdate';
export const CONNECTION_STATUS_EVENT = 'connectionstatus';

// --- Private Helper Functions ---
function updateConfig(newConfig: ScoreboardConfig) {
  appState.config = newConfig;
  stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}

function updateTimer(newTimerStatus: Partial<TimerStatus>) {
  appState.timer = { ...appState.timer, ...newTimerStatus };
  stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}

function updateConnectionStatus(status: boolean) {
  appState.isConnected = status;
  stateEmitter.dispatchEvent(
    new CustomEvent(CONNECTION_STATUS_EVENT, { detail: status }),
  );
}

function updateScoreboardStyle(newStyle: ScoreboardStyleConfig) {
  // Add scale validation/clamping
  if (newStyle.opacity < 50) newStyle.opacity = 50;
  if (newStyle.opacity > 100) newStyle.opacity = 100;
  if (newStyle.scale < 50) newStyle.scale = 50;
  if (newStyle.scale > 150) newStyle.scale = 150;
  appState.scoreboardStyle = newStyle;
  stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}

// Simple wrapper for API POST requests
async function post(endpoint: string, body: object) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.detail || 'An API error occurred');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error in POST ${endpoint}:`, error);
    throw error; // Re-throw to be caught by the caller
  }
}

// --- WebSocket Connection ---
function connectWebSocket() {
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('WebSocket connected');
    updateConnectionStatus(true);
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'time') {
      updateTimer({ seconds: message.seconds });
    } else if (message.type === 'status') {
      updateTimer({ isRunning: message.isRunning, seconds: message.seconds });
    } else if (message.type === 'config') {
      updateConfig(message.config as ScoreboardConfig);
    } 
    // This calls the function defined above
    else if (message.type === 'scoreboard_style') {
      updateScoreboardStyle(message.style as ScoreboardStyleConfig);
    }
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected. Reconnecting in 3 seconds...');
    updateConnectionStatus(false);
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    updateConnectionStatus(false);
    ws.close();
  };
}



// --- Public Interface ---

/**
 * Initializes the state manager. Connects to WebSocket.
 */
export async function initStateManager() {
  connectWebSocket();
}

/**
 * Gets the current application state.
 */
export function getState() {
  return appState;
}

/**
 * Subscribes a callback function to state updates.
 */
export function subscribe(callback: (event: Event) => void) {
  stateEmitter.addEventListener(STATE_UPDATE_EVENT, callback);
}

/**
 * Unsubscribes a callback function from state updates.
 */
export function unsubscribe(callback: (event: Event) => void) {
  stateEmitter.removeEventListener(STATE_UPDATE_EVENT, callback);
}

// --- API-Calling Functions ---

export const timerControls = {
  start: () => post('/api/timer/start', {}),
  stop: () => post('/api/timer/stop', {}),
  reset: () => post('/api/timer/reset', {}),
  set: (seconds: number) => post('/api/timer/set', { seconds }),
};

export async function setScore(team: 'teamA' | 'teamB', score: number) {
  await post('/api/score/set', { team, score });
}

export async function saveTeamInfo(teamA: object, teamB: object) {
  await post('/api/team-info', { teamA, teamB });
}

export async function saveColors(teamA: object, teamB: object) {
  await post('/api/customization', { teamA, teamB });
}

export async function saveScoreboardStyle(style: ScoreboardStyleConfig) {
  await post('/api/scoreboard-style', style);
}