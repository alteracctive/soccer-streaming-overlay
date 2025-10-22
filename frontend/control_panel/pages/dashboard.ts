import {
  getState,
  subscribe,
  unsubscribe,
  STATE_UPDATE_EVENT,
  timerControls,
  setScore,
} from '../stateManager';
import { showNotification } from '../notification';

// Utility function to format time
function formatTime(totalSeconds: number): string {
  const min = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const sec = (totalSeconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

export function render(container: HTMLElement) {
  const { config, timer } = getState();

  // --- Render HTML ---
  container.innerHTML = `
    <div class="controller-grid">
      <div class="card team-control"> 
        <div class="team-header">
          <h4>${config?.teamA.name || 'Team A'} (${
    config?.teamA.abbreviation || 'TMA'
  })</h4>
          <div class="color-swatch-container">
            <span class="color-swatch" id="team-a-swatch-secondary"></span>
            <span class="color-swatch" id="team-a-swatch-primary"></span>
          </div>
        </div>
        <div class="team-score" id="team-a-score">${
          config?.teamA.score ?? 0
        }</div>
        <div class="btn-group">
          <button id="team-a-inc" style="flex-grow: 1;">+1</button>
          <button id="team-a-dec" class="btn-secondary" style="flex-grow: 1;">-1</button>
        </div>
      </div>
      <div class="card team-control">
        <div class="team-header">
          <h4>${config?.teamB.name || 'Team B'} (${
    config?.teamB.abbreviation || 'TMB'
  })</h4>
          <div class="color-swatch-container">
            <span class="color-swatch" id="team-b-swatch-secondary"></span>
            <span class="color-swatch" id="team-b-swatch-primary"></span>
          </div>
        </div>
        <div class="team-score" id="team-b-score">${
          config?.teamB.score ?? 0
        }</div>
        <div class="btn-group">
          <button id="team-b-inc" style="flex-grow: 1;">+1</button>
          <button id="team-b-dec" class="btn-secondary" style="flex-grow: 1;">-1</button>
        </div>
      </div>
    </div>
    
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

  // *** 4. GET SWATCH REFS ***
  const teamASwatchP = container.querySelector('#team-a-swatch-primary') as HTMLSpanElement;
  const teamASwatchS = container.querySelector('#team-a-swatch-secondary') as HTMLSpanElement;
  const teamBSwatchP = container.querySelector('#team-b-swatch-primary') as HTMLSpanElement;
  const teamBSwatchS = container.querySelector('#team-b-swatch-secondary') as HTMLSpanElement;


  // --- Update UI Function ---
  const updateUI = () => {
    const { config, timer } = getState();

    // Update scores and team names
    if (config) {
      teamAScoreEl.textContent = config.teamA.score.toString();
      teamBScoreEl.textContent = config.teamB.score.toString();
      
      // Update headers
      const headers = container.querySelectorAll('.team-header h4');
      if (headers[0]) (headers[0] as HTMLElement).textContent = `${config.teamA.name} (${config.teamA.abbreviation})`;
      if (headers[1]) (headers[1] as HTMLElement).textContent = `${config.teamB.name} (${config.teamB.abbreviation})`;
      
      // *** 5. UPDATE SWATCH COLORS ***
      if (teamASwatchP) teamASwatchP.style.backgroundColor = config.teamA.colors.primary;
      if (teamASwatchS) teamASwatchS.style.backgroundColor = config.teamA.colors.secondary;
      if (teamBSwatchP) teamBSwatchP.style.backgroundColor = config.teamB.colors.primary;
      if (teamBSwatchS) teamBSwatchS.style.backgroundColor = config.teamB.colors.secondary;
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
  };

  // --- Add Event Listeners ---
  // Score buttons (unchanged)
  container.querySelector('#team-a-inc')?.addEventListener('click', () => setScore('teamA', (getState().config?.teamA.score ?? 0) + 1));
  container.querySelector('#team-a-dec')?.addEventListener('click', () => setScore('teamA', (getState().config?.teamA.score ?? 0) - 1));
  container.querySelector('#team-b-inc')?.addEventListener('click', () => setScore('teamB', (getState().config?.teamB.score ?? 0) + 1));
  container.querySelector('#team-b-dec')?.addEventListener('click', () => setScore('teamB', (getState().config?.teamB.score ?? 0) - 1));

  // Toggle button listener
  startStopToggle.addEventListener('click', () => {
    if (getState().timer.isRunning) {
      timerControls.stop();
    } else {
      timerControls.start();
    }
  });

  // Reset and Set Time Listeners (unchanged)
  container.querySelector('#reset-timer')?.addEventListener('click', timerControls.reset);
  container.querySelector('#show-set-time')?.addEventListener('click', () => { /* ... */ });
  container.querySelector('#cancel-set-time')?.addEventListener('click', () => { /* ... */ });
  container.querySelector('#save-set-time')?.addEventListener('click', () => { /* ... */ });
  
  // (Re-adding the full set-time logic just in case)
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

  // --- Subscribe to State ---
  subscribe(updateUI);
  updateUI(); // Initial sync

  // Return a cleanup function
  return () => {
    unsubscribe(updateUI);
  };
}