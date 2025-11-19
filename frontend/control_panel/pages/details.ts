// frontend/control_panel/pages/details.ts
import {
  getState,
  subscribe,
  unsubscribe,
  type PlayerConfig,
} from '../stateManager';

/**
 * Helper function to generate the HTML for a team's goal list (Game Report)
 */
function renderGoalList(players: PlayerConfig[], opponentPlayers: PlayerConfig[]): string {
  // 1. Get normal goals
  const teamGoals = players.flatMap(p => 
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
      minute: Math.abs(g), 
      playerName: p.name, 
      playerNumber: p.number, 
      type: 'Own Goal' 
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

/**
 * Helper: Render Timeline
 */
interface TimelineEvent {
  minute: number;
  type: 'Goal' | 'Own Goal' | 'Yellow' | 'Red';
  playerName: string;
  playerNumber: number;
  visualTeam: 'teamA' | 'teamB'; // Which side of the timeline to display
}

function getEventPriority(type: string): number {
  // Higher number = Top of the visual stack (Latest) in bottom-up timeline
  // But we render Top-Down in HTML (Latest -> Earliest)
  // So "Later" priority means it appears ABOVE "Earlier" priority in the visual stack.
  // Requirement: Goal < Yellow < Red (Time flow).
  // Visual (Bottom Up): Goal -> Yellow -> Red.
  // HTML (Top Down): Red -> Yellow -> Goal.
  if (type === 'Red') return 3;
  if (type === 'Yellow') return 2;
  return 1; // Goal/OG
}

function getEventIcon(type: string): string {
  switch (type) {
    case 'Goal': return '⚽';
    case 'Own Goal': return '⚽ (OG)';
    case 'Yellow': return '🟨';
    case 'Red': return '🟥';
    default: return '';
  }
}

function renderTimeline(
  teamAPlayers: PlayerConfig[], 
  teamBPlayers: PlayerConfig[]
): string {
  const events: TimelineEvent[] = [];

  // 1. Gather Team A Events
  teamAPlayers.forEach(p => {
    // Goals
    p.goals.forEach(g => {
      if (g > 0) events.push({ minute: g, type: 'Goal', playerName: p.name, playerNumber: p.number, visualTeam: 'teamA' });
      else events.push({ minute: Math.abs(g), type: 'Own Goal', playerName: p.name, playerNumber: p.number, visualTeam: 'teamB' }); // OG on Opponent side
    });
    // Cards
    p.yellowCards.forEach(m => events.push({ minute: m, type: 'Yellow', playerName: p.name, playerNumber: p.number, visualTeam: 'teamA' }));
    p.redCards.forEach(m => events.push({ minute: m, type: 'Red', playerName: p.name, playerNumber: p.number, visualTeam: 'teamA' }));
  });

  // 2. Gather Team B Events
  teamBPlayers.forEach(p => {
    // Goals
    p.goals.forEach(g => {
      if (g > 0) events.push({ minute: g, type: 'Goal', playerName: p.name, playerNumber: p.number, visualTeam: 'teamB' });
      else events.push({ minute: Math.abs(g), type: 'Own Goal', playerName: p.name, playerNumber: p.number, visualTeam: 'teamA' }); // OG on Opponent side
    });
    // Cards
    p.yellowCards.forEach(m => events.push({ minute: m, type: 'Yellow', playerName: p.name, playerNumber: p.number, visualTeam: 'teamB' }));
    p.redCards.forEach(m => events.push({ minute: m, type: 'Red', playerName: p.name, playerNumber: p.number, visualTeam: 'teamB' }));
  });

  if (events.length === 0) {
    return '<div class="no-events-text">Match started - No events yet</div>';
  }

  // 3. Sort Events (Descending Minute for Top-Down rendering)
  events.sort((a, b) => {
    if (b.minute !== a.minute) {
      return b.minute - a.minute; // Higher minute first (Top)
    }
    // If minutes equal, sort by priority (Red > Yellow > Goal)
    return getEventPriority(b.type) - getEventPriority(a.type);
  });

  // 4. Generate HTML
  return `
    <div class="timeline-wrapper">
      <div class="timeline-line"></div>
      ${events.map(e => {
        const isLeft = e.visualTeam === 'teamA';
        const contentHtml = `
          <div class="timeline-event-content">
            <span class="event-name">#${e.playerNumber} ${e.playerName}</span>
            <span class="event-icon">${getEventIcon(e.type)}</span>
          </div>
        `;

        return `
          <div class="timeline-row">
            <div class="timeline-side left">
              ${isLeft ? contentHtml : ''}
            </div>
            <div class="timeline-minute">${e.minute}'</div>
            <div class="timeline-side right">
              ${!isLeft ? contentHtml : ''}
            </div>
          </div>
        `;
      }).join('')}
      <div class="timeline-row" style="margin-bottom: 0;">
         <div class="timeline-side left"></div>
         <div class="timeline-minute" style="background-color: var(--green); color: white; border-color: var(--green); font-size: 10px;">START</div>
         <div class="timeline-side right"></div>
      </div>
    </div>
  `;
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

      <div class="card">
        <h4>Match Timeline</h4>
        <div id="cp-timeline-container">
            </div>
      </div>

    </div>
  `;

  // --- Get Element References ---
  const reportHeaderA = container.querySelector('#cp-report-header-a') as HTMLHeadingElement;
  const reportHeaderB = container.querySelector('#cp-report-header-b') as HTMLHeadingElement;
  const reportListA = container.querySelector('#cp-report-list-a') as HTMLDivElement;
  const reportListB = container.querySelector('#cp-report-list-b') as HTMLDivElement;
  const timelineContainer = container.querySelector('#cp-timeline-container') as HTMLDivElement;


  // Function to update the UI
  const updateUI = () => {
    const { config } = getState();
    
    if (config) {
      reportHeaderA.textContent = config.teamA.name;
      reportHeaderB.textContent = config.teamB.name;
      
      // Render Game Report
      reportListA.innerHTML = renderGoalList(config.teamA.players, config.teamB.players);
      reportListB.innerHTML = renderGoalList(config.teamB.players, config.teamA.players);

      // Render Timeline
      timelineContainer.innerHTML = renderTimeline(config.teamA.players, config.teamB.players);
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