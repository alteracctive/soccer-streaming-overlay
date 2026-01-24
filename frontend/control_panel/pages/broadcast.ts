// frontend/control_panel/pages/broadcast.ts
import { 
  getState, 
  toggleScoreboard, 
  toggleGameReport, 
  togglePlayersListA,
  togglePlayersListB,
  setPlayersListVisibility,
  toggleMatchInfoVisibility,
  subscribe,
  unsubscribe
} from '../stateManager';

export function render(container: HTMLElement) {
  
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      
      <div class="card">
        <h4>Main Overlay Elements</h4>
        <div class="form-group switch-toggle">
          <label>Scoreboard</label>
          <button id="toggle-scoreboard-btn" class="btn-secondary" style="width: 100px;">Hidden</button>
        </div>
        <div class="form-group switch-toggle">
          <label>Match Info Banner</label>
          <button id="toggle-match-info-btn" class="btn-secondary" style="width: 100px;">Hidden</button>
        </div>
      </div>

      <div class="card">
        <h4>Full Screen Graphics</h4>
        
        <div class="form-group switch-toggle">
          <label>Game Report (Goals)</label>
          <button id="toggle-gamereport-btn" class="btn-secondary" style="width: 100px;">Hidden</button>
        </div>

        <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 16px;">
            <label style="margin-bottom: 0; font-weight: 500; font-size: 14px;">Player Lists</label>
            
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button id="toggle-list-a-btn" class="btn-secondary" style="font-size: 12px; padding: 6px 10px;">Team A</button>
                <button id="toggle-list-b-btn" class="btn-secondary" style="font-size: 12px; padding: 6px 10px;">Team B</button>
                
                <button id="show-both-lists-btn" class="btn-green" style="font-size: 12px; padding: 6px 10px;">Show All</button>
                <button id="hide-both-lists-btn" class="btn-red" style="font-size: 12px; padding: 6px 10px;">Hide All</button>
            </div>
        </div>

      </div>

    </div>
  `;

  const scoreboardBtn = container.querySelector('#toggle-scoreboard-btn') as HTMLButtonElement;
  const matchInfoBtn = container.querySelector('#toggle-match-info-btn') as HTMLButtonElement;
  const gameReportBtn = container.querySelector('#toggle-gamereport-btn') as HTMLButtonElement;
  
  const listABtn = container.querySelector('#toggle-list-a-btn') as HTMLButtonElement;
  const listBBtn = container.querySelector('#toggle-list-b-btn') as HTMLButtonElement;
  const showBothBtn = container.querySelector('#show-both-lists-btn') as HTMLButtonElement;
  const hideBothBtn = container.querySelector('#hide-both-lists-btn') as HTMLButtonElement;


  const updateUI = () => {
    const { 
        isScoreboardVisible, 
        isGameReportVisible, 
        isPlayersListVisibleA, 
        isPlayersListVisibleB, 
        isMatchInfoVisible 
    } = getState();

    // Scoreboard
    if (isScoreboardVisible) {
      scoreboardBtn.textContent = 'Showing';
      scoreboardBtn.classList.remove('btn-secondary');
      scoreboardBtn.classList.add('btn-green');
    } else {
      scoreboardBtn.textContent = 'Hidden';
      scoreboardBtn.classList.remove('btn-green');
      scoreboardBtn.classList.add('btn-secondary');
    }

    // Match Info
    if (isMatchInfoVisible) {
      matchInfoBtn.textContent = 'Showing';
      matchInfoBtn.classList.remove('btn-secondary');
      matchInfoBtn.classList.add('btn-green');
    } else {
      matchInfoBtn.textContent = 'Hidden';
      matchInfoBtn.classList.remove('btn-green');
      matchInfoBtn.classList.add('btn-secondary');
    }

    // Game Report
    if (isGameReportVisible) {
      gameReportBtn.textContent = 'Showing';
      gameReportBtn.classList.remove('btn-secondary');
      gameReportBtn.classList.add('btn-green');
    } else {
      gameReportBtn.textContent = 'Hidden';
      gameReportBtn.classList.remove('btn-green');
      gameReportBtn.classList.add('btn-secondary');
    }

    // --- Team A List ---
    if (isPlayersListVisibleA) {
      listABtn.textContent = 'Team A: ON';
      listABtn.classList.remove('btn-secondary');
      listABtn.classList.add('btn-green');
    } else {
      listABtn.textContent = 'Team A: OFF';
      listABtn.classList.remove('btn-green');
      listABtn.classList.add('btn-secondary');
    }

    // --- Team B List ---
    if (isPlayersListVisibleB) {
      listBBtn.textContent = 'Team B: ON';
      listBBtn.classList.remove('btn-secondary');
      listBBtn.classList.add('btn-green');
    } else {
      listBBtn.textContent = 'Team B: OFF';
      listBBtn.classList.remove('btn-green');
      listBBtn.classList.add('btn-secondary');
    }
  };

  // Listeners
  scoreboardBtn.addEventListener('click', toggleScoreboard);
  matchInfoBtn.addEventListener('click', toggleMatchInfoVisibility);
  gameReportBtn.addEventListener('click', toggleGameReport);
  
  listABtn.addEventListener('click', togglePlayersListA);
  listBBtn.addEventListener('click', togglePlayersListB);
  showBothBtn.addEventListener('click', () => setPlayersListVisibility(true, true));
  hideBothBtn.addEventListener('click', () => setPlayersListVisibility(false, false));

  subscribe(updateUI);
  updateUI();

  return () => {
    unsubscribe(updateUI);
  };
}