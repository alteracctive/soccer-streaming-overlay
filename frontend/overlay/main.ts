import {
  initStateManager,
  subscribe,
  getState,
  STATE_UPDATE_EVENT,
} from '../control_panel/stateManager';

// --- Get Element References ---
const teamAAbbr = document.getElementById('team-a-abbr')!;
const teamAScore = document.getElementById('team-a-score')!;
const teamBAbbr = document.getElementById('team-b-abbr')!;
const teamBScore = document.getElementById('team-b-score')!;
const timerDisplay = document.getElementById('timer-display')!;

// Get color strip elements
const stripAPrimary = document.getElementById('overlay-strip-a-primary') as HTMLDivElement;
const stripASecondary = document.getElementById('overlay-strip-a-secondary') as HTMLDivElement;
const stripBPrimary = document.getElementById('overlay-strip-b-primary') as HTMLDivElement;
const stripBSecondary = document.getElementById('overlay-strip-b-secondary') as HTMLDivElement;

// --- Utility Function ---
function formatTime(totalSeconds: number): string {
  const min = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const sec = (totalSeconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

// --- Main UI Update Function ---
function updateUI() {
  const { config, timer } = getState();

  // Update scores and team names
  if (config) {
    teamAAbbr.textContent = config.teamA.abbreviation;
    teamAScore.textContent = config.teamA.score.toString();
    teamBAbbr.textContent = config.teamB.abbreviation;
    teamBScore.textContent = config.teamB.score.toString();

    // Update color strips
    if (stripAPrimary) stripAPrimary.style.backgroundColor = config.teamA.colors.primary;
    if (stripASecondary) stripASecondary.style.backgroundColor = config.teamA.colors.secondary;
    if (stripBPrimary) stripBPrimary.style.backgroundColor = config.teamB.colors.primary;
    if (stripBSecondary) stripBSecondary.style.backgroundColor = config.teamB.colors.secondary;
  }

  // Update timer display
  timerDisplay.textContent = formatTime(timer.seconds);
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  await initStateManager();
  subscribe(updateUI);
  updateUI();
});