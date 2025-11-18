// frontend/control_panel/pages/details.ts
import {
  getState,
  subscribe,
  unsubscribe,
  type PlayerConfig, // <-- Import PlayerConfig
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

  // --- Get Element References ---
  const reportHeaderA = container.querySelector('#cp-report-header-a') as HTMLHeadingElement;
  const reportHeaderB = container.querySelector('#cp-report-header-b') as HTMLHeadingElement;
  const reportListA = container.querySelector('#cp-report-list-a') as HTMLDivElement;
  const reportListB = container.querySelector('#cp-report-list-b') as HTMLDivElement;


  // Function to update the UI
  const updateUI = () => {
    const { config } = getState();
    
    if (config) {
      reportHeaderA.textContent = config.teamA.name;
      reportHeaderB.textContent = config.teamB.name;
      reportListA.innerHTML = renderGoalList(config.teamA.players);
      reportListB.innerHTML = renderGoalList(config.teamB.players);
    }
  };

  // Subscribe to state changes
  subscribe(updateUI);
  
  // Set initial state
  updateUI();

  // Return a cleanup function
  return () => {
    unsubscribe(updateUI);
  };
}