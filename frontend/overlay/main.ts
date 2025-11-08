// frontend/overlay/main.ts
import {
  initStateManager,
  subscribe,
  getState,
  STATE_UPDATE_EVENT,
  type PlayerConfig
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

// --- Player List Refs ---
const playersListContainer = document.getElementById('players-list-container') as HTMLDivElement;
const playersListHeaderA = document.getElementById('players-list-header-a') as HTMLHeadingElement;
const playersListHeaderB = document.getElementById('players-list-header-b') as HTMLHeadingElement;
const playersListA = document.getElementById('players-list-a') as HTMLTableSectionElement;
const playersListB = document.getElementById('players-list-b') as HTMLTableSectionElement;

// --- Game Report Goal List Refs ---
const gameReportGoalsA = document.getElementById('game-report-goals-a') as HTMLDivElement;
const gameReportGoalsB = document.getElementById('game-report-goals-b') as HTMLDivElement;

// --- Extra Time Refs ---
const extraTimeBox = document.getElementById('extra-time-box') as HTMLDivElement;
const extraTimeDisplay = document.getElementById('extra-time-display') as HTMLSpanElement;

// --- Match Info Refs ---
const matchInfoRow = document.getElementById('match-info-row') as HTMLDivElement;
const matchInfoText = document.getElementById('match-info-text') as HTMLSpanElement;


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

// --- Updated Scroll Check Function ---
function checkAndApplyScroll(wrapper: HTMLElement | null, textContent: string) {
  if (!wrapper) return;
  
  const textSpan = wrapper.querySelector('.scrolling-text') as HTMLSpanElement;
  if (!textSpan) { // Fallback for elements without the wrapper
    wrapper.textContent = textContent;
    return;
  }
  
  // Update text content
  if (textSpan.textContent !== textContent) {
    textSpan.textContent = textContent;
  }
  
  // Check for overflow
  // Force a reflow to get accurate scrollWidth after text change
  textSpan.style.display = 'none';
  void textSpan.offsetWidth; // This forces a reflow
  textSpan.style.display = 'inline-block';
  
  const isOverflowing = textSpan.scrollWidth > wrapper.clientWidth;
  wrapper.classList.toggle('is-scrolling', isOverflowing);
}

// --- Player List Sort and Render Function ---
const renderPlayerList = (players: PlayerConfig[]): string => {
  const onField = players
    .filter(p => p.onField)
    .sort((a, b) => a.number - b.number);
    
  const offField = players
    .filter(p => !p.onField)
    .sort((a, b) => a.number - b.number);

  return [...onField, ...offField]
    .map(player => `
      <tr class="${player.onField ? '' : 'not-on-field'}">
        <td>${player.number}</td>
        <td>${player.name}</td>
      </tr>
    `).join('');
};

// --- Goal Scorer Render Function ---
const renderGoalScorers = (players: PlayerConfig[]): string => {
  const scorers = players
    .filter(p => p.goals.length > 0)
    .sort((a, b) => a.number - b.number);

  if (scorers.length === 0) {
    return '<span></span>'; // Empty but valid
  }

  return scorers.map(player => `
    <div class="overlay-goal-scorer">
      <span class="player-number">#${player.number}</span>
      <span class="player-name">${player.name}</span>
      <span class="goal-minutes">${player.goals.map(g => `${g}'`).join(' ')}</span>
    </div>
  `).join('');
};


// --- Main UI Update Function ---
function updateUI() {
  // Get all relevant state
  const { 
    config, 
    timer, 
    extraTime, 
    scoreboardStyle, 
    isGameReportVisible, 
    isScoreboardVisible, 
    isPlayersListVisible,
    isMatchInfoVisible // <-- New state
  } = getState();
  
  const SCROLL_TRIGGER_LIMIT = 15;
  
  // --- Update Player List ---
  if (config && playersListContainer) {
    playersListHeaderA.textContent = config.teamA.name;
    playersListHeaderB.textContent = config.teamB.name;
    
    const teamAPlayers = config.teamA.players;
    playersListA.innerHTML = renderPlayerList(teamAPlayers).slice(0, 20);
    playersListA.closest('.players-table-wrapper')?.classList.toggle('scrolling', teamAPlayers.length > SCROLL_TRIGGER_LIMIT);
      
    const teamBPlayers = config.teamB.players;
    playersListB.innerHTML = renderPlayerList(teamBPlayers).slice(0, 20);
    playersListB.closest('.players-table-wrapper')?.classList.toggle('scrolling', teamBPlayers.length > SCROLL_TRIGGER_LIMIT);
  }

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

  // Update Game Report
  if (config && gameReportContainer) {
    // Team Info
    checkAndApplyScroll(reportTeamAName.parentElement, config.teamA.name); // Pass wrapper
    if (reportTeamAScore) reportTeamAScore.textContent = config.teamA.score.toString();
    if (reportStripAPrimary) reportStripAPrimary.style.backgroundColor = config.teamA.colors.primary;
    if (reportStripASecondary) reportStripASecondary.style.backgroundColor = config.teamA.colors.secondary;

    checkAndApplyScroll(reportTeamBName.parentElement, config.teamB.name); // Pass wrapper
    if (reportTeamBScore) reportTeamBScore.textContent = config.teamB.score.toString();
    if (reportStripBPrimary) reportStripBPrimary.style.backgroundColor = config.teamB.colors.primary;
    if (reportStripBSecondary) reportStripBSecondary.style.backgroundColor = config.teamB.colors.secondary;
    
    // Goal Scorer List
    gameReportGoalsA.innerHTML = renderGoalScorers(config.teamA.players);
    gameReportGoalsB.innerHTML = renderGoalScorers(config.teamB.players);
  }

  // Update timers
  timerDisplay.textContent = formatTime(timer.seconds);
  if (reportTimerDisplay) reportTimerDisplay.textContent = formatTime(timer.seconds);
  
  // Extra Time Logic
  if (extraTimeBox && extraTimeDisplay) {
    if (extraTime.isVisible && extraTime.minutes > 0) {
      extraTimeDisplay.textContent = `+${extraTime.minutes}'`;
      extraTimeBox.style.display = 'flex';
    } else {
      extraTimeBox.style.display = 'none';
    }
  }


  // Apply scoreboard styles (colors, opacity, scale)
  if (scoreboardStyle) {
    const backgroundColorWithOpacity = hexToRgba(scoreboardStyle.primary, scoreboardStyle.opacity);
    const scaleValue = Math.max(0.5, Math.min(1.5, scoreboardStyle.scale / 100));

    // --- Updated Match Info Logic ---
    if (matchInfoRow && matchInfoText) {
      // Use the *wrapper* for the scroll check
      checkAndApplyScroll(matchInfoRow.querySelector('.scrolling-text-wrapper'), scoreboardStyle.matchInfo);
      matchInfoRow.style.backgroundColor = backgroundColorWithOpacity;
      matchInfoRow.style.color = scoreboardStyle.secondary;
    }

    // Apply to main scoreboard elements
    if (scoreRow) { scoreRow.style.backgroundColor = backgroundColorWithOpacity; scoreRow.style.color = scoreboardStyle.secondary; }
    if (timerRow) { timerRow.style.backgroundColor = backgroundColorWithOpacity; timerRow.style.color = scoreboardStyle.secondary; }
    if (extraTimeBox) { extraTimeBox.style.backgroundColor = backgroundColorWithOpacity; } 
    if (scoreboardContainer) { scoreboardContainer.style.transform = `scale(${scaleValue})`; }

    // Apply to game report container
    if (gameReportContainer) {
        gameReportContainer.style.backgroundColor = backgroundColorWithOpacity;
        gameReportContainer.style.color = scoreboardStyle.secondary;
        gameReportContainer.style.transform = `translateX(-50%) scale(${scaleValue})`;
    }
    
    // Apply to new players list
    if (playersListContainer) {
        playersListContainer.style.backgroundColor = backgroundColorWithOpacity;
        playersListContainer.style.color = scoreboardStyle.secondary;
        playersListContainer.style.transform = `translate(-50%, -50%) scale(${scaleValue})`;
    }

  } else {
    // Fallback styles
    if (matchInfoRow) { matchInfoRow.style.backgroundColor = ''; matchInfoRow.style.color = ''; }
    if (scoreRow) { scoreRow.style.backgroundColor = ''; scoreRow.style.color = ''; }
    if (timerRow) { timerRow.style.backgroundColor = ''; timerRow.style.color = ''; }
    if (extraTimeBox) { extraTimeBox.style.backgroundColor = ''; }
    if (scoreboardContainer) { scoreboardContainer.style.transform = 'scale(1)'; }
    if (gameReportContainer) { gameReportContainer.style.backgroundColor = ''; gameReportContainer.style.color = ''; gameReportContainer.style.transform = 'translateX(-50%) scale(1)'; }
    if (playersListContainer) { playersListContainer.style.backgroundColor = ''; playersListContainer.style.color = ''; playersListContainer.style.transform = 'translate(-50%, -50%) scale(1)'; }
  }

  // --- UPDATED VISIBILITY LOGIC ---
  
  // Apply visibility to the scoreboard container
  if (scoreboardContainer) {
      // Show the main container if either the scoreboard OR the match info is visible
      scoreboardContainer.style.display = (isScoreboardVisible || isMatchInfoVisible) ? 'flex' : 'none';
  }
  
  // Apply visibility to the individual scoreboard elements
  if (scoreRow) {
    scoreRow.style.display = isScoreboardVisible ? 'flex' : 'none';
  }
  if (timerRow) {
    // The parent .timer-section-row handles the flex layout
    (timerRow.parentElement as HTMLElement).style.display = isScoreboardVisible ? 'flex' : 'none';
  }

  // Apply visibility to the match info row
  if (matchInfoRow) {
      matchInfoRow.style.display = isMatchInfoVisible ? 'flex' : 'none';
  }

  // Apply visibility to the game report container
  if (gameReportContainer) {
      gameReportContainer.style.display = isGameReportVisible ? 'flex' : 'none';
  }
  
  // Apply visibility to the players list container
  if (playersListContainer) {
      playersListContainer.style.display = isPlayersListVisible ? 'flex' : 'none';
  }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  await initStateManager();
  subscribe(updateUI);
  updateUI();
});