// frontend/control_panel/pages/dashboard.ts
import {
  getState,
  subscribe,
  unsubscribe,
  timerControls,
  setScore,
  setExtraTime,
  toggleExtraTimeVisibility,
  addGoal,
  getPeriods, 
  setPeriod, 
  type PlayerConfig,
  type PeriodSetting 
} from '../stateManager';
import { showNotification } from '../notification';

function formatTime(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60);
  const sec = (totalSeconds % 60).toString().padStart(2, '0');
  const min = (totalMinutes < 100) ? totalMinutes.toString().padStart(2, '0') : totalMinutes.toString();
  return `${min}:${sec}`;
}

function renderPlayerGrid(players: PlayerConfig[]): string {
  if (!players || players.length === 0) { return '<p style="font-size: 13px; opacity: 0.7;">No players on roster.</p>'; }
  const sortedPlayers = [...players].sort((a, b) => { if (a.onField && !b.onField) return -1; if (!a.onField && b.onField) return 1; return a.number - b.number; });
  return sortedPlayers.map(player => {
    let btnClass = ''; if (player.redCards.length > 0) { btnClass = 'btn-red'; } else if (player.onField) { btnClass = ''; } else { btnClass = 'btn-secondary'; }
    return `<button class="player-btn ${btnClass}" title="${player.name}" data-number="${player.number}">${player.number}</button>`;
  }).join('');
}

export function render(container: HTMLElement) {
  const { config, timer, extraTime } = getState();
  let allPeriods: PeriodSetting[] = [];
  let currentPeriodLimit = 45;

  container.innerHTML = `
    <div class="modal-overlay" id="set-time-modal" style="display: none;">
      <div class="modal-content" style="max-width: 320px;">
        <h4>Set Game Timer</h4>
        <div style="display: flex; flex-direction: column; gap: 16px; margin: 20px 0;">
            <div style="display: flex; gap: 10px; justify-content: center; align-items: center;">
                <div class="form-group" style="text-align: center; margin-bottom: 0;">
                    <label for="timer-min" style="margin-bottom: 4px; font-size: 12px;">Main Mins</label>
                    <input type="number" id="timer-min" min="0" max="999" value="0" style="width: 70px; text-align: center; font-size: 18px; padding: 8px;">
                </div>
                <div style="font-size: 24px; font-weight: bold; margin-top: 18px;">:</div>
                <div class="form-group" style="text-align: center; margin-bottom: 0;">
                    <label for="timer-sec" style="margin-bottom: 4px; font-size: 12px;">Main Secs</label>
                    <input type="number" id="timer-sec" min="0" max="59" value="0" style="width: 70px; text-align: center; font-size: 18px; padding: 8px;">
                </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center; align-items: center; border-top: 1px solid var(--border-color); padding-top: 12px;">
                <div style="font-size: 24px; font-weight: bold; margin-top: 18px; color: var(--accent-color);">+</div>
                <div class="form-group" style="text-align: center; margin-bottom: 0;">
                    <label for="add-timer-min" style="margin-bottom: 4px; font-size: 12px;">Add. Mins</label>
                    <input type="number" id="add-timer-min" min="0" max="99" value="0" style="width: 70px; text-align: center; font-size: 18px; padding: 8px; border-color: var(--accent-color);">
                </div>
                <div style="font-size: 24px; font-weight: bold; margin-top: 18px; color: var(--accent-color);">:</div>
                <div class="form-group" style="text-align: center; margin-bottom: 0;">
                    <label for="add-timer-sec" style="margin-bottom: 4px; font-size: 12px;">Add. Secs</label>
                    <input type="number" id="add-timer-sec" min="0" max="59" value="0" style="width: 70px; text-align: center; font-size: 18px; padding: 8px; border-color: var(--accent-color);">
                </div>
            </div>
            <p style="font-size: 11px; text-align: center; margin: 0; opacity: 0.7;">Sets the total time. If Main exceeds the period limit, the excess flows into Additional.</p>
        </div>
        <div class="modal-buttons" style="justify-content: center;">
            <button id="cancel-set-time" class="btn-secondary" style="flex: 1;">Cancel</button>
            <button id="save-set-time" class="btn-green" style="flex: 1;">Set Time</button>
        </div>
      </div>
    </div>

    <div class="controller-grid" id="dashboard-controller-grid">
      <div class="card team-control"> 
        <div class="team-header">
          <div class="color-swatch-container"><span class="color-swatch" id="team-a-swatch-primary"></span><span class="color-swatch" id="team-a-swatch-secondary"></span></div>
          <h4 id="team-a-header">Team A (TMA)</h4>
        </div>
        <div class="card-content">
          <div class="score-side"><div class="team-score" id="team-a-score">0</div><div class="score-control-row"><button id="team-a-dec" class="btn-secondary score-btn">-</button><button id="team-a-inc" class="score-btn">+</button></div></div>
          <div class="player-side"><div class="player-grid-container" id="player-grid-container-a"><div class="player-grid" id="player-grid-a" data-team="teamA"></div></div><div class="player-info-display" id="team-a-info-display">&nbsp;</div></div>
        </div>
      </div>
      <div class="card team-control">
        <div class="team-header">
          <div class="color-swatch-container"><span class="color-swatch" id="team-b-swatch-primary"></span><span class="color-swatch" id="team-b-swatch-secondary"></span></div>
          <h4 id="team-b-header">Team B (TMB)</h4>
        </div>
        <div class="card-content">
          <div class="score-side"><div class="team-score" id="team-b-score">0</div><div class="score-control-row"><button id="team-b-dec" class="btn-secondary score-btn">-</button><button id="team-b-inc" class="score-btn">+</button></div></div>
          <div class="player-side"><div class="player-grid-container" id="player-grid-container-b"><div class="player-grid" id="player-grid-b" data-team="teamB"></div></div><div class="player-info-display" id="team-b-info-display">&nbsp;</div></div>
        </div>
      </div>
    </div>
    
    <div class="timer-grid">
      <div class="card timer-control">
        <h4>Timer</h4>
        <div class="timer-display-wrapper">
            <div class="timer-display-main" id="timer-display-main">00:00</div>
            <div class="timer-display-additional" id="timer-display-additional">+ 00:00</div>
        </div>
        <div class="btn-group" style="margin-bottom: 16px;">
          <button id="start-stop-toggle" class="btn-green" style="flex-grow: 1;">Start</button>
          <button id="show-set-time" class="btn-secondary">Set Time</button>
        </div>
        <div class="form-group inline-form-group" style="border-top: 1px solid var(--border-color); padding-top: 12px; justify-content: space-between; align-items: center;">
             <div class="form-group" style="margin-bottom: 0; flex-grow: 1;">
                <label for="period-select" style="font-size: 12px;">Match Period</label>
                <select id="period-select" style="width: 100%;">
                   <option value="" disabled selected>Loading...</option>
                </select>
             </div>
             <div style="text-align: right;">
                <label style="font-size: 12px; margin-bottom: 4px; display: block;">Target</label>
                <button id="set-to-period-end-btn" class="btn-secondary" style="white-space: nowrap; height: 35px; font-size: 13px;">
                   Set to <span id="period-end-time-btn" style="font-weight: bold;">--'</span>
                </button>
             </div>
        </div>
      </div>
      <div class="card timer-control">
        <h4>Additional Time</h4>
        <div class="form-group" style="padding: 10px 0;">
          <label for="extra-time-input" style="font-weight: 500;">Minutes</label>
          <div class="inline-form-group" style="margin-top: 4px; justify-content: center;">
            <input type="number" id="extra-time-input" min="0" max="99" value="${extraTime.minutes}" style="width: 100px; text-align: center; margin: 0 auto;">
            <button id="extra-time-action-btn" class="btn-secondary" style="min-width: 110px;">${extraTime.isVisible ? 'Showing' : 'Set and Show'}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // --- Refs ---
  const teamAScoreEl = container.querySelector('#team-a-score') as HTMLElement;
  const teamBScoreEl = container.querySelector('#team-b-score') as HTMLElement;
  const timerMainEl = container.querySelector('#timer-display-main') as HTMLElement;
  const timerAddEl = container.querySelector('#timer-display-additional') as HTMLElement;
  const setTimeModal = container.querySelector('#set-time-modal') as HTMLDivElement;
  const timerMinInput = container.querySelector('#timer-min') as HTMLInputElement;
  const timerSecInput = container.querySelector('#timer-sec') as HTMLInputElement;
  const addTimerMinInput = container.querySelector('#add-timer-min') as HTMLInputElement;
  const addTimerSecInput = container.querySelector('#add-timer-sec') as HTMLInputElement;
  const saveSetTimeBtn = container.querySelector('#save-set-time') as HTMLButtonElement;
  const cancelSetTimeBtn = container.querySelector('#cancel-set-time') as HTMLButtonElement;
  const showSetTimeBtn = container.querySelector('#show-set-time') as HTMLButtonElement;
  const startStopToggle = container.querySelector('#start-stop-toggle') as HTMLButtonElement;
  const teamASwatchP = container.querySelector('#team-a-swatch-primary') as HTMLSpanElement;
  const teamASwatchS = container.querySelector('#team-a-swatch-secondary') as HTMLSpanElement;
  const teamBSwatchP = container.querySelector('#team-b-swatch-primary') as HTMLSpanElement;
  const teamBSwatchS = container.querySelector('#team-b-swatch-secondary') as HTMLSpanElement;
  const extraTimeInput = container.querySelector('#extra-time-input') as HTMLInputElement;
  const extraTimeActionBtn = container.querySelector('#extra-time-action-btn') as HTMLButtonElement;
  const controllerGrid = container.querySelector('#dashboard-controller-grid') as HTMLDivElement;
  const teamAHeader = container.querySelector('#team-a-header') as HTMLHeadingElement;
  const teamBHeader = container.querySelector('#team-b-header') as HTMLHeadingElement;
  const playerGridA = container.querySelector('#player-grid-a') as HTMLDivElement;
  const playerGridB = container.querySelector('#player-grid-b') as HTMLDivElement;
  const teamAInfoDisplay = container.querySelector('#team-a-info-display') as HTMLDivElement;
  const teamBInfoDisplay = container.querySelector('#team-b-info-display') as HTMLDivElement;
  const periodSelect = container.querySelector('#period-select') as HTMLSelectElement;
  const periodEndTimeBtnSpan = container.querySelector('#period-end-time-btn') as HTMLSpanElement;
  const setToPeriodEndBtn = container.querySelector('#set-to-period-end-btn') as HTMLButtonElement;


  const initPeriods = async () => {
    try {
        allPeriods = await getPeriods();
        periodSelect.innerHTML = allPeriods.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
        const { config } = getState();
        if (config && config.currentPeriod) { periodSelect.value = config.currentPeriod; } else if (allPeriods.length > 0) { periodSelect.value = allPeriods[0].name; }
        updateEndTimeLabel();
    } catch (e) { console.error("Failed to load periods", e); periodSelect.innerHTML = '<option>Error loading</option>'; }
  };
  
  const updateEndTimeLabel = () => {
      const selectedName = periodSelect.value;
      const period = allPeriods.find(p => p.name === selectedName);
      if (period) {
          currentPeriodLimit = period.endTime;
          periodEndTimeBtnSpan.textContent = `${period.endTime}:00`;
          setToPeriodEndBtn.disabled = false;
      } else {
          periodEndTimeBtnSpan.textContent = "--";
          setToPeriodEndBtn.disabled = true;
      }
  };

  const updateUI = () => {
    const { config, timer, extraTime } = getState();
    if (config) {
      teamAScoreEl.textContent = config.teamA.score.toString();
      teamBScoreEl.textContent = config.teamB.score.toString();
      teamAHeader.textContent = `${config.teamA.name} (${config.teamA.abbreviation})`;
      teamBHeader.textContent = `${config.teamB.name} (${config.teamB.abbreviation})`;
      if (teamASwatchP) teamASwatchP.style.backgroundColor = config.teamA.colors.primary;
      if (teamASwatchS) teamASwatchS.style.backgroundColor = config.teamA.colors.secondary;
      if (teamBSwatchP) teamBSwatchP.style.backgroundColor = config.teamB.colors.primary;
      if (teamBSwatchS) teamBSwatchS.style.backgroundColor = config.teamB.colors.secondary;
      playerGridA.innerHTML = renderPlayerGrid(config.teamA.players);
      playerGridB.innerHTML = renderPlayerGrid(config.teamB.players);
      if (allPeriods.length > 0 && periodSelect.value !== config.currentPeriod) { periodSelect.value = config.currentPeriod; updateEndTimeLabel(); }
    }
    
    // --- Calculate Reg/Add Time for UI ---
    const totalSeconds = timer.seconds;
    const limitSeconds = currentPeriodLimit * 60;
    if (totalSeconds <= limitSeconds) {
        timerMainEl.textContent = formatTime(totalSeconds);
        timerAddEl.textContent = "+ 00:00";
    } else {
        timerMainEl.textContent = formatTime(limitSeconds);
        timerAddEl.textContent = `+ ${formatTime(totalSeconds - limitSeconds)}`;
    }

    if (startStopToggle) { if (timer.isRunning) { startStopToggle.textContent = 'Stop'; startStopToggle.classList.remove('btn-green'); startStopToggle.classList.add('btn-red'); } else { startStopToggle.textContent = 'Start'; startStopToggle.classList.remove('btn-red'); startStopToggle.classList.add('btn-green'); } }
    if (extraTimeActionBtn) { if (document.activeElement !== extraTimeInput) { extraTimeInput.value = extraTime.minutes.toString(); } if (extraTime.isVisible) { extraTimeActionBtn.textContent = 'Showing'; extraTimeActionBtn.classList.remove('btn-secondary'); extraTimeActionBtn.classList.add('btn-green'); } else { extraTimeActionBtn.textContent = 'Set and Show'; extraTimeActionBtn.classList.remove('btn-green'); extraTimeActionBtn.classList.add('btn-secondary'); } }
  };

  // --- Updated Grid Click ---
  const handleGridClick = async (e: Event) => {
    const target = e.target as HTMLElement;
    const scoreBtnId = target.id;
    if (scoreBtnId === 'team-a-inc') { setScore('teamA', (getState().config?.teamA.score ?? 0) + 1); return; }
    if (scoreBtnId === 'team-a-dec') { setScore('teamA', (getState().config?.teamA.score ?? 0) - 1); return; }
    if (scoreBtnId === 'team-b-inc') { setScore('teamB', (getState().config?.teamB.score ?? 0) + 1); return; }
    if (scoreBtnId === 'team-b-dec') { setScore('teamB', (getState().config?.teamB.score ?? 0) - 1); return; }

    if (target.classList.contains('player-btn')) {
      const grid = target.closest('.player-grid') as HTMLDivElement;
      const team = grid?.dataset.team as 'teamA' | 'teamB';
      const number = parseInt(target.dataset.number || '', 10);
      if (!team || isNaN(number)) return;
      const { config, timer } = getState();
      if (!config) return;
      const player = (team === 'teamA' ? config.teamA.players : config.teamB.players).find(p => p.number === number);
      if (!player) return;
      
      // --- Calculate Times ---
      const totalSeconds = timer.seconds;
      const limitSeconds = currentPeriodLimit * 60;
      let regMinute, addMinute;
      
      if (totalSeconds <= limitSeconds) {
          regMinute = Math.floor(totalSeconds / 60) + 1;
          addMinute = 0;
      } else {
          regMinute = currentPeriodLimit; // Cap at 45 or 90
          addMinute = Math.ceil((totalSeconds - limitSeconds) / 60);
      }

      // Calls backend with new params
      await addGoal(team, number, regMinute, addMinute, false); 
      
      // Manual score update if needed (handled by backend auto-add usually, but here we mimic)
      // Note: `addGoal` function in stateManager already handles the auto-score logic locally via state check
      
      showNotification(`Goal given to #${player.number} ${player.name}`);
    }
  };

  const handleGridMouseOver = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('player-btn')) {
      const grid = target.closest('.player-grid') as HTMLDivElement;
      const team = grid?.dataset.team as 'teamA' | 'teamB';
      const number = parseInt(target.dataset.number || '', 10);
      if (!team || isNaN(number)) return;
      const { config } = getState();
      if (!config) return;
      const player = (team === 'teamA' ? config.teamA.players : config.teamB.players).find(p => p.number === number);
      if (!player) return;
      // Count only regular goals
      const goalCount = player.goals.filter(g => !g.isOwnGoal).length;
      const goalText = goalCount === 1 ? '1 goal' : `${goalCount} goals`;
      const displayText = `#${player.number} ${player.name} (${goalText})`;
      if (team === 'teamA') { teamAInfoDisplay.textContent = displayText; } else { teamBInfoDisplay.textContent = displayText; }
    }
  };
  
  const handleGridMouseOut = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('player-btn')) {
      const grid = target.closest('.player-grid') as HTMLDivElement;
      const team = grid?.dataset.team as 'teamA' | 'teamB';
      if (team === 'teamA') { teamAInfoDisplay.innerHTML = '&nbsp;'; } else { teamBInfoDisplay.innerHTML = '&nbsp;'; }
    }
  };

  controllerGrid.addEventListener('click', handleGridClick);
  controllerGrid.addEventListener('mouseover', handleGridMouseOver);
  controllerGrid.addEventListener('mouseout', handleGridMouseOut);

  startStopToggle.addEventListener('click', () => { if (getState().timer.isRunning) { timerControls.stop(); } else { timerControls.start(); } });
  
  showSetTimeBtn.addEventListener('click', () => { 
    if (setTimeModal) { 
        const { seconds } = getState().timer; 
        const limitSeconds = currentPeriodLimit * 60;
        
        if (seconds <= limitSeconds) {
            timerMinInput.value = Math.floor(seconds / 60).toString();
            timerSecInput.value = (seconds % 60).toString();
            addTimerMinInput.value = "0";
            addTimerSecInput.value = "0";
        } else {
            timerMinInput.value = currentPeriodLimit.toString();
            timerSecInput.value = "0";
            const excess = seconds - limitSeconds;
            addTimerMinInput.value = Math.floor(excess / 60).toString();
            addTimerSecInput.value = (excess % 60).toString();
        }
        setTimeModal.style.display = 'flex'; 
    } 
  });
  cancelSetTimeBtn.addEventListener('click', () => { if (setTimeModal) setTimeModal.style.display = 'none'; });
  setTimeModal.addEventListener('click', (e) => { if (e.target === setTimeModal) setTimeModal.style.display = 'none'; });
  
  // --- Updated Save Logic ---
  saveSetTimeBtn.addEventListener('click', () => { 
      const mainMins = parseInt(timerMinInput.value, 10) || 0; 
      const mainSecs = parseInt(timerSecInput.value, 10) || 0; 
      const addMins = parseInt(addTimerMinInput.value, 10) || 0;
      const addSecs = parseInt(addTimerSecInput.value, 10) || 0;
      
      const total = (mainMins * 60) + mainSecs + (addMins * 60) + addSecs;
      
      timerControls.set(total); 
      if (setTimeModal) setTimeModal.style.display = 'none'; 
  });
  
  extraTimeActionBtn.addEventListener('click', () => { const { extraTime } = getState(); if (extraTime.isVisible) { toggleExtraTimeVisibility(); } else { let minutes = parseInt(extraTimeInput.value, 10) || 0; if (minutes < 0) minutes = 0; if (minutes > 99) minutes = 99; extraTimeInput.value = minutes.toString(); setExtraTime(minutes); toggleExtraTimeVisibility(); } });
  periodSelect.addEventListener('change', async () => { updateEndTimeLabel(); await setPeriod(periodSelect.value); showNotification(`Period set to ${periodSelect.value}`); });
  setToPeriodEndBtn.addEventListener('click', async () => { const selectedName = periodSelect.value; const periodIndex = allPeriods.findIndex(p => p.name === selectedName); const period = allPeriods[periodIndex]; if (period) { const seconds = period.endTime * 60; timerControls.set(seconds); showNotification(`Timer set to ${period.endTime}:00`); const { isAutoAdvancePeriodOn } = getState(); if (isAutoAdvancePeriodOn) { const nextPeriod = allPeriods[periodIndex + 1]; if (nextPeriod) { await setPeriod(nextPeriod.name); showNotification(`Auto-advanced to ${nextPeriod.name}`); } } } });

  initPeriods();
  subscribe(updateUI);
  updateUI(); 

  return () => {
    unsubscribe(updateUI);
    controllerGrid.removeEventListener('click', handleGridClick);
    controllerGrid.removeEventListener('mouseover', handleGridMouseOver);
    controllerGrid.removeEventListener('mouseout', handleGridMouseOut);
  };
}