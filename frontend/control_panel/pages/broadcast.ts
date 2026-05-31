// frontend/control_panel/pages/broadcast.ts
import { 
  getState, 
  toggleScoreboard, 
  toggleGameReport, 
  togglePlayersListA,
  togglePlayersListB,
  setPlayersListVisibility,
  toggleMatchInfoVisibility,
  sendVarUpdate,
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

      <div class="card">
        <h4>VAR Check</h4>
        <div class="form-group">
          <label>Scenario</label>
          <div id="var-scenario-buttons" class="btn-group">
            <!-- Scenario buttons will be injected here -->
          </div>
        </div>
        <div class="form-group" id="var-message-group" style="display: none;">
          <label>Message</label>
          <div id="var-message-buttons" class="btn-group">
            <!-- Message buttons will be injected here -->
          </div>
        </div>
        <div id="var-buttons" style="display: none; gap: 6px; margin-top: 16px;">
          <button id="var-hide-btn" class="btn-secondary">Hide Pop up</button>
          <button id="var-confirm-btn" class="btn-green"></button>
          <button id="var-deny-btn" class="btn-red"></button>
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

  const varScenarioButtons = container.querySelector('#var-scenario-buttons') as HTMLDivElement;
  const varMessageGroup = container.querySelector('#var-message-group') as HTMLDivElement;
  const varMessageButtons = container.querySelector('#var-message-buttons') as HTMLDivElement;
  const varButtonsDiv = container.querySelector('#var-buttons') as HTMLDivElement;
  const varHideBtn = container.querySelector('#var-hide-btn') as HTMLButtonElement;
  const varConfirmBtn = container.querySelector('#var-confirm-btn') as HTMLButtonElement;
  const varDenyBtn = container.querySelector('#var-deny-btn') as HTMLButtonElement;

  const varMessages: Record<string, string[]> = {
    "Possible Red Card": ["Professional Foul", "Serious Foul", "Second Yellow Card", "Violent Conduct", "Offensive Language"],
    "Checking Goal": ["Possible Offside", "Possible Foul", "Ball out of bound", "Checking goal line"],
    "Possible Penalty": ["Possible Offside", "Possible Foul", "Checking Foul location"]
  };

  const updateUI = () => {
    const { 
        isScoreboardVisible, 
        isGameReportVisible, 
        isPlayersListVisibleA, 
        isPlayersListVisibleB, 
        isMatchInfoVisible,
        varState
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

    // VAR
    const { scenario, message } = varState;
    
    varScenarioButtons.innerHTML = Object.keys(varMessages).map(scen => 
        `<button class="btn ${scenario === scen ? 'btn-green' : 'btn-secondary'}" data-scenario="${scen}">${scen}</button>`
    ).join('');

    if (scenario) {
      varMessageGroup.style.display = 'block';
      varMessageButtons.innerHTML = varMessages[scenario].map(msg => 
        `<button class="btn ${message === msg ? 'btn-green' : 'btn-secondary'}" data-message="${msg}">${msg}</button>`
      ).join('');
    } else {
      varMessageGroup.style.display = 'none';
      varMessageButtons.innerHTML = '';
    }

    if (scenario && message) {
      varButtonsDiv.style.display = 'flex';
      switch (scenario) {
        case "Possible Red Card":
          varConfirmBtn.textContent = "No Red Card";
          varDenyBtn.textContent = "Red Card";
          break;
        case "Checking Goal":
          varConfirmBtn.textContent = "Goal";
          varDenyBtn.textContent = "No Goal";
          break;
        case "Possible Penalty":
          varConfirmBtn.textContent = "No Penalty";
          varDenyBtn.textContent = "Penalty";
          break;
      }
    } else {
      varButtonsDiv.style.display = 'none';
    }
  };

  function handleScenarioClick(e: Event) {
    const target = e.target as HTMLButtonElement;
    const scenario = target.dataset.scenario;
    if (scenario) {
      const currentState = getState().varState;
      if (currentState.scenario === scenario) {
        // Deselect
        sendVarUpdate({ isVisible: false, scenario: '', message: '', decision: '' });
      } else {
        sendVarUpdate({ isVisible: false, scenario: scenario, message: '', decision: '' });
      }
    }
  }

  function handleMessageClick(e: Event) {
    const target = e.target as HTMLButtonElement;
    const message = target.dataset.message;
    if (message) {
      const currentState = getState().varState;
      if (currentState.message === message) {
        // Deselect
        sendVarUpdate({ isVisible: false, message: '', decision: '' });
      } else {
        sendVarUpdate({ isVisible: true, message: message, decision: '' });
      }
    }
  }

  varScenarioButtons.addEventListener('click', handleScenarioClick);
  varMessageButtons.addEventListener('click', handleMessageClick);

  varHideBtn.addEventListener('click', () => {
    sendVarUpdate({ isVisible: false, scenario: '', message: '', decision: '' });
  });
  
  varConfirmBtn.addEventListener('click', () => {
    sendVarUpdate({ decision: varConfirmBtn.textContent || '' });
  });

  varDenyBtn.addEventListener('click', () => {
    sendVarUpdate({ decision: varDenyBtn.textContent || '' });
  });
  
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
