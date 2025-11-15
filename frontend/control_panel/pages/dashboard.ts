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
  type PlayerConfig,
} from '../stateManager';
import { showNotification } from '../notification';

// Utility function to format time
function formatTime(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60);
  const sec = (totalSeconds % 60).toString().padStart(2, '0');
  
  const min = (totalMinutes < 100) 
    ? totalMinutes.toString().padStart(2, '0') 
    : totalMinutes.toString();
    
  return `${min}:${sec}`;
}

// --- Updated Function to Render Player Grid ---
function renderPlayerGrid(players: PlayerConfig[]): string {
  if (!players || players.length === 0) {
    return '<p style="font-size: 13px; opacity: 0.7;">No players on roster.</p>';
  }
  
  // Sort players: On Field first, then by number
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.onField && !b.onField) return -1;
    if (!a.onField && b.onField) return 1;
    return a.number - b.number;
  });

  return sortedPlayers.map(player => {
    let btnClass = '';
    
    // --- Updated Color Logic ---
    if (player.redCards.length > 0) {
      btnClass = 'btn-red'; // Red card overrides all
    } else if (player.onField) {
      btnClass = ''; // Active (default accent)
    } else {
      btnClass = 'btn-secondary'; // Inactive
    }
    
    return `
      <button 
        class="player-btn ${btnClass}" 
        title="${player.name}" 
        data-number="${player.number}"
      >
        ${player.number}
      </button>
    `;
  }).join('');
}


export function render(container: HTMLElement) {
  const { config, timer, extraTime } = getState();

  // --- Render HTML ---
  container.innerHTML = `
    <div class="controller-grid" id="dashboard-controller-grid">
      <div class="card team-control"> 
        <div class="team-header">
          <div class="color-swatch-container">
            <span class="color-swatch" id="team-a-swatch-primary"></span>
            <span class="color-swatch" id="team-a-swatch-secondary"></span>
          </div>
          <h4 id="team-a-header">Team A (TMA)</h4>
        </div>
        
        <div class="card-content">
          <div class="score-side">
            <div class="team-score" id="team-a-score">0</div>
            <div class="score-control-row">
              <button id="team-a-dec" class="btn-secondary score-btn">-</button>
              <button id="team-a-inc" class="score-btn">+</button>
            </div>
          </div>
          <div class="player-side">
            <div class="player-grid-container" id="player-grid-container-a">
              <div class="player-grid" id="player-grid-a" data-team="teamA">
                </div>
            </div>
            <div class="player-info-display" id="team-a-info-display">&nbsp;</div>
          </div>
        </div>
      </div>
      
      <div class="card team-control">
        <div class="team-header">
          <div class="color-swatch-container">
            <span class="color-swatch" id="team-b-swatch-primary"></span>
            <span class="color-swatch" id="team-b-swatch-secondary"></span>
          </div>
          <h4 id="team-b-header">Team B (TMB)</h4>
        </div>
        
        <div class="card-content">
          <div class="score-side">
            <div class="team-score" id="team-b-score">0</div>
            <div class="score-control-row">
              <button id="team-b-dec" class="btn-secondary score-btn">-</button>
              <button id="team-b-inc" class="score-btn">+</button>
            </div>
          </div>
          <div class="player-side">
            <div class="player-grid-container" id="player-grid-container-b">
              <div class="player-grid" id="player-grid-b" data-team="teamB">
                </div>
            </div>
            <div class="player-info-display" id="team-b-info-display">&nbsp;</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="timer-grid">
      <div class="card timer-control">
        <h4>Timer</h4>
        <div class="timer-display" id="timer-display">${formatTime(
          timer.seconds,
        )}</div>
        
        <div class="btn-group">
          <button id="start-stop-toggle" class="btn-green" style="flex-grow: 1;">Start</button>
          
          <button id="reset-timer" class="btn-secondary">Reset</button>
          <button id="show-set-time" class="btn-secondary">Set</button>
        </div>

        <div id="set-time-popup" style="display: none;">
          <div style="display: flex; gap: 8px; align-items: center;">
              <div class="form-group" style="flex-grow: 1; margin-bottom: 0;">
                  <label for="timer-min">Minutes (0-999)</label>
                  <input type="number" id="timer-min" min="0" max="999" value="0">
              </div>
              <div class="form-group" style="flex-grow: 1; margin-bottom: 0;">
                  <label for="timer-sec">Seconds (0-59)</label>
                  <input type="number" id="timer-sec" min="0" max="59" value="0">
              </div>
          </div>
          <div class="btn-group" style="margin-top: 10px;">
              <button id="save-set-time" style="flex-grow: 1;">Save</button>
              <button id="cancel-set-time" class="btn-secondary" style="flex-grow: 1;">Cancel</button>
          </div>
        </div>
      </div>
      
      <div class="card timer-control">
        <h4>Additional Time</h4>
        <div class="form-group" style="padding: 10px 0;">
          <label for="extra-time-input" style="font-weight: 500;">Minutes</label>
          <div class="inline-form-group" style="margin-top: 4px; justify-content: center;">
            <input type="number" id="extra-time-input" min="0" max="99" value="${extraTime.minutes}" style="width: 100px; text-align: center; margin: 0 auto;">
            <button id="extra-time-action-btn" class="btn-secondary" style="min-width: 110px;">
              ${extraTime.isVisible ? 'Showing' : 'Set and Show'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // --- Get Element References ---
  const teamAScoreEl = container.querySelector('#team-a-score') as HTMLElement;
  const teamBScoreEl = container.querySelector('#team-b-score') as HTMLElement;
  const timerDisplayEl = container.querySelector(
    '#timer-display',
  ) as HTMLElement;
  const setTimePopup = container.querySelector(
    '#set-time-popup',
  ) as HTMLDivElement;
  const timerMinInput = container.querySelector(
    '#timer-min',
  ) as HTMLInputElement;
  const timerSecInput = container.querySelector(
    '#timer-sec',
  ) as HTMLInputElement;

  // Toggle button ref
  const startStopToggle = container.querySelector(
    '#start-stop-toggle',
  ) as HTMLButtonElement;

  // Swatch refs
  const teamASwatchP = container.querySelector('#team-a-swatch-primary') as HTMLSpanElement;
  const teamASwatchS = container.querySelector('#team-a-swatch-secondary') as HTMLSpanElement;
  const teamBSwatchP = container.querySelector('#team-b-swatch-primary') as HTMLSpanElement;
  const teamBSwatchS = container.querySelector('#team-b-swatch-secondary') as HTMLSpanElement;

  // Extra Time Refs
  const extraTimeInput = container.querySelector(
    '#extra-time-input',
  ) as HTMLInputElement;
  const extraTimeActionBtn = container.querySelector(
    '#extra-time-action-btn',
  ) as HTMLButtonElement;
    
  // Grid Refs
  const controllerGrid = container.querySelector('#dashboard-controller-grid') as HTMLDivElement;
  const teamAHeader = container.querySelector('#team-a-header') as HTMLHeadingElement;
  const teamBHeader = container.querySelector('#team-b-header') as HTMLHeadingElement;
  const playerGridA = container.querySelector('#player-grid-a') as HTMLDivElement;
  const playerGridB = container.querySelector('#player-grid-b') as HTMLDivElement;
  
  // --- New Info Display Refs ---
  const teamAInfoDisplay = container.querySelector('#team-a-info-display') as HTMLDivElement;
  const teamBInfoDisplay = container.querySelector('#team-b-info-display') as HTMLDivElement;


  // --- Update UI Function ---
  const updateUI = () => {
    const { config, timer, extraTime } = getState();

    // Update scores and team names
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
    }

    // Update timer display
    if (timerDisplayEl) {
      timerDisplayEl.textContent = formatTime(timer.seconds);
    }

    // Update Toggle Button
    if (startStopToggle) {
      if (timer.isRunning) {
        startStopToggle.textContent = 'Stop';
        startStopToggle.classList.remove('btn-green');
        startStopToggle.classList.add('btn-red');
      } else {
        startStopToggle.textContent = 'Start';
        startStopToggle.classList.remove('btn-red');
        startStopToggle.classList.add('btn-green');
      }
    }
    
    // Update Extra Time UI
    if (extraTimeActionBtn) {
      if (document.activeElement !== extraTimeInput) {
        extraTimeInput.value = extraTime.minutes.toString();
      }
      
      if (extraTime.isVisible) {
        extraTimeActionBtn.textContent = 'Showing';
        extraTimeActionBtn.classList.remove('btn-secondary');
        extraTimeActionBtn.classList.add('btn-green');
      } else {
        extraTimeActionBtn.textContent = 'Set and Show';
        extraTimeActionBtn.classList.remove('btn-green');
        extraTimeActionBtn.classList.add('btn-secondary');
      }
    }
  };

  // --- Delegated Click Listener ---
  const handleGridClick = async (e: Event) => {
    const target = e.target as HTMLElement;
    
    // Handle score buttons
    const scoreBtnId = target.id;
    if (scoreBtnId === 'team-a-inc') {
      setScore('teamA', (getState().config?.teamA.score ?? 0) + 1);
      return;
    }
    if (scoreBtnId === 'team-a-dec') {
      setScore('teamA', (getState().config?.teamA.score ?? 0) - 1);
      return;
    }
    if (scoreBtnId === 'team-b-inc') {
      setScore('teamB', (getState().config?.teamB.score ?? 0) + 1);
      return;
    }
    if (scoreBtnId === 'team-b-dec') {
      setScore('teamB', (getState().config?.teamB.score ?? 0) - 1);
      return;
    }

    // Handle player grid buttons
    if (target.classList.contains('player-btn')) {
      const grid = target.closest('.player-grid') as HTMLDivElement;
      const team = grid?.dataset.team as 'teamA' | 'teamB';
      const number = parseInt(target.dataset.number || '', 10);
      
      if (!team || isNaN(number)) return;

      const { config, timer } = getState();
      if (!config) return;

      const player = (team === 'teamA' ? config.teamA.players : config.teamB.players).find(p => p.number === number);
      if (!player) return;

      const minute = Math.floor(timer.seconds / 60) + 1;
      
      // 1. Add goal to player
      await addGoal(team, number, minute);
      
      // 2. Add goal to scorekeeper (bypassing setting)
      const currentScore = (team === 'teamA') ? config.teamA.score : config.teamB.score;
      await setScore(team, currentScore + 1);
      
      showNotification(`Goal given to #${player.number} ${player.name} at ${minute}'`);
    }
  };

  // --- Delegated Mouseover Listener ---
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

      const goalText = player.goals.length === 1 ? '1 goal' : `${player.goals.length} goals`;
      const displayText = `#${player.number} ${player.name} (${goalText})`;
      
      if (team === 'teamA') {
        teamAInfoDisplay.textContent = displayText;
      } else {
        teamBInfoDisplay.textContent = displayText;
      }
    }
  };
  
  // --- Delegated Mouseout Listener ---
  const handleGridMouseOut = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('player-btn')) {
      const grid = target.closest('.player-grid') as HTMLDivElement;
      const team = grid?.dataset.team as 'teamA' | 'teamB';
      
      if (team === 'teamA') {
        teamAInfoDisplay.innerHTML = '&nbsp;'; // Use &nbsp; to maintain height
      } else {
        teamBInfoDisplay.innerHTML = '&nbsp;';
      }
    }
  };


  // --- Add Event Listeners ---
  
  controllerGrid.addEventListener('click', handleGridClick);
  controllerGrid.addEventListener('mouseover', handleGridMouseOver);
  controllerGrid.addEventListener('mouseout', handleGridMouseOut);

  startStopToggle.addEventListener('click', () => {
    if (getState().timer.isRunning) {
      timerControls.stop();
    } else {
      timerControls.start();
    }
  });

  container.querySelector('#reset-timer')?.addEventListener('click', () => {
    timerControls.stop();
    timerControls.reset();
  });
  
  container.querySelector('#show-set-time')?.addEventListener('click', () => {
    if (setTimePopup) {
      const { seconds } = getState().timer;
      timerMinInput.value = Math.floor(seconds / 60).toString();
      timerSecInput.value = (seconds % 60).toString();
      setTimePopup.style.display = 'block';
    }
  });

  container.querySelector('#cancel-set-time')?.addEventListener('click', () => {
    if (setTimePopup) {
      setTimePopup.style.display = 'none';
    }
  });

  container.querySelector('#save-set-time')?.addEventListener('click', () => {
    let minutes = parseInt(timerMinInput.value, 10) || 0;
    let seconds = parseInt(timerSecInput.value, 10) || 0;
    if (minutes > 999) minutes = 999;
    if (minutes < 0) minutes = 0;
    if (seconds > 59) seconds = 59;
    if (seconds < 0) seconds = 0;
    timerControls.set(minutes * 60 + seconds);
    if (setTimePopup) {
      setTimePopup.style.display = 'none';
    }
  });
  
  extraTimeActionBtn.addEventListener('click', () => {
    const { extraTime } = getState();
    
    if (extraTime.isVisible) {
      toggleExtraTimeVisibility();
    } else {
      let minutes = parseInt(extraTimeInput.value, 10) || 0;
      if (minutes < 0) minutes = 0;
      if (minutes > 99) minutes = 99;
      extraTimeInput.value = minutes.toString();
      
      setExtraTime(minutes);
      toggleExtraTimeVisibility();
    }
  });


  // --- Subscribe to State ---
  subscribe(updateUI);
  updateUI(); // Initial sync

  // Return a cleanup function
  return () => {
    unsubscribe(updateUI);
    controllerGrid.removeEventListener('click', handleGridClick);
    controllerGrid.removeEventListener('mouseover', handleGridMouseOver);
    controllerGrid.removeEventListener('mouseout', handleGridMouseOut);
  };
}