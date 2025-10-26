import {
  initStateManager,
  subscribe,
  getState,
  STATE_UPDATE_EVENT,
} from '../control_panel/stateManager';

// --- Get Element References ---
const scoreboardContainer = document.querySelector('.scoreboard-container') as HTMLDivElement;
const scoreRow = document.querySelector('.score-row') as HTMLDivElement;
const timerRow = document.querySelector('.timer-row') as HTMLDivElement;
const teamAAbbr = document.getElementById('team-a-abbr')!;
const teamAScore = document.getElementById('team-a-score')!;
const teamBAbbr = document.getElementById('team-b-abbr')!;
const teamBScore = document.getElementById('team-b-score')!;
const timerDisplay = document.getElementById('timer-display')!;
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

// --- NEW Utility Function: Convert hex and opacity % to RGBA ---
function hexToRgba(hex: string, opacityPercent: number): string {
  let r = 0, g = 0, b = 0;
  // Convert 3-digit hex to 6-digit
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  }
  // Convert 6-digit hex
  else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  } else {
    // Fallback for invalid hex
    return `rgba(0, 0, 0, ${opacityPercent / 100})`;
  }
  // Clamp opacity between 50 and 100, then convert to 0.5-1.0
  const alpha = Math.max(0.5, Math.min(1.0, opacityPercent / 100));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


// --- Main UI Update Function ---
function updateUI() {
  const { config, timer, scoreboardStyle } = getState();

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

  // Apply scoreboard styles (including opacity)
  if (scoreboardStyle) {
    // Calculate RGBA color using the new utility function
    const backgroundColorWithOpacity = hexToRgba(scoreboardStyle.primary, scoreboardStyle.opacity);

    if (scoreRow) {
      scoreRow.style.backgroundColor = backgroundColorWithOpacity;
      scoreRow.style.color = scoreboardStyle.secondary;
    }
    if (timerRow) {
      timerRow.style.backgroundColor = backgroundColorWithOpacity;
      timerRow.style.color = scoreboardStyle.secondary;
    }
    if (scoreboardContainer) {
        // Convert percentage (50-150) to decimal (0.5-1.5)
        const scaleValue = Math.max(0.5, Math.min(1.5, scoreboardStyle.scale / 100));
        scoreboardContainer.style.transform = `scale(${scaleValue})`;
    }
  } else {
    // Fallback to default CSS if style is missing
    if (scoreRow) {
        scoreRow.style.backgroundColor = ''; // Let CSS handle it
        scoreRow.style.color = ''; // Let CSS handle it
    }
    if (timerRow) {
        timerRow.style.backgroundColor = ''; // Let CSS handle it
        timerRow.style.color = ''; // Let CSS handle it
    }
    if (scoreboardContainer) {
        scoreboardContainer.style.transform = 'scale(1)';
    }
  }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  await initStateManager();
  subscribe(updateUI);
  updateUI(); // Run once on load
});