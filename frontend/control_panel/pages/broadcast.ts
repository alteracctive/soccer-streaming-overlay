// frontend/control_panel/pages/broadcast.ts
import {
  getState,
  subscribe,
  unsubscribe,
  toggleGameReport,
  toggleScoreboard,
  togglePlayersList,
  type PlayerConfig, // <-- Import PlayerConfig type
} from '../stateManager';

/**
 * Helper function to generate the HTML for a team's goal list
 */
function renderGoalList(players: PlayerConfig[]): string {
  const scorers = players
    .filter(p => p.goals.length > 0)
    .sort((a, b) => a.number - b.number);

  if (scorers.length === 0) {
    return '<p class="no-goals-text">No goals yet.</p>';
  }

  return scorers.map(player => `
    <div class="goal-scorer-row">
      <span class="player-number">#${player.number}</span>
      <span class="player-name">${player.name}</span>
      <span class="goal-minutes">${player.goals.map(g => `${g}'`).join(' ')}</span>
    </div>
  `).join('');
}


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

      <div class="card">
        <h4>Game Report</h4>
        <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: start;">
          <div>
            <h5 id="cp-report-header-a">Team A</h5>
            <div id="cp-report-list-a">
              <p class="no-goals-text">No goals yet.</p>
            </div>
          </div>
          
          <div style="width: 1px; background-color: var(--border-color); height: 100%; align-self: stretch;"></div>

          <div>
            <h5 id="cp-report-header-b">Team B</h5>
            <div id="cp-report-list-b">
              <p class="no-goals-text">No goals yet.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const gameReportToggleButton = container.querySelector(
    '#toggle-game-report',
  ) as HTMLButtonElement;
  
  const scoreboardToggleButton = container.querySelector(
    '#toggle-scoreboard',
  ) as HTMLButtonElement; 

  const playersListToggleButton = container.querySelector(
    '#toggle-players-list',
  ) as HTMLButtonElement;

  // --- New Report Display Elements ---
  const reportHeaderA = container.querySelector('#cp-report-header-a') as HTMLHeadingElement;
  const reportHeaderB = container.querySelector('#cp-report-header-b') as HTMLHeadingElement;
  const reportListA = container.querySelector('#cp-report-list-a') as HTMLDivElement;
  const reportListB = container.querySelector('#cp-report-list-b') as HTMLDivElement;


  // Function to update the UI (buttons and report display)
  const updateUI = () => {
    const { config, isGameReportVisible, isScoreboardVisible, isPlayersListVisible } = getState();
    
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

    // --- New Report Display Logic ---
    if (config) {
      reportHeaderA.textContent = config.teamA.name;
      reportHeaderB.textContent = config.teamB.name;
      reportListA.innerHTML = renderGoalList(config.teamA.players);
      reportListB.innerHTML = renderGoalList(config.teamB.players);
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