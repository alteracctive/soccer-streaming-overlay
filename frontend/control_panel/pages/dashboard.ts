import {
  getState,
  subscribe,
  unsubscribe,
  STATE_UPDATE_EVENT,
  timerControls,
  setScore,
  // --- addPreset, deletePreset removed ---
} from '../stateManager';
import { showNotification } from '../notification';

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
        <h4>${config?.teamA.name || 'Team A'} (${
    config?.teamA.abbreviation || 'TMA'
  })</h4>
        <div class="team-score" id="team-a-score">${
          config?.teamA.score ?? 0
        }</div>
        <div class="btn-group">
          <button id="team-a-inc" style="flex-grow: 1;">+1</button>
          <button id="team-a-dec" class="btn-secondary" style="flex-grow: 1;">-1</button>
        </div>
      </div>
      <div class="card team-control">
        <h4>${config?.teamB.name || 'Team B'} (${
    config?.teamB.abbreviation || 'TMB'
  })</h4>
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
        <button id="start-timer" class="btn-green" style="flex-grow: 1;">Start</button>
        <button id="stop-timer" class="btn-red" style="flex-grow: 1;">Stop</button>
        <button id="reset-timer" class="btn-secondary">Reset</button>
        <button id="show-set-time" class="btn-secondary">Set</button>
      </div>

      <div id="set-time-popup">
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
  const timerDisplayEl = container.querySelector('#timer-display') as HTMLElement;
  const startTimerBtn = container.querySelector(
    '#start-timer',
  ) as HTMLButtonElement;
  const stopTimerBtn = container.querySelector(
    '#stop-timer',
  ) as HTMLButtonElement;
  const setTimePopup = container.querySelector(
    '#set-time-popup',
  ) as HTMLDivElement;
  const timerMinInput = container.querySelector(
    '#timer-min',
  ) as HTMLInputElement;
  const timerSecInput = container.querySelector(
    '#timer-sec',
  ) as HTMLInputElement;
  // --- presetContainer ref removed ---

  // --- renderPresetButtons function removed ---

  // --- Update UI Function ---
  const updateUI = () => {
    const { config, timer } = getState();

    // Update scores and names
    if (config) {
      teamAScoreEl.textContent = config.teamA.score.toString();
      teamBScoreEl.textContent = config.teamB.score.toString();
      const headers = container.querySelectorAll('.team-control h4');
      if (headers[0]) (headers[0] as HTMLElement).textContent = `${config.teamA.name} (${config.teamA.abbreviation})`;
      if (headers[1]) (headers[1] as HTMLElement).textContent = `${config.teamB.name} (${config.teamB.abbreviation})`;
    }

    // Update timer display
    timerDisplayEl.textContent = formatTime(timer.seconds);
    startTimerBtn.disabled = timer.isRunning;
    stopTimerBtn.disabled = !timer.isRunning;
    
    // --- renderPresets call removed ---
  };

  // --- Add Event Listeners ---
  // Score buttons
  container.querySelector('#team-a-inc')?.addEventListener('click', () => setScore('teamA', (getState().config?.teamA.score ?? 0) + 1));
  container.querySelector('#team-a-dec')?.addEventListener('click', () => setScore('teamA', (getState().config?.teamA.score ?? 0) - 1));
  container.querySelector('#team-b-inc')?.addEventListener('click', () => setScore('teamB', (getState().config?.teamB.score ?? 0) + 1));
  container.querySelector('#team-b-dec')?.addEventListener('click', () => setScore('teamB', (getState().config?.teamB.score ?? 0) - 1));
  
  // Timer buttons
  startTimerBtn.addEventListener('click', timerControls.start);
  stopTimerBtn.addEventListener('click', timerControls.stop);
  container.querySelector('#reset-timer')?.addEventListener('click', timerControls.reset);

  // Set Time Popup controls
  container.querySelector('#show-set-time')?.addEventListener('click', () => {
    const { seconds } = getState().timer;
    timerMinInput.value = Math.floor(seconds / 60).toString();
    timerSecInput.value = (seconds % 60).toString();
    setTimePopup.style.display = 'block';
    // --- delete-mode class removed ---
  });

  container.querySelector('#cancel-set-time')?.addEventListener('click', () => {
    setTimePopup.style.display = 'none';
    // --- delete-mode class removed ---
  });

  container.querySelector('#save-set-time')?.addEventListener('click', () => {
    let minutes = parseInt(timerMinInput.value, 10) || 0;
    let seconds = parseInt(timerSecInput.value, 10) || 0;
    
    if (minutes > 999) minutes = 999;
    if (minutes < 0) minutes = 0;
    if (seconds > 59) seconds = 59;
    if (seconds < 0) seconds = 0;
    
    timerControls.set(minutes * 60 + seconds);
    setTimePopup.style.display = 'none';
    // --- delete-mode class removed ---
  });
  
  // --- 'Add Preset' listener removed ---

  // --- Subscribe to State ---
  subscribe(updateUI);
  updateUI(); // Initial sync

  // Return a cleanup function
  return () => {
    unsubscribe(updateUI);
  };
}