// frontend/overlay/main.ts
import {
  initStateManager,
  subscribe,
  getState,
  STATE_UPDATE_EVENT,
} from '../control_panel/stateManager';

// --- Get Element References ---
const scoreboardContainer = document.querySelector('.scoreboard-container') as HTMLDivElement;
const gameReportContainer = document.querySelector('.game-report-container') as HTMLDivElement;
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
const reportTimerDisplay = document.getElementById('report-timer-display')!;
const reportTeamAName = document.getElementById('report-team-a-name')!;
const reportTeamAScore = document.getElementById('report-team-a-score')!;
const reportStripAPrimary = document.getElementById('report-strip-a-primary') as HTMLDivElement;
const reportStripASecondary = document.getElementById('report-strip-a-secondary') as HTMLDivElement;
const reportTeamBName = document.getElementById('report-team-b-name')!;
const reportTeamBScore = document.getElementById('report-team-b-score')!;
const reportStripBPrimary = document.getElementById('report-strip-b-primary') as HTMLDivElement;
const reportStripBSecondary = document.getElementById('report-strip-b-secondary') as HTMLDivElement;

// --- Utility Functions ---
function formatTime(totalSeconds: number): string {
  const min = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const sec = (totalSeconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

function hexToRgba(hex: string, opacityPercent: number): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) { r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16); }
  else if (hex.length === 7) { r = parseInt(hex.substring(1, 3), 16); g = parseInt(hex.substring(3, 5), 16); b = parseInt(hex.substring(5, 7), 16); }
  else { return `rgba(0, 0, 0, ${opacityPercent / 100})`; }
  const alpha = Math.max(0.5, Math.min(1.0, opacityPercent / 100));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function checkAndApplyScroll(element: HTMLElement | null, textContent: string) {
  if (!element) return;
  element.textContent = textContent;
  const isOverflowing = element.scrollWidth > element.clientWidth;
  if (isOverflowing) {
    if (!element.querySelector('.scrolling-text-wrapper')) {
      element.innerHTML = `<div class="scrolling-text-wrapper"><span class="scrolling-text">${textContent}</span></div>`;
    }
    const innerSpan = element.querySelector('.scrolling-text');
    if(innerSpan && innerSpan.textContent !== textContent) { innerSpan.textContent = textContent; }
  } else {
    if (element.querySelector('.scrolling-text-wrapper')) {
      element.innerHTML = textContent;
    }
  }
}

// --- Main UI Update Function ---
function updateUI() {
  // Visibility flags removed from getState()
  const { config, timer, scoreboardStyle } = getState();

  // Visibility logic removed - elements are always potentially updated
  
  // Update main scoreboard team info
  if (config) {
    teamAAbbr.textContent = config.teamA.abbreviation;
    teamAScore.textContent = config.teamA.score.toString();
    teamBAbbr.textContent = config.teamB.abbreviation;
    teamBScore.textContent = config.teamB.score.toString();
    if (stripAPrimary) stripAPrimary.style.backgroundColor = config.teamA.colors.primary;
    if (stripASecondary) stripASecondary.style.backgroundColor = config.teamA.colors.secondary;
    if (stripBPrimary) stripBPrimary.style.backgroundColor = config.teamB.colors.primary;
    if (stripBSecondary) stripBSecondary.style.backgroundColor = config.teamB.colors.secondary;
  }

  // Update Game Report team info
  if (config) {
    checkAndApplyScroll(reportTeamAName, config.teamA.name);
    if (reportTeamAScore) reportTeamAScore.textContent = config.teamA.score.toString();
    if (reportStripAPrimary) reportStripAPrimary.style.backgroundColor = config.teamA.colors.primary;
    if (reportStripASecondary) reportStripASecondary.style.backgroundColor = config.teamA.colors.secondary;

    checkAndApplyScroll(reportTeamBName, config.teamB.name);
    if (reportTeamBScore) reportTeamBScore.textContent = config.teamB.score.toString();
    if (reportStripBPrimary) reportStripBPrimary.style.backgroundColor = config.teamB.colors.primary;
    if (reportStripBSecondary) reportStripBSecondary.style.backgroundColor = config.teamB.colors.secondary;
  }

  // Update timers
  timerDisplay.textContent = formatTime(timer.seconds);
  if (reportTimerDisplay) reportTimerDisplay.textContent = formatTime(timer.seconds);

  // Apply scoreboard styles (colors, opacity, scale)
  if (scoreboardStyle) {
    const backgroundColorWithOpacity = hexToRgba(scoreboardStyle.primary, scoreboardStyle.opacity);
    const scaleValue = Math.max(0.5, Math.min(1.5, scoreboardStyle.scale / 100));

    // Apply to main scoreboard elements
    if (scoreRow) { scoreRow.style.backgroundColor = backgroundColorWithOpacity; scoreRow.style.color = scoreboardStyle.secondary; }
    if (timerRow) { timerRow.style.backgroundColor = backgroundColorWithOpacity; timerRow.style.color = scoreboardStyle.secondary; }
    if (scoreboardContainer) { scoreboardContainer.style.transform = `scale(${scaleValue})`; }

    // Apply to game report container
    if (gameReportContainer) {
        gameReportContainer.style.backgroundColor = backgroundColorWithOpacity;
        gameReportContainer.style.color = scoreboardStyle.secondary;
        gameReportContainer.style.transform = `translateX(-50%) scale(${scaleValue})`;
    }

  } else {
    // Fallback styles
    if (scoreRow) { scoreRow.style.backgroundColor = ''; scoreRow.style.color = ''; }
    if (timerRow) { timerRow.style.backgroundColor = ''; timerRow.style.color = ''; }
    if (scoreboardContainer) { scoreboardContainer.style.transform = 'scale(1)'; }
    if (gameReportContainer) { gameReportContainer.style.backgroundColor = ''; gameReportContainer.style.color = ''; gameReportContainer.style.transform = 'translateX(-50%) scale(1)'; }
  }

  // Ensure containers are visible (remove potential display:none)
  if (scoreboardContainer) scoreboardContainer.style.display = 'flex';
  if (gameReportContainer) gameReportContainer.style.display = 'flex';
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  await initStateManager();
  subscribe(updateUI);
  updateUI();
});