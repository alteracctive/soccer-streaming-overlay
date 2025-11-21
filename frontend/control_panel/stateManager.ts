// frontend/control_panel/stateManager.ts

// --- Type Definitions ---
export interface ColorConfig {
  primary: string;
  secondary: string;
}

export interface Goal {
  regMinute: number;
  addMinute: number;
  isOwnGoal: boolean;
}

// --- New Interface ---
export interface Card {
  regMinute: number;
  addMinute: number;
}

export interface PlayerConfig {
  number: number;
  name: string;
  onField: boolean;
  yellowCards: Card[]; // <-- Updated
  redCards: Card[];    // <-- Updated
  goals: Goal[];
}

export interface TeamConfig {
  name: string;
  abbreviation: string;
  score: number;
  colors: ColorConfig;
  players: PlayerConfig[];
}

export interface ScoreboardConfig {
  teamA: TeamConfig;
  teamB: TeamConfig;
  currentPeriod: string;
}

export interface PeriodSetting {
  name: string;
  endTime: number;
}

export interface TimerStatus {
  isRunning: boolean;
  seconds: number;
}

export interface ExtraTimeStatus {
  minutes: number;
  isVisible: boolean;
}

export interface ScoreboardStyleConfig {
  primary: string;
  secondary: string;
  tertiary: string;
  opacity: number;
  scale: number;
  matchInfo: string;
  timerPosition: "Under" | "Right";
  showRedCardIndicators: boolean;
}

export type ScoreboardStyleOnly = Omit<ScoreboardStyleConfig, 'matchInfo' | 'timerPosition' | 'showRedCardIndicators'>;

export interface LayoutConfig {
  position: "Under" | "Right";
  showRedCardIndicators: boolean;
}


// --- API and WebSocket URLs ---
const API_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws';

// --- State and Event Emitter ---
let appState: {
  config: ScoreboardConfig | null;
  timer: TimerStatus;
  isConnected: boolean;
  scoreboardStyle: ScoreboardStyleConfig | null;
  isGameReportVisible: boolean;
  isScoreboardVisible: boolean;
  isPlayersListVisible: boolean;
  isAutoAddScoreOn: boolean;
  isAutoConvertYellowToRedOn: boolean;
  isAutoAdvancePeriodOn: boolean;
  extraTime: ExtraTimeStatus;
  isMatchInfoVisible: boolean;
  isFutsalClockOn: boolean;
} = {
  config: null,
  timer: { isRunning: false, seconds: 0 },
  isConnected: false,
  scoreboardStyle: { 
    primary: '#000000', 
    secondary: '#FFFFFF', 
    tertiary: '#ffd700', 
    opacity: 75, 
    scale: 100, 
    matchInfo: "", 
    timerPosition: "Under",
    showRedCardIndicators: false
  },
  isGameReportVisible: false, 
  isScoreboardVisible: true,
  isPlayersListVisible: false,
  isAutoAddScoreOn: false,
  isAutoConvertYellowToRedOn: false,
  isAutoAdvancePeriodOn: false,
  extraTime: { minutes: 0, isVisible: false },
  isMatchInfoVisible: false,
  isFutsalClockOn: false,
};

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
  if (newStyle.opacity < 50) newStyle.opacity = 50;
  if (newStyle.opacity > 100) newStyle.opacity = 100;
  if (newStyle.scale < 50) newStyle.scale = 50;
  if (newStyle.scale > 150) newStyle.scale = 150;
  appState.scoreboardStyle = newStyle;
  stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}

function updateGameReportVisibility(isVisible: boolean) {
  appState.isGameReportVisible = isVisible;
  stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}

function updateScoreboardVisibility(isVisible: boolean) {
  appState.isScoreboardVisible = isVisible;
  stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}

function updatePlayersListVisibility(isVisible: boolean) {
  appState.isPlayersListVisible = isVisible;
  stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}

function updateExtraTimeStatus(status: ExtraTimeStatus) {
  appState.extraTime = status;
  stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}

function updateMatchInfoVisibility(isVisible: boolean) {
  appState.isMatchInfoVisible = isVisible;
  stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}

function updateFutsalClockStatus(isOn: boolean) {
  appState.isFutsalClockOn = isOn;
  stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}


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
    throw error;
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
    else if (message.type === 'scoreboard_style') {
      updateScoreboardStyle(message.style as ScoreboardStyleConfig);
    }
    else if (message.type === 'game_report_visibility') {
      updateGameReportVisibility(message.isVisible as boolean);
    }
    else if (message.type === 'scoreboard_visibility') {
      updateScoreboardVisibility(message.isVisible as boolean);
    }
    else if (message.type === 'players_list_visibility') {
      updatePlayersListVisibility(message.isVisible as boolean);
    }
    else if (message.type === 'extra_time_status') {
      updateExtraTimeStatus(message as ExtraTimeStatus);
    }
    else if (message.type === 'match_info_visibility') {
      updateMatchInfoVisibility(message.isVisible as boolean);
    }
    else if (message.type === 'futsal_clock_status') {
      updateFutsalClockStatus(message.isOn as boolean);
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
export async function initStateManager() {
  const savedAutoScore = localStorage.getItem('autoAddScore');
  appState.isAutoAddScoreOn = savedAutoScore === 'true';

  const savedAutoConvert = localStorage.getItem('autoConvertYellowToRed');
  appState.isAutoConvertYellowToRedOn = savedAutoConvert === 'true';

  const savedAutoAdvance = localStorage.getItem('autoAdvancePeriod');
  appState.isAutoAdvancePeriodOn = savedAutoAdvance === 'true';

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

export function setAutoAddScore(isOn: boolean) {
  appState.isAutoAddScoreOn = isOn;
  localStorage.setItem('autoAddScore', isOn ? 'true' : 'false');
}

export function setAutoConvertYellowToRed(isOn: boolean) {
  appState.isAutoConvertYellowToRedOn = isOn;
  localStorage.setItem('autoConvertYellowToRed', isOn ? 'true' : 'false');
}

export function setAutoAdvancePeriod(isOn: boolean) {
  appState.isAutoAdvancePeriodOn = isOn;
  localStorage.setItem('autoAdvancePeriod', isOn ? 'true' : 'false');
  if (appState.timer.isRunning) timerControls.stop();
}

// --- API-Calling Functions ---
export const timerControls = {
  start: () => post('/api/timer/start', {}),
  stop: () => post('/api/timer/stop', {}),
  set: (seconds: number) => post('/api/timer/set', { seconds }),
};

export async function setFutsalClock(isOn: boolean) {
  await post('/api/timer/futsal-toggle', { is_on: isOn });
}

export async function getPeriods(): Promise<PeriodSetting[]> {
  const response = await fetch(`${API_URL}/api/periods`);
  if (!response.ok) throw new Error("Failed to load periods");
  return await response.json();
}

export async function setPeriod(name: string) {
  await post('/api/period', { name });
}

export async function setExtraTime(minutes: number) {
  await post('/api/extra-time/set', { minutes });
}
export async function toggleExtraTimeVisibility() {
  await post('/api/extra-time/toggle', {});
}

export async function setScore(team: 'teamA' | 'teamB', score: number) {
  await post('/api/score/set', { team, score });
}

export async function saveTeamInfo(teamA: object, teamB: object) {
  await post('/api/team-info', { teamA, teamB });
}

export async function saveColors(teamA: object, teamB: object) {
  await post('/api/customization', { teamA, teamB });
}

export async function saveScoreboardStyle(style: ScoreboardStyleOnly) {
  await post('/api/scoreboard-style', style);
}

export async function saveMatchInfo(info: string) {
  await post('/api/match-info', { info });
}

export async function saveLayout(layout: LayoutConfig) {
  await post('/api/layout', layout);
}

export async function toggleGameReport() {
  await post('/api/game-report/toggle', {});
}

export async function toggleScoreboard() {
  await post('/api/scoreboard/toggle', {});
}

export async function togglePlayersList() {
  await post('/api/players-list/toggle', {});
}

export async function toggleMatchInfoVisibility() {
  await post('/api/match-info/toggle', {});
}

export async function toggleRedCardVisibility() {
  await post('/api/red-card-visibility/toggle', {});
}

export async function addPlayer(
  team: 'teamA' | 'teamB',
  number: number,
  name: string,
) {
  await post('/api/player/add', { team, number, name });
}

export async function replacePlayer(
  team: 'teamA' | 'teamB',
  number: number,
  name: string,
) {
  await post('/api/player/replace', { team, number, name });
}

export async function clearPlayerList(team: 'teamA' | 'teamB') {
  await post('/api/player/clear', { team });
}

export async function deletePlayer(team: 'teamA' | 'teamB', number: number) {
  await post('/api/player/delete', { team, number });
}

export async function addGoal(
  team: 'teamA' | 'teamB',
  number: number,
  regMinute: number,
  addMinute: number,
  isOwnGoal: boolean
) {
  await post('/api/player/goal', { team, number, regMinute, addMinute, isOwnGoal });
  
  if (appState.isAutoAddScoreOn) {
    const { config } = getState();
    if (!config) return;
    
    // Own Goal Logic for auto-score
    if (isOwnGoal) {
         const opponent = team === 'teamA' ? 'teamB' : 'teamA';
         const currentScore = config[opponent].score;
         setScore(opponent, currentScore + 1);
    } else {
         const currentScore = config[team].score;
         setScore(team, currentScore + 1);
    }
  }
}

// --- Updated Function ---
export async function addCard(
  team: 'teamA' | 'teamB',
  number: number,
  cardType: 'yellow' | 'red',
  regMinute: number, // <-- Updated
  addMinute: number  // <-- Updated
) {
  await post('/api/player/card', { team, number, card_type: cardType, regMinute, addMinute });
}

export async function toggleOnField(team: 'teamA' | 'teamB', number: number) {
  await post('/api/player/togglefield', { team, number });
}

export async function editPlayer(
  team: 'teamA' | 'teamB',
  originalNumber: number,
  playerData: Omit<PlayerConfig, 'onField'> & { onField: boolean }
) {
  const payload = {
    team: team,
    original_number: originalNumber,
    ...playerData,
  };
  await post('/api/player/edit', payload);
}

export async function resetTeamStats(team: 'teamA' | 'teamB') {
  await post('/api/player/resetstats', { team });
}

export async function downloadJson(fileName: string): Promise<Blob> {
  const url = `${API_URL}/api/json/${fileName}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('File not found or backend error.');
  }
  return await response.blob();
}

export async function getRawJson(fileName: string): Promise<string> {
  const url = `${API_URL}/api/json/${fileName}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('File not found or backend error.');
  }
  return await response.text();
}

export async function uploadJson(fileName: string, jsonData: string) {
  await post('/api/json/upload', { file_name: fileName, json_data: jsonData });
}