// --- Type Definitions (mirroring backend Pydantic models) ---
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



// --- API and WebSocket URLs ---
// *** ROLLED BACK: URLs are now hard-coded ***
const API_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws';

// --- State and Event Emitter ---
// ... (appState, stateEmitter, STATE_UPDATE_EVENT are unchanged) ...
let appState: {
  config: ScoreboardConfig | null;
  timer: TimerStatus;
} = {
  config: null,
  timer: { isRunning: false, seconds: 0 },
};

const stateEmitter = new EventTarget();
export const STATE_UPDATE_EVENT = 'stateupdate';

// --- Private Helper Functions ---
// ... (updateConfig, updateTimer, post functions are unchanged) ...
function updateConfig(newConfig: ScoreboardConfig) {
  appState.config = newConfig;
  stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}

function updateTimer(newTimerStatus: Partial<TimerStatus>) {
  appState.timer = { ...appState.timer, ...newTimerStatus };
  stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}

async function post(endpoint: string, body: object) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error in POST ${endpoint}:`, error);
  }
}

// --- WebSocket Connection ---
function connectWebSocket() {
  // *** ROLLED BACK: Removed the check for WS_URL ***
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'time') {
      updateTimer({ seconds: message.seconds });
    } else if (message.type === 'status') {
      updateTimer({
        isRunning: message.isRunning,
        seconds: message.seconds,
      });
    }
    else if (message.type === 'config') {
      updateConfig(message.config as ScoreboardConfig);
    }  
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected. Reconnecting in 3 seconds...');
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    ws.close();
  };
}

// --- Public Interface ---
// ... (Rest of the file is unchanged) ...
export async function initStateManager() {
  // *** REMOVED initial config fetch ***
  // The WebSocket now sends the config on connection,
  // so this fetch is no longer needed and prevents a race condition.
  // *** REMOVED initial config fetch ***
  // The WebSocket now sends the config on connection,
  // so this fetch is no longer needed and prevents a race condition.
  connectWebSocket();
}

export function getState() {
  return appState;
}

export function subscribe(callback: (event: Event) => void) {
  stateEmitter.addEventListener(STATE_UPDATE_EVENT, callback);
}

export function unsubscribe(callback: (event: Event) => void) {
  stateEmitter.removeEventListener(STATE_UPDATE_EVENT, callback);
}

export const timerControls = {
  start: () => post('/api/timer/start', {}),
  stop: () => post('/api/timer/stop', {}),
  reset: () => post('/api/timer/reset', {}),
  set: (seconds: number) => post('/api/timer/set', { seconds }),
};

export async function setScore(team: 'teamA' | 'teamB', score: number) {
  await post('/api/score/set', { team, score });
  await post('/api/score/set', { team, score });
}

export async function saveTeamInfo(teamA: object, teamB: object) {
  await post('/api/team-info', { teamA, teamB });
  await post('/api/team-info', { teamA, teamB });
}

export async function saveColors(teamA: object, teamB: object) {
  await post('/api/customization', { teamA, teamB });
  await post('/api/customization', { teamA, teamB });
}