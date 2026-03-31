// frontend/control_panel/stateManager.ts

// ... (Existing Imports and Types Unchanged) ...
export interface ColorConfig { primary: string; secondary: string; }
export interface Goal { regMinute: number; addMinute: number; isOwnGoal: boolean; isPenalty: boolean; }
export interface Card { regMinute: number; addMinute: number; }
export interface PlayerConfig { number: number; name: string; onField: boolean; timeOnField: number; yellowCards: Card[]; redCards: Card[]; goals: Goal[]; }
export interface TeamConfig { name: string; abbreviation: string; score: number; colors: ColorConfig; players: PlayerConfig[]; }
export interface ScoreboardConfig { teamA: TeamConfig; teamB: TeamConfig; currentPeriod: string; }
export interface PeriodSetting {
    name: string;
    endTime: number;
}

export interface PeriodSettingsData {
    periods: PeriodSetting[];
    is_ascending: boolean;
}

export interface TimerStatus {
    isRunning: boolean;
    seconds: number;
}
export interface ExtraTimeStatus { minutes: number; isVisible: boolean; }
export interface ScoreboardStyleConfig { primary: string; secondary: string; tertiary: string; opacity: number; scale: number; matchInfo: string; timerPosition: "Under" | "Right"; showRedCardIndicators: boolean; }
export type ScoreboardStyleOnly = Omit<ScoreboardStyleConfig, 'matchInfo' | 'timerPosition' | 'showRedCardIndicators'>;
export interface LayoutConfig { position: "Under" | "Right"; showRedCardIndicators: boolean; }

export interface Shortcut {
    action_id: string;
    label: string;
    key: string | null;
}

export interface VarState {
    isVisible: boolean;
    scenario: string;
    message: string;
    decision: string;
}

const API_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws';

let appState: {
  config: ScoreboardConfig | null;
  timer: TimerStatus;
  isConnected: boolean;
  scoreboardStyle: ScoreboardStyleConfig | null;
  periods: PeriodSetting[] | null;
  isPeriodAscending: boolean | null;
  isGameReportVisible: boolean;
  isScoreboardVisible: boolean;
  isPlayersListVisibleA: boolean;
  isPlayersListVisibleB: boolean;
  isPlayersListVisible: boolean;
  isAutoAddScoreOn: boolean;
  isAutoConvertYellowToRedOn: boolean;
  isAutoAdvancePeriodOn: boolean;
  extraTime: ExtraTimeStatus;
  isMatchInfoVisible: boolean;
  isFutsalClockOn: boolean;
  shortcuts: Shortcut[];
  playerToEdit: { team: 'teamA' | 'teamB', number: number } | null;
  isTeamInfoCollapsed: boolean;
  varState: VarState;
} = {
  config: null,
  timer: { isRunning: false, seconds: 0 },
  isConnected: false,
  scoreboardStyle: { primary: '#000000', secondary: '#FFFFFF', tertiary: '#ffd700', opacity: 75, scale: 100, matchInfo: "", timerPosition: "Under", showRedCardIndicators: false },
  periods: null,
  isPeriodAscending: null,
  isGameReportVisible: false, 
  isScoreboardVisible: true,
  isPlayersListVisibleA: false,
  isPlayersListVisibleB: false,
  isPlayersListVisible: false,
  isAutoAddScoreOn: false,
  isAutoConvertYellowToRedOn: false,
  isAutoAdvancePeriodOn: false,
  extraTime: { minutes: 0, isVisible: false },
  isMatchInfoVisible: false,
  isFutsalClockOn: false,
  shortcuts: [],
  playerToEdit: null,
  isTeamInfoCollapsed: false,
  varState: { isVisible: false, scenario: '', message: '', decision: '' },
};

export const stateEmitter = new EventTarget();
export const STATE_UPDATE_EVENT = 'stateupdate';
export const CONNECTION_STATUS_EVENT = 'connectionstatus';

// ... (Internal Update Functions Unchanged) ...
function updateConfig(newConfig: ScoreboardConfig) { appState.config = newConfig; stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT)); }
function updateTimer(newTimerStatus: Partial<TimerStatus>) { appState.timer = { ...appState.timer, ...newTimerStatus }; stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT)); }
function updateConnectionStatus(status: boolean) { appState.isConnected = status; stateEmitter.dispatchEvent(new CustomEvent(CONNECTION_STATUS_EVENT, { detail: status })); }
function updateScoreboardStyle(newStyle: ScoreboardStyleConfig) { appState.scoreboardStyle = newStyle; stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT)); }

function updatePeriods(data: PeriodSettingsData) {
    appState.periods = data.periods;
    appState.isPeriodAscending = data.is_ascending;
    stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}

function updateGameReportVisibility(isVisible: boolean) { appState.isGameReportVisible = isVisible; stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT)); }
function updateScoreboardVisibility(isVisible: boolean) { appState.isScoreboardVisible = isVisible; stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT)); }
function updatePlayersListVisibility(data: { isVisibleA: boolean, isVisibleB: boolean }) { appState.isPlayersListVisibleA = data.isVisibleA; appState.isPlayersListVisibleB = data.isVisibleB; appState.isPlayersListVisible = data.isVisibleA || data.isVisibleB; stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT)); }
function updateExtraTimeStatus(status: ExtraTimeStatus) { appState.extraTime = status; stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT)); }
function updateMatchInfoVisibility(isVisible: boolean) { appState.isMatchInfoVisible = isVisible; stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT)); }
function updateFutsalClockStatus(isOn: boolean) { appState.isFutsalClockOn = isOn; stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT)); }
function updateVarState(newVarState: VarState) { appState.varState = newVarState; stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT)); }

// --- New Helper for Shortcuts ---
function updateShortcuts(shortcuts: Shortcut[]) {
    appState.shortcuts = shortcuts;
    stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}

async function post(endpoint: string, body: object) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) { const errData = await response.json(); throw new Error(errData.detail || 'An API error occurred'); }
    return await response.json();
  } catch (error) { console.error(`Error in POST ${endpoint}:`, error); throw error; }
}

function connectWebSocket() {
  const ws = new WebSocket(WS_URL);
  ws.onopen = () => { console.log('WebSocket connected'); updateConnectionStatus(true); };
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'time') updateTimer({ seconds: message.seconds });
    else if (message.type === 'status') updateTimer({ isRunning: message.isRunning, seconds: message.seconds });
    else if (message.type === 'config') updateConfig(message.config as ScoreboardConfig);
    else if (message.type === 'scoreboard_style') updateScoreboardStyle(message.style as ScoreboardStyleConfig);
    else if (message.type === 'period_settings') updatePeriods(message.settings as PeriodSettingsData);
    else if (message.type === 'game_report_visibility') updateGameReportVisibility(message.isVisible as boolean);
    else if (message.type === 'scoreboard_visibility') updateScoreboardVisibility(message.isVisible as boolean);
    else if (message.type === 'players_list_visibility') updatePlayersListVisibility(message);
    else if (message.type === 'extra_time_status') updateExtraTimeStatus(message as ExtraTimeStatus);
    else if (message.type === 'match_info_visibility') updateMatchInfoVisibility(message.isVisible as boolean);
    else if (message.type === 'futsal_clock_status') updateFutsalClockStatus(message.isOn as boolean);
    else if (message.type === 'var_update') updateVarState(message.data as VarState);
  };
  ws.onclose = () => { console.log('WS disconnected'); updateConnectionStatus(false); setTimeout(connectWebSocket, 3000); };
  ws.onerror = (error) => { console.error('WS error:', error); updateConnectionStatus(false); ws.close(); };
}

export async function sendVarUpdate(varData: Partial<VarState>) {
    await post('/api/var-update', varData);
}

export async function initStateManager() {
  appState.isAutoAddScoreOn = localStorage.getItem('autoAddScore') === 'true';
  appState.isAutoConvertYellowToRedOn = localStorage.getItem('autoConvertYellowToRed') === 'true';
  appState.isAutoAdvancePeriodOn = localStorage.getItem('autoAdvancePeriod') === 'true';
  appState.isTeamInfoCollapsed = localStorage.getItem('isTeamInfoCollapsed') === 'true';
  
  // Load initial shortcuts
  try {
      const shortcuts = await getShortcuts();
      updateShortcuts(shortcuts);
  } catch (e) { console.error("Error init shortcuts:", e); }

  connectWebSocket();
}

export function getState() { return appState; }
export function subscribe(callback: (event: Event) => void) { stateEmitter.addEventListener(STATE_UPDATE_EVENT, callback); }
export function unsubscribe(callback: (event: Event) => void) { stateEmitter.removeEventListener(STATE_UPDATE_EVENT, callback); }
export function setAutoAddScore(isOn: boolean) { appState.isAutoAddScoreOn = isOn; localStorage.setItem('autoAddScore', isOn ? 'true' : 'false'); }
export function setAutoConvertYellowToRed(isOn: boolean) { appState.isAutoConvertYellowToRedOn = isOn; localStorage.setItem('autoConvertYellowToRed', isOn ? 'true' : 'false'); }
export function setAutoAdvancePeriod(isOn: boolean) { appState.isAutoAdvancePeriodOn = isOn; localStorage.setItem('autoAdvancePeriod', isOn ? 'true' : 'false'); if (appState.timer.isRunning) timerControls.stop(); }

export function setTeamInfoCollapsed(isCollapsed: boolean) {
    appState.isTeamInfoCollapsed = isCollapsed;
    localStorage.setItem('isTeamInfoCollapsed', isCollapsed ? 'true' : 'false');
    stateEmitter.dispatchEvent(new CustomEvent(STATE_UPDATE_EVENT));
}

export function setPlayerToEdit(team: 'teamA' | 'teamB', number: number) {
    appState.playerToEdit = { team, number };
}

export function getPlayerToEdit() {
    const player = appState.playerToEdit;
    appState.playerToEdit = null;
    return player;
}

// ... (Other functions: timerControls, setFutsalClock, getPeriods, setPeriod, setExtraTime, toggleExtraTimeVisibility, setScore, saveTeamInfo, saveColors, saveScoreboardStyle, saveMatchInfo, saveLayout, toggleGameReport, toggleScoreboard, toggleMatchInfoVisibility, togglePlayersListA, togglePlayersListB, setPlayersListVisibility, addPlayer, replacePlayer, clearPlayerList, deletePlayer, addGoal, addCard, toggleOnField, editPlayer, resetTeamStats, downloadJson, getRawJson, uploadJson - ALL UNCHANGED) ...
export const timerControls = { start: () => post('/api/timer/start', {}), stop: () => post('/api/timer/stop', {}), set: (seconds: number) => post('/api/timer/set', { seconds }) };
export async function setFutsalClock(isOn: boolean) { await post('/api/timer/futsal-toggle', { is_on: isOn }); }

export async function getPeriods(forceRefetch = false): Promise<PeriodSettingsData> {
    if (!forceRefetch && appState.periods && appState.isPeriodAscending !== null) {
        return {
            periods: appState.periods,
            is_ascending: appState.isPeriodAscending,
        };
    }

    try {
        const response = await fetch(`${API_URL}/api/periods-settings`);
        if (!response.ok) {
            throw new Error("Failed to fetch period settings");
        }
        const data: PeriodSettingsData = await response.json();
        updatePeriods(data);
        return data;
    } catch (error) {
        console.error("Error fetching period settings:", error);
        throw error;
    }
}

export async function savePeriods(periods: PeriodSetting[], isAscending: boolean) {
    await post('/api/periods-settings', { periods, is_ascending: isAscending });
    // After saving, update the state to reflect the changes
    updatePeriods({ periods, is_ascending: isAscending });
}
export async function setPeriod(name: string) { await post('/api/period', { name }); }
export async function setExtraTime(minutes: number) { await post('/api/extra-time/set', { minutes }); }
export async function toggleExtraTimeVisibility() { await post('/api/extra-time/toggle', {}); }
export async function setScore(team: 'teamA' | 'teamB', score: number) { await post('/api/score/set', { team, score }); }
export async function saveTeamInfo(teamA: object, teamB: object) { await post('/api/team-info', { teamA, teamB }); }
export async function saveColors(teamA: object, teamB: object) { await post('/api/customization', { teamA, teamB }); }
export async function saveScoreboardStyle(style: ScoreboardStyleOnly) { await post('/api/scoreboard-style', style); }
export async function saveMatchInfo(info: string) { await post('/api/match-info', { info }); }
export async function saveLayout(layout: LayoutConfig) { await post('/api/layout', layout); }
export async function toggleGameReport() { await post('/api/game-report/toggle', {}); }
export async function toggleScoreboard() { await post('/api/scoreboard/toggle', {}); }
export async function toggleMatchInfoVisibility() { await post('/api/match-info/toggle', {}); }
export async function togglePlayersListA() { await post('/api/players-list/toggle-a', {}); }
export async function togglePlayersListB() { await post('/api/players-list/toggle-b', {}); }
export async function setPlayersListVisibility(visibleA: boolean, visibleB: boolean) { await post('/api/players-list/set', { visibleA, visibleB }); }
export async function addPlayer(team: 'teamA' | 'teamB', number: number, name: string) { await post('/api/player/add', { team, number, name }); }
export async function replacePlayer(team: 'teamA' | 'teamB', number: number, name: string) { await post('/api/player/replace', { team, number, name }); }
export async function clearPlayerList(team: 'teamA' | 'teamB') { await post('/api/player/clear', { team }); }
export async function deletePlayer(team: 'teamA' | 'teamB', number: number) { await post('/api/player/delete', { team, number }); }
export async function addGoal(team: 'teamA' | 'teamB', number: number, regMinute: number, addMinute: number, isOwnGoal: boolean, isPenalty: boolean) { 
  await post('/api/player/goal', { team, number, regMinute, addMinute, isOwnGoal, isPenalty }); 
  if (appState.isAutoAddScoreOn) { 
    const { config } = getState(); if (!config) return; 
    if (isOwnGoal) { const opponent = team === 'teamA' ? 'teamB' : 'teamA'; setScore(opponent, config[opponent].score + 1); } 
    else { setScore(team, config[team].score + 1); } 
  } 
}
export async function addCard(team: 'teamA' | 'teamB', number: number, cardType: 'yellow' | 'red', regMinute: number, addMinute: number) { await post('/api/player/card', { team, number, card_type: cardType, regMinute, addMinute }); }
export async function toggleOnField(team: 'teamA' | 'teamB', number: number) { await post('/api/player/togglefield', { team, number }); }
export async function editPlayer(team: 'teamA' | 'teamB', originalNumber: number, playerData: PlayerConfig) { await post('/api/player/edit', { team, original_number: originalNumber, ...playerData }); }
export async function resetTeamStats(team: 'teamA' | 'teamB') { await post('/api/player/resetstats', { team }); }
export async function downloadJson(fileName: string): Promise<Blob> { const url = `${API_URL}/api/json/${fileName}`; const response = await fetch(url); if (!response.ok) throw new Error('Error'); return await response.blob(); }
export async function getRawJson(fileName: string): Promise<string> { const url = `${API_URL}/api/json/${fileName}`; const response = await fetch(url); if (!response.ok) throw new Error('Error'); return await response.text(); }
export async function uploadJson(fileName: string, jsonData: string): Promise<string[]> { const res = await post('/api/json/upload', { file_name: fileName, json_data: jsonData }); return res.warnings || []; }

// --- Updated Shortcut Functions ---
export async function getShortcuts(): Promise<Shortcut[]> {
    const res = await fetch(`${API_URL}/api/shortcuts`);
    if(!res.ok) throw new Error("Failed to fetch shortcuts");
    return await res.json();
}

export async function saveShortcut(action_id: string, key: string | null) {
    // API returns the updated list
    const updatedList = await post('/api/shortcuts', { action_id, key });
    // Update local state immediately
    updateShortcuts(updatedList);
}
