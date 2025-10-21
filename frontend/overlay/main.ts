import {
  initStateManager,
  subscribe,
  getState,
  STATE_UPDATE_EVENT,
} from '../control_panel/stateManager';

// --- Get Element References ---
// We use the '!' to tell TypeScript we know these elements exist.
const teamAAbbr = document.getElementById('team-a-abbr')!;
const teamAScore = document.getElementById('team-a-score')!;
const teamBAbbr = document.getElementById('team-b-abbr')!;
const teamBScore = document.getElementById('team-b-score')!;
const timerDisplay = document.getElementById('timer-display')!;

// --- Utility Function ---
function formatTime(totalSeconds: number): string {
  const min = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const sec = (totalSeconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

// --- Main UI Update Function ---
/**
 * This function is called every time the state changes
 * (e.g., score update, timer tick).
 */
function updateUI() {
  const { config, timer } = getState();

  // Update scores and team names
  if (config) {
    teamAAbbr.textContent = config.teamA.abbreviation;
    teamAScore.textContent = config.teamA.score.toString();
    teamBAbbr.textContent = config.teamB.abbreviation;
    teamBScore.textContent = config.teamB.score.toString();
  } else {
    // Fallback if config isn't loaded yet
    teamAAbbr.textContent = 'TMA';
    teamAScore.textContent = '0';
    teamBAbbr.textContent = 'TMB';
    teamBScore.textContent = '0';
  }

  // Update timer display
  timerDisplay.textContent = formatTime(timer.seconds);
}

// --- Initialization ---
/**
 * When the page loads, initialize the state manager
 * and subscribe to updates.
 */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Connect to the backend (fetches config, starts WebSocket)
  await initStateManager();

  // 2. Subscribe our updateUI function to all state changes
  subscribe(updateUI);

  // 3. Run updateUI once immediately to load the initial data
  updateUI();
});