// frontend/control_panel/pages/details.ts
import {
  getState,
  subscribe,
  unsubscribe,
  type PlayerConfig,
  type TeamConfig,
} from '../stateManager';

// --- Updated Helper Function ---
function renderGoalList(
  teamPlayers: PlayerConfig[], 
  opponentPlayers: PlayerConfig[]
): string {
  
  // 1. Get normal goals
  const teamGoals = teamPlayers.flatMap(p => 
    p.goals.filter(g => g > 0).map(g => ({ 
      minute: g, 
      playerName: p.name, 
      playerNumber: p.number, 
      type: 'Goal' 
    }))
  );

  // 2. Get own goals from opponent
  const opponentOwnGoals = opponentPlayers.flatMap(p => 
    p.goals.filter(g => g < 0).map(g => ({ 
      minute: Math.abs(g), // Convert back to positive for display
      playerName: p.name, 
      playerNumber: p.number, 
      type: 'Own Goal' // Mark as OG
    }))
  );

  // 3. Merge and Sort
  const allScoringEvents = [...teamGoals, ...opponentOwnGoals].sort((a, b) => a.minute - b.minute);

  if (allScoringEvents.length === 0) {
    return '<p class="no-goals-text">No goals yet.</p>';
  }

  return allScoringEvents.map(event => `
    <div class="goal-scorer-row">
      <span class="player-number">#${event.playerNumber}</span>
      <span class="player-name">${event.playerName} ${event.type === 'Own Goal' ? '(OG)' : ''}</span>
      <span class="goal-minutes">${event.minute}'</span>
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

  const reportHeaderA = container.querySelector('#cp-report-header-a') as HTMLHeadingElement;
  const reportHeaderB = container.querySelector('#cp-report-header-b') as HTMLHeadingElement;
  const reportListA = container.querySelector('#cp-report-list-a') as HTMLDivElement;
  const reportListB = container.querySelector('#cp-report-list-b') as HTMLDivElement;


  const updateUI = () => {
    const { config } = getState();
    
    if (config) {
      reportHeaderA.textContent = config.teamA.name;
      reportHeaderB.textContent = config.teamB.name;
      // Pass both arrays to the renderer
      reportListA.innerHTML = renderGoalList(config.teamA.players, config.teamB.players);
      reportListB.innerHTML = renderGoalList(config.teamB.players, config.teamA.players);
    }
  };

  subscribe(updateUI);
  updateUI();

  return () => {
    unsubscribe(updateUI);
  };
}