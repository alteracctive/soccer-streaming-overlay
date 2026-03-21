// frontend/overlay/main.ts
import {
  initStateManager,
  subscribe,
  getState,
  STATE_UPDATE_EVENT,
  type PlayerConfig,
  type Goal
} from '../control_panel/stateManager';

// Import Global Shortcuts
import { initGlobalShortcuts } from '../control_panel/globalShortcuts';

// ... (Rest of Variable Declarations and Render Functions Unchanged) ...
// ... (Keep the rest of the file content as is, only the bottom Init block changes) ...

const scoreboardContainer = document.getElementById('scoreboard-container') as HTMLDivElement;
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
const reportTeamAName = document.getElementById('report-team-a-name')!;
const reportTeamAScore = document.getElementById('report-team-a-score')!;
const reportStripAPrimary = document.getElementById('report-strip-a-primary') as HTMLDivElement;
const reportStripASecondary = document.getElementById('report-strip-a-secondary') as HTMLDivElement;
const reportTeamBName = document.getElementById('report-team-b-name')!;
const reportTeamBScore = document.getElementById('report-team-b-score')!;
const reportStripBPrimary = document.getElementById('report-strip-b-primary') as HTMLDivElement;
const reportStripBSecondary = document.getElementById('report-strip-b-secondary') as HTMLDivElement;
const reportMiddleScoreA = document.getElementById('report-middle-score-a') as HTMLSpanElement;
const reportMiddleScoreB = document.getElementById('report-middle-score-b') as HTMLSpanElement;
const reportMiddleStripAPrimary = document.getElementById('report-middle-strip-a-primary') as HTMLDivElement;
const reportMiddleStripASecondary = document.getElementById('report-middle-strip-a-secondary') as HTMLDivElement;
const reportMiddleStripBPrimary = document.getElementById('report-middle-strip-b-primary') as HTMLDivElement;
const reportMiddleStripBSecondary = document.getElementById('report-middle-strip-b-secondary') as HTMLDivElement;

const playersListContainerA = document.getElementById('players-list-container-a') as HTMLDivElement;
const playersListContainerB = document.getElementById('players-list-container-b') as HTMLDivElement;
const playersListHeaderA = document.getElementById('players-list-header-a') as HTMLHeadingElement;
const playersListHeaderB = document.getElementById('players-list-header-b') as HTMLHeadingElement;
const playersListA = document.getElementById('players-list-a') as HTMLTableSectionElement;
const playersListB = document.getElementById('players-list-b') as HTMLTableSectionElement;
const playersListStripAPrimary = document.getElementById('players-list-strip-a-primary') as HTMLDivElement;
const playersListStripASecondary = document.getElementById('players-list-strip-a-secondary') as HTMLDivElement;
const playersListStripBPrimary = document.getElementById('players-list-strip-b-primary') as HTMLDivElement;
const playersListStripBSecondary = document.getElementById('players-list-strip-b-secondary') as HTMLDivElement;

const gameReportGoalsA = document.getElementById('game-report-goals-a') as HTMLDivElement;
const gameReportGoalsB = document.getElementById('game-report-goals-b') as HTMLDivElement;
const extraTimeBox = document.getElementById('extra-time-box') as HTMLDivElement;
const extraTimeDisplay = document.getElementById('extra-time-display') as HTMLSpanElement;
const matchInfoRow = document.getElementById('match-info-row') as HTMLDivElement;
const matchInfoText = document.getElementById('match-info-text') as HTMLSpanElement;
const teamARedCards = document.getElementById('team-a-red-cards') as HTMLDivElement;
const teamBRedCards = document.getElementById('team-b-red-cards') as HTMLDivElement;
const timerSectionRow = document.getElementById('timer-section-row') as HTMLDivElement;
const gameReportPeriod = document.getElementById('game-report-period') as HTMLDivElement;

function formatTime(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60);
  const sec = (totalSeconds % 60).toString().padStart(2, '0');
  const min = (totalMinutes < 100) ? totalMinutes.toString().padStart(2, '0') : totalMinutes.toString();
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

function checkAndApplyScroll(wrapper: HTMLElement | null, textContent: string) {
  if (!wrapper) return;
  const textSpan = wrapper.querySelector('.scrolling-text') as HTMLSpanElement;
  if (!textSpan) { wrapper.textContent = textContent; return; }
  if (textSpan.textContent !== textContent) { textSpan.textContent = textContent; }
  textSpan.style.display = 'none'; void textSpan.offsetWidth; textSpan.style.display = 'inline-block';
  const isOverflowing = textSpan.scrollWidth > wrapper.clientWidth;
  wrapper.classList.toggle('is-scrolling', isOverflowing);
}

const renderPlayerList = (players: PlayerConfig[], targetLength: number, isScrolling: boolean, teamId: 'teamA' | 'teamB'): string => {
  const onField = players.filter(p => p.onField).sort((a, b) => a.number - b.number);
  const offField = players.filter(p => !p.onField).sort((a, b) => a.number - b.number);
  const sortedPlayers = [...onField, ...offField];
  let listHtml = sortedPlayers.map(player => {
      const rowClass = player.onField ? '' : 'not-on-field';
      if (teamId === 'teamB') { return `<tr class="${rowClass}"><td>${player.name}</td><td>${player.number}</td></tr>`; } 
      else { return `<tr class="${rowClass}"><td>${player.number}</td><td>${player.name}</td></tr>`; }
    }).join('');
  const paddingNeeded = targetLength - sortedPlayers.length;
  if (paddingNeeded > 0) { listHtml += Array(paddingNeeded).fill('<tr class="player-padding-row"><td>&nbsp;</td><td>&nbsp;</td></tr>').join(''); }
  if (isScrolling) { listHtml += '<tr class="player-padding-row"><td>&nbsp;</td><td>&nbsp;</td></tr>'; }
  if (isScrolling) { return listHtml + listHtml; } else { return listHtml; }
};

const renderGoalScorers = (teamPlayers: PlayerConfig[], opponentPlayers: PlayerConfig[]): string => {
  const teamGoals = teamPlayers.flatMap(p => p.goals.filter(g => !g.isOwnGoal).map(g => ({ reg: g.regMinute, add: g.addMinute, playerName: p.name, playerNumber: p.number, type: 'Goal', isPenalty: g.isPenalty })));
  const opponentOwnGoals = opponentPlayers.flatMap(p => p.goals.filter(g => g.isOwnGoal).map(g => ({ reg: g.regMinute, add: g.addMinute, playerName: p.name, playerNumber: p.number, type: 'Own Goal', isPenalty: false })));
  const allEvents = [...teamGoals, ...opponentOwnGoals].sort((a, b) => { if (a.reg !== b.reg) return a.reg - b.reg; return a.add - b.add; });
  if (allEvents.length === 0) { return '<span></span>'; }
  return allEvents.map(event => {
    const timeString = event.add > 0 ? `${event.reg}+${event.add}'` : `${event.reg}'`;
    const penaltyString = event.type === 'Goal' && event.isPenalty ? ' (P)' : '';
    const ogString = event.type === 'Own Goal' ? ' (OG)' : '';
    return `<div class="overlay-goal-scorer"><span class="player-number">#${event.playerNumber}</span><span class="player-name">${event.playerName}${ogString}${penaltyString}</span><span class="goal-minutes">${timeString}</span></div>`;
  }).join('');
};

const renderRedCards = (count: number): string => {
  if (count === 0) { return ''; }
  if (count >= 5) { return `<div class="red-card-count">${count}</div>`; }
  return Array(count).fill('').map(() => `<div class="red-card-box"></div>`).join('');
};

function updateUI() {
  const { 
    config, timer, extraTime, scoreboardStyle, 
    isGameReportVisible, isScoreboardVisible, isMatchInfoVisible,
    isPlayersListVisibleA, isPlayersListVisibleB
  } = getState();
  
  const SCROLL_TRIGGER_LIMIT = 15;
  let teamBRedCount = 0;
  
  if (config && playersListContainerA && playersListContainerB) {
    const headerASpan = playersListHeaderA.querySelector('span'); if (headerASpan) headerASpan.textContent = config.teamA.name;
    const headerBSpan = playersListHeaderB.querySelector('span'); if (headerBSpan) headerBSpan.textContent = config.teamB.name;
    if (playersListStripAPrimary) playersListStripAPrimary.style.backgroundColor = config.teamA.colors.primary;
    if (playersListStripASecondary) playersListStripASecondary.style.backgroundColor = config.teamA.colors.secondary;
    if (playersListStripBPrimary) playersListStripBPrimary.style.backgroundColor = config.teamB.colors.primary;
    if (playersListStripBSecondary) playersListStripBSecondary.style.backgroundColor = config.teamB.colors.secondary;
    const teamAPlayers = config.teamA.players; const teamBPlayers = config.teamB.players;
    const maxLength = Math.max(teamAPlayers.length, teamBPlayers.length);
    const isScrolling = maxLength > SCROLL_TRIGGER_LIMIT;
    
    playersListA.innerHTML = renderPlayerList(teamAPlayers, maxLength, isScrolling, 'teamA');
    playersListB.innerHTML = renderPlayerList(teamBPlayers, maxLength, isScrolling, 'teamB');
    
    const duration = isScrolling ? (maxLength + 1) * 1.5 : 0; 
    const wrapperA = playersListA.closest('.players-table-wrapper') as HTMLElement;
    const wrapperB = playersListB.closest('.players-table-wrapper') as HTMLElement;
    if (wrapperA) { wrapperA.classList.toggle('scrolling', isScrolling); wrapperA.style.setProperty('--scroll-duration', `${duration}s`); }
    if (wrapperB) { wrapperB.classList.toggle('scrolling', isScrolling); wrapperB.style.setProperty('--scroll-duration', `${duration}s`); }
  }

  if (config) {
    teamAAbbr.textContent = config.teamA.abbreviation;
    teamAScore.textContent = config.teamA.score.toString();
    teamBAbbr.textContent = config.teamB.abbreviation;
    teamBScore.textContent = config.teamB.score.toString();
    if (stripAPrimary) stripAPrimary.style.backgroundColor = config.teamA.colors.primary;
    if (stripASecondary) stripASecondary.style.backgroundColor = config.teamA.colors.secondary;
    if (stripBPrimary) stripBPrimary.style.backgroundColor = config.teamB.colors.primary;
    if (stripBSecondary) stripBSecondary.style.backgroundColor = config.teamB.colors.secondary;
    const teamARedCount = config.teamA.players.filter(p => p.onField && p.redCards.length > 0).length;
    teamBRedCount = config.teamB.players.filter(p => p.onField && p.redCards.length > 0).length;
    teamARedCards.innerHTML = renderRedCards(teamARedCount);
    teamBRedCards.innerHTML = renderRedCards(teamBRedCount);
  }

  if (config && gameReportContainer) {
    if (gameReportPeriod && config.currentPeriod) { gameReportPeriod.textContent = config.currentPeriod; }
    checkAndApplyScroll(reportTeamAName.parentElement, config.teamA.name); 
    if (reportTeamAScore) reportTeamAScore.textContent = config.teamA.score.toString();
    if (reportStripAPrimary) reportStripAPrimary.style.backgroundColor = config.teamA.colors.primary;
    if (reportStripASecondary) reportStripASecondary.style.backgroundColor = config.teamA.colors.secondary;
    checkAndApplyScroll(reportTeamBName.parentElement, config.teamB.name); 
    if (reportTeamBScore) reportTeamBScore.textContent = config.teamB.score.toString();
    if (reportStripBPrimary) reportStripBPrimary.style.backgroundColor = config.teamB.colors.primary;
    if (reportStripBSecondary) reportStripBSecondary.style.backgroundColor = config.teamB.colors.secondary;
    if (reportMiddleScoreA) reportMiddleScoreA.textContent = config.teamA.score.toString();
    if (reportMiddleScoreB) reportMiddleScoreB.textContent = config.teamB.score.toString();
    if (reportMiddleStripAPrimary) reportMiddleStripAPrimary.style.backgroundColor = config.teamA.colors.primary;
    if (reportMiddleStripASecondary) reportMiddleStripASecondary.style.backgroundColor = config.teamA.colors.secondary;
    if (reportMiddleStripBPrimary) reportMiddleStripBPrimary.style.backgroundColor = config.teamB.colors.primary;
    if (reportMiddleStripBSecondary) reportMiddleStripBSecondary.style.backgroundColor = config.teamB.colors.secondary;
    gameReportGoalsA.innerHTML = renderGoalScorers(config.teamA.players, config.teamB.players);
    gameReportGoalsB.innerHTML = renderGoalScorers(config.teamB.players, config.teamA.players);
  }

  timerDisplay.textContent = formatTime(timer.seconds);
  if (extraTimeBox && extraTimeDisplay) {
    if (extraTime.isVisible && extraTime.minutes > 0) { extraTimeDisplay.textContent = `+${extraTime.minutes}'`; extraTimeBox.style.display = 'flex'; } 
    else { extraTimeBox.style.display = 'none'; }
  }

  if (scoreboardStyle) {
    const backgroundColorWithOpacity = hexToRgba(scoreboardStyle.primary, scoreboardStyle.opacity);
    const scaleValue = Math.max(0.5, Math.min(1.5, scoreboardStyle.scale / 100));
    document.body.style.setProperty('--scoreboard-text-secondary', scoreboardStyle.secondary);
    document.body.style.setProperty('--scoreboard-text-tertiary', scoreboardStyle.tertiary);

    if (matchInfoRow && matchInfoText) { checkAndApplyScroll(matchInfoRow.querySelector('.scrolling-text-wrapper'), scoreboardStyle.matchInfo); matchInfoRow.style.backgroundColor = backgroundColorWithOpacity; matchInfoRow.style.color = scoreboardStyle.secondary; }
    if (scoreRow) { scoreRow.style.backgroundColor = backgroundColorWithOpacity; scoreRow.style.color = scoreboardStyle.secondary; } 
    if (timerRow) { timerRow.style.backgroundColor = backgroundColorWithOpacity; timerRow.style.color = scoreboardStyle.secondary; } 
    if (extraTimeBox) { extraTimeBox.style.backgroundColor = backgroundColorWithOpacity; extraTimeBox.style.color = scoreboardStyle.tertiary; } 
    if (scoreboardContainer) { 
      scoreboardContainer.style.transform = `scale(${scaleValue})`;
      const isRightLayout = scoreboardStyle.timerPosition === 'Right';
      scoreboardContainer.classList.toggle('timer-position-right', isRightLayout);
      scoreboardContainer.classList.toggle('show-red-indicators', scoreboardStyle.showRedCardIndicators);
      if (timerSectionRow) {
        if (isRightLayout && teamBRedCount > 0 && scoreboardStyle.showRedCardIndicators) {
          const redCardWidth = (teamBRedCount >= 5 ? 28 : 16) + 8;
          timerSectionRow.style.marginLeft = `${redCardWidth}px`; 
        } else { timerSectionRow.style.marginLeft = '0'; }
      }
    }
    if (gameReportContainer) { gameReportContainer.style.backgroundColor = backgroundColorWithOpacity; gameReportContainer.style.color = scoreboardStyle.secondary; gameReportContainer.style.transform = `translateX(-50%) scale(${scaleValue})`; }
    
    if (playersListContainerA) {
        playersListContainerA.style.backgroundColor = backgroundColorWithOpacity;
        playersListContainerA.style.color = scoreboardStyle.secondary;
        playersListContainerA.style.transform = `translateY(-50%) scale(${scaleValue})`;
    }
    if (playersListContainerB) {
        playersListContainerB.style.backgroundColor = backgroundColorWithOpacity;
        playersListContainerB.style.color = scoreboardStyle.secondary;
        playersListContainerB.style.transform = `translateY(-50%) scale(${scaleValue})`;
    }

  } else {
    if (scoreboardContainer) { scoreboardContainer.style.transform = 'scale(1)'; }
    if (playersListContainerA) { playersListContainerA.style.transform = 'translateY(-50%) scale(1)'; }
    if (playersListContainerB) { playersListContainerB.style.transform = 'translateY(-50%) scale(1)'; }
  }
  
  if (scoreboardContainer) { scoreboardContainer.style.display = (isScoreboardVisible || isMatchInfoVisible) ? 'flex' : 'none'; }
  const contentWrapper = document.getElementById('scoreboard-content-wrapper');
  if (contentWrapper) { contentWrapper.style.display = isScoreboardVisible ? 'flex' : 'none'; }
  if (matchInfoRow) { matchInfoRow.style.display = isMatchInfoVisible ? 'flex' : 'none'; }
  if (gameReportContainer) { gameReportContainer.style.display = isGameReportVisible ? 'flex' : 'none'; }
  
  if (playersListContainerA) playersListContainerA.style.display = isPlayersListVisibleA ? 'flex' : 'none';
  if (playersListContainerB) playersListContainerB.style.display = isPlayersListVisibleB ? 'flex' : 'none';
}

document.addEventListener('DOMContentLoaded', async () => {
  await initStateManager();
  
  // --- Initialize Shortcuts: FALSE = No Notifications ---
  await initGlobalShortcuts(false);
  
  subscribe(updateUI);
  updateUI();
});