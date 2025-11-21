// frontend/control_panel/pages/broadcast.ts
import {
  getState,
  subscribe,
  unsubscribe,
  toggleGameReport,
  toggleScoreboard,
  togglePlayersList,
} from '../stateManager';

export function render(container: HTMLElement) {
  
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="card">
        <h4>Broadcast Controls</h4>
        
        <div class="form-group" style="display: flex; justify-content: space-between; align-items: center;">
          <label for="toggle-scoreboard" style="margin-bottom: 0; font-weight: 500;">Scoreboard Overlay</label>
          <button id="toggle-scoreboard" style="min-width: 100px;">
            Showing
          </button>
        </div>

        <div class="form-group" style="display: flex; justify-content: space-between; align-items: center;">
          <label for="toggle-game-report" style="margin-bottom: 0; font-weight: 500;">Game Report Overlay</label>
          <button id="toggle-game-report" style="min-width: 100px;">
            Hidden
          </button>
        </div>
        
        <div class="form-group" style="display: flex; justify-content: space-between; align-items: center;">
          <label for="toggle-players-list" style="margin-bottom: 0; font-weight: 500;">Players List Overlay</label>
          <button id="toggle-players-list" style="min-width: 100px;">
            Hidden
          </button>
        </div>
      </div>
    </div>
  `;

  // --- Get Element References ---
  const gameReportToggleButton = container.querySelector(
    '#toggle-game-report',
  ) as HTMLButtonElement;
  
  const scoreboardToggleButton = container.querySelector(
    '#toggle-scoreboard',
  ) as HTMLButtonElement; 

  const playersListToggleButton = container.querySelector(
    '#toggle-players-list',
  ) as HTMLButtonElement;


  // Function to update the UI (buttons)
  const updateUI = () => {
    const { isGameReportVisible, isScoreboardVisible, isPlayersListVisible } = getState();
    
    // Update Toggle Buttons
    if (gameReportToggleButton) {
        if (isGameReportVisible) {
          gameReportToggleButton.textContent = 'Showing';
          gameReportToggleButton.classList.remove('btn-red', 'btn-secondary');
          gameReportToggleButton.classList.add('btn-green');
        } else {
          gameReportToggleButton.textContent = 'Hidden';
          gameReportToggleButton.classList.remove('btn-green', 'btn-secondary');
          gameReportToggleButton.classList.add('btn-red');
        }
    }
    if (scoreboardToggleButton) {
        if (isScoreboardVisible) {
          scoreboardToggleButton.textContent = 'Showing';
          scoreboardToggleButton.classList.remove('btn-red', 'btn-secondary');
          scoreboardToggleButton.classList.add('btn-green');
        } else {
          scoreboardToggleButton.textContent = 'Hidden';
          scoreboardToggleButton.classList.remove('btn-green', 'btn-secondary');
          scoreboardToggleButton.classList.add('btn-red');
        }
    }
    if (playersListToggleButton) {
        if (isPlayersListVisible) {
          playersListToggleButton.textContent = 'Showing';
          playersListToggleButton.classList.remove('btn-red', 'btn-secondary');
          playersListToggleButton.classList.add('btn-green');
        } else {
          playersListToggleButton.textContent = 'Hidden';
          playersListToggleButton.classList.remove('btn-green', 'btn-secondary');
          playersListToggleButton.classList.add('btn-red');
        }
    }
  };

  // --- Add click listeners ---
  gameReportToggleButton.addEventListener('click', () => {
    toggleGameReport();
  });

  scoreboardToggleButton.addEventListener('click', () => {
    toggleScoreboard(); 
  });
  
  playersListToggleButton.addEventListener('click', () => {
    togglePlayersList();
  });

  // Subscribe to state changes
  subscribe(updateUI);
  
  // Set initial state
  updateUI();

  // Return a cleanup function
  return () => {
    unsubscribe(updateUI);
  };
}