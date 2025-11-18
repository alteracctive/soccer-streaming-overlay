// frontend/control_panel/pages/broadcast.ts
import {
  getState,
  subscribe,
  unsubscribe,
  toggleGameReport,
  toggleScoreboard,
  togglePlayersList,
  saveMatchInfo,
  toggleMatchInfoVisibility,
  // type PlayerConfig, <-- Removed
} from '../stateManager';
import { showNotification } from '../notification';

// --- renderGoalList helper function removed ---

export function render(container: HTMLElement) {
  
  const { scoreboardStyle, isMatchInfoVisible } = getState(); 

  container.innerHTML = `
    <style>
      .unsaved-indicator {
        opacity: 0.7;
        font-weight: normal;
        font-size: 0.8em;
        margin-left: 8px;
        font-style: italic;
      }
    </style>

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

      <div class="card">
        <h4>Match Info <span id="match-info-unsaved" class="unsaved-indicator"></span></h4>
        <div class="form-group inline-form-group" style="align-items: end;">
          <div class="form-group" style="flex-grow: 1;">
            <label id="match-info-label" for="match-info-input">Text</label>
            <input type="text" id="match-info-input" value="${scoreboardStyle?.matchInfo ?? ''}">
          </div>
          <button id="save-match-info" style="flex-shrink: 0;">Save</button>
          <button id="toggle-match-info" style="min-width: 100px; flex-shrink: 0;">
            ${isMatchInfoVisible ? 'Showing' : 'Hidden'}
          </button>
        </div>
      </div>

      </div>
  `;

  // --- Local State ---
  let isMatchInfoUnsaved = false;

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

  // --- Match Info Refs ---
  const matchInfoInput = container.querySelector(
    '#match-info-input',
  ) as HTMLInputElement;
  const saveMatchInfoBtn = container.querySelector(
    '#save-match-info',
  ) as HTMLButtonElement;
  const toggleMatchInfoBtn = container.querySelector(
    '#toggle-match-info',
  ) as HTMLButtonElement;
  const matchInfoUnsaved = container.querySelector(
    '#match-info-unsaved',
  ) as HTMLSpanElement;
  const matchInfoLabel = container.querySelector(
    '#match-info-label',
  ) as HTMLLabelElement;


  // --- Removed Report Display Elements ---

  
  // --- Helper Function ---
  const updateUnsavedMatchInfo = () => {
    if (matchInfoUnsaved) {
      matchInfoUnsaved.textContent = isMatchInfoUnsaved ? '(unsaved data)' : '';
    }
    if (matchInfoLabel) {
      matchInfoLabel.style.fontStyle = isMatchInfoUnsaved ? 'italic' : 'normal';
    }
  };


  // Function to update the UI
  const updateUI = () => {
    const { scoreboardStyle, isGameReportVisible, isScoreboardVisible, isPlayersListVisible, isMatchInfoVisible } = getState();
    
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
    
    if (toggleMatchInfoBtn) {
        if (isMatchInfoVisible) {
          toggleMatchInfoBtn.textContent = 'Showing';
          toggleMatchInfoBtn.classList.remove('btn-red', 'btn-secondary');
          toggleMatchInfoBtn.classList.add('btn-green');
        } else {
          toggleMatchInfoBtn.textContent = 'Hidden';
          toggleMatchInfoBtn.classList.remove('btn-green', 'btn-secondary');
          toggleMatchInfoBtn.classList.add('btn-red');
        }
    }
    
    if (scoreboardStyle && matchInfoInput && !isMatchInfoUnsaved) {
      matchInfoInput.value = scoreboardStyle.matchInfo;
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

  // --- Match Info Listener ---
  saveMatchInfoBtn.addEventListener('click', async () => {
    try {
      await saveMatchInfo(matchInfoInput.value);
      isMatchInfoUnsaved = false;
      updateUnsavedMatchInfo();
      showNotification('Match info saved!');
    } catch (error: any) {
      showNotification(`Error: ${error.message}`, 'error');
    }
  });
  
  toggleMatchInfoBtn.addEventListener('click', () => {
    toggleMatchInfoVisibility();
  });
  
  matchInfoInput.addEventListener('input', () => {
    isMatchInfoUnsaved = true;
    updateUnsavedMatchInfo();
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