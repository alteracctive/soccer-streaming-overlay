// frontend/control_panel/pages/team-info.ts
import { 
  getState, 
  saveTeamInfo, 
  saveColors, 
  addPlayer, 
  clearPlayerList,
  deletePlayer,
  addGoal,
  addCard,
  toggleOnField,
  editPlayer,
  resetTeamStats,
  replacePlayer,
  subscribe,
  unsubscribe,
  setScore,
  getPeriods, // <-- Import to get limits
  type PlayerConfig,
  type Goal,
  type PeriodSetting
} from '../stateManager';
import { showNotification } from '../notification';

type ConfirmAction = (() => Promise<void>) | null;

export function render(container: HTMLElement) {
  const { config } = getState();
  let allPeriods: PeriodSetting[] = [];
  let currentPeriodLimit = 45; // Fallback

  container.innerHTML = `
    <style>
      .unsaved-indicator { opacity: 0.7; font-weight: normal; font-size: 0.8em; margin-left: 8px; font-style: italic; }
    </style>
    <div class="modal-overlay" id="confirmation-modal" style="display: none;">
      <div class="modal-content">
        <h4>Are you sure?</h4>
        <p id="modal-message-text">This action cannot be undone.</p>
        <div class="modal-buttons">
          <button id="modal-cancel-btn" class="btn-secondary">Cancel</button>
          <button id="modal-confirm-btn" class="btn-red">Confirm</button>
        </div>
      </div>
    </div>
    <div class="modal-overlay" id="player-edit-modal" style="display: none;">
      <div class="modal-content player-edit-modal">
        <div class="modal-header-wrapper">
          <div class="modal-team-info">
             <span class="modal-team-swatch" id="modal-team-primary"></span>
             <span class="modal-team-swatch" id="modal-team-secondary"></span>
             <span id="modal-team-name">Team Name</span>
          </div>
          <div class="modal-nav-header">
            <button id="prev-player-btn" class="nav-arrow-btn"><span id="prev-player-num"></span> <span class="arrow-icon">◄</span></button>
            <h4 id="player-edit-title">#99 Player Name</h4>
            <button id="next-player-btn" class="nav-arrow-btn"><span class="arrow-icon">►</span> <span id="next-player-num"></span></button>
          </div>
        </div>
        <div class="player-edit-modal-body">
          <div class="form-group inline-form-group" style="gap: 16px;">
            <div class="form-group" style="width: 80px;">
              <label for="edit-player-number">Number</label>
              <input type="number" id="edit-player-number" min="0" max="99">
            </div>
            <div class="form-group" style="flex-grow: 1;">
              <label for="edit-player-name">Name</label>
              <input type="text" id="edit-player-name">
            </div>
          </div>
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label style="margin-bottom: 0;">Goals</label>
              <div style="display: flex; gap: 8px;">
                 <button id="edit-add-own-goal-btn" class="player-action-btn player-own-goal-btn" style="padding: 2px 8px; font-size: 12px; width: auto; height: auto; line-height: 1.5;">+ Add Own Goal</button>
                 <button id="edit-add-goal-btn" class="player-action-btn player-goal-btn" style="padding: 2px 8px; font-size: 12px; width: auto; height: auto; line-height: 1.5;">+ Add Goal</button>
              </div>
            </div>
            <ul class="goal-list" id="edit-player-goals-list"></ul>
          </div>
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label style="margin-bottom: 0;">Yellow Cards (Max 2)</label>
              <button id="edit-add-yellow-btn" class="player-action-btn player-yellow-btn" style="padding: 2px 8px; font-size: 12px; width: auto; height: auto; line-height: 1.5;">+ Add 🟨</button>
            </div>
            <ul class="goal-list" id="edit-yellow-cards-list"></ul>
          </div>
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label style="margin-bottom: 0;">Red Cards (Max 1)</label>
              <button id="edit-add-red-btn" class="player-action-btn player-red-btn" style="padding: 2px 8px; font-size: 12px; width: auto; height: auto; line-height: 1.5;">+ Add 🟥</button>
            </div>
            <ul class="goal-list" id="edit-red-cards-list"></ul>
          </div>
        </div>
        <div class="modal-buttons">
          <button id="modal-delete-player-btn" class="btn-red">Delete Player</button>
          <button id="modal-edit-cancel-btn" class="btn-secondary">Cancel</button>
          <button id="modal-save-btn" class="btn-green">Save</button>
        </div>
      </div>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 16px;"> 
      <div class="card">
         <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: start;">
          <div>
            <h4>Team A Info <span id="unsaved-a" class="unsaved-indicator"></span></h4>
            <div class="inline-form-group">
              <div class="form-group" style="flex-grow: 1;">
                <label for="team-a-name">Team Name</label>
                <input type="text" id="team-a-name" value="${config?.teamA.name ?? ''}">
              </div>
              <div class="form-group" style="width: 120px;">
                <label for="team-a-abbr">Abbreviation</label>
                <input type="text" id="team-a-abbr" maxlength="4" value="${config?.teamA.abbreviation ?? ''}">
              </div>
            </div>
            <h5 style="margin-top: 16px; margin-bottom: 8px; border-top: 1px solid var(--border-color); padding-top: 12px;">Team A Colors</h5>
            <div class="color-picker-row">
              <label for="team-a-primary">Primary Color</label>
              <input type="color" id="team-a-primary" value="${config?.teamA.colors.primary ?? '#FF0000'}">
            </div>
            <div class="color-picker-row">
              <label for="team-a-secondary">Secondary Color</label>
              <input type="color" id="team-a-secondary" value="${config?.teamA.colors.secondary ?? '#FFFFFF'}">
            </div>
            <button id="sync-a" class="btn-secondary" style="margin-top: 12px; width: 100%;">Use Primary as Secondary</button>
          </div>
          <div style="width: 1px; background-color: var(--border-color); height: 100%; align-self: stretch;"></div>
          <div>
            <h4>Team B Info <span id="unsaved-b" class="unsaved-indicator"></span></h4>
            <div class="inline-form-group">
              <div class="form-group" style="flex-grow: 1;">
                <label for="team-b-name">Team Name</label>
                <input type="text" id="team-b-name" value="${config?.teamB.name ?? ''}">
              </div>
              <div class="form-group" style="width: 120px;">
                <label for="team-b-abbr">Abbreviation</label>
                <input type="text" id="team-b-abbr" maxlength="4" value="${config?.teamB.abbreviation ?? ''}">
              </div>
            </div>
            <h5 style="margin-top: 16px; margin-bottom: 8px; border-top: 1px solid var(--border-color); padding-top: 12px;">Team B Colors</h5>
            <div class="color-picker-row">
              <label for="team-b-primary">Primary Color</label>
              <input type="color" id="team-b-primary" value="${config?.teamB.colors.primary ?? '#0000FF'}">
            </div>
            <div class="color-picker-row">
              <label for="team-b-secondary">Secondary Color</label>
              <input type="color" id="team-b-secondary" value="${config?.teamB.colors.secondary ?? '#FFFFFF'}">
            </div>
            <button id="sync-b" class="btn-secondary" style="margin-top: 12px; width: 100%;">Use Primary as Secondary</button>
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 8px; align-items: center;">
          <button id="save-team-info">Save Team Info</button>
        </div>
      </div> 
      
      <div class="card">
        <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: start;">
          <div>
            <h4>Team A - Add Player</h4>
            <div class="inline-form-group" style="align-items: end;">
              <div class="form-group" style="width: 80px;">
                <label for="team-a-player-number">Number</label>
                <input type="number" id="team-a-player-number" min="0" max="99" placeholder="0-99">
              </div>
              <div class="form-group" style="flex-grow: 1;">
                <label for="team-a-player-name">Name</label>
                <input type="text" id="team-a-player-name" placeholder="Player Name">
              </div>
              <button id="add-player-a">Add</button>
            </div>
            <div class="btn-group" style="margin-top: 12px;">
              <button id="delete-list-a" class="btn-secondary" style="width: 100%;">Delete Team A List</button>
              <button id="reset-stats-a" class="btn-secondary" style="width: 100%;">Reset Team A Stats</button>
            </div>
            <h4 style="margin-top: 16px;">Team A Roster</h4>
            <div class="player-totals-row" id="player-totals-a"></div>
            <div class="player-list-container" id="player-list-a"></div>
          </div>
          <div style="width: 1px; background-color: var(--border-color); height: 100%; align-self: stretch;"></div>
          <div>
            <h4>Team B - Add Player</h4>
            <div class="inline-form-group" style="align-items: end;">
              <div class="form-group" style="width: 80px;">
                <label for="team-b-player-number">Number</label>
                <input type="number" id="team-b-player-number" min="0" max="99" placeholder="0-99">
              </div>
              <div class="form-group" style="flex-grow: 1;">
                <label for="team-b-player-name">Name</label>
                <input type="text" id="team-b-player-name" placeholder="Player Name">
              </div>
              <button id="add-player-b">Add</button>
            </div>
            <div class="btn-group" style="margin-top: 12px;">
              <button id="delete-list-b" class="btn-secondary" style="width: 100%;">Delete Team B List</button>
              <button id="reset-stats-b" class="btn-secondary" style="width: 100%;">Reset Team B Stats</button>
            </div>
            <h4 style="margin-top: 16px;">Team B Roster</h4>
            <div class="player-totals-row" id="player-totals-b"></div>
            <div class="player-list-container" id="player-list-b"></div>
          </div>
        </div>
      </div> 
    </div> 
  `;

  // ... (Ref Variables, Handlers, and Initial Selectors - Unchanged) ...
  let isTeamAUnsaved = false;
  let isTeamBUnsaved = false;
  let playerToEdit: PlayerConfig | null = null;
  let teamToEdit: 'teamA' | 'teamB' | null = null;
  let editGoals: Goal[] = []; // <-- Changed Type
  let editYellowCards: number[] = [];
  let editRedCards: number[] = [];

  const teamAName = container.querySelector('#team-a-name') as HTMLInputElement;
  const teamAAbbr = container.querySelector('#team-a-abbr') as HTMLInputElement;
  const teamBName = container.querySelector('#team-b-name') as HTMLInputElement;
  const teamBAbbr = container.querySelector('#team-b-abbr') as HTMLInputElement;
  // ... all other standard refs ...
  const teamAPrimary = container.querySelector('#team-a-primary') as HTMLInputElement;
  const teamASecondary = container.querySelector('#team-a-secondary') as HTMLInputElement;
  const teamBPrimary = container.querySelector('#team-b-primary') as HTMLInputElement;
  const teamBSecondary = container.querySelector('#team-b-secondary') as HTMLInputElement;
  const teamANameLabel = container.querySelector('label[for="team-a-name"]') as HTMLLabelElement;
  const teamAAbbrLabel = container.querySelector('label[for="team-a-abbr"]') as HTMLLabelElement;
  const teamBNameLabel = container.querySelector('label[for="team-b-name"]') as HTMLLabelElement;
  const teamBAbbrLabel = container.querySelector('label[for="team-b-abbr"]') as HTMLLabelElement;
  const teamAPrimaryLabel = container.querySelector('label[for="team-a-primary"]') as HTMLLabelElement;
  const teamASecondaryLabel = container.querySelector('label[for="team-a-secondary"]') as HTMLLabelElement;
  const teamBPrimaryLabel = container.querySelector('label[for="team-b-primary"]') as HTMLLabelElement;
  const teamBSecondaryLabel = container.querySelector('label[for="team-b-secondary"]') as HTMLLabelElement;
  const teamAPlayerNum = container.querySelector('#team-a-player-number') as HTMLInputElement;
  const teamAPlayerName = container.querySelector('#team-a-player-name') as HTMLInputElement;
  const addPlayerAButton = container.querySelector('#add-player-a') as HTMLButtonElement;
  const teamBPlayerNum = container.querySelector('#team-b-player-number') as HTMLInputElement;
  const teamBPlayerName = container.querySelector('#team-b-player-name') as HTMLInputElement;
  const addPlayerBButton = container.querySelector('#add-player-b') as HTMLButtonElement;
  const confirmModal = container.querySelector('#confirmation-modal') as HTMLDivElement;
  const modalMessage = container.querySelector('#modal-message-text') as HTMLParagraphElement;
  const modalConfirmBtn = container.querySelector('#modal-confirm-btn') as HTMLButtonElement;
  const modalCancelBtn = container.querySelector('#modal-cancel-btn') as HTMLButtonElement;
  const playerEditModal = container.querySelector('#player-edit-modal') as HTMLDivElement;
  const playerEditTitle = container.querySelector('#player-edit-title') as HTMLHeadingElement;
  const modalTeamName = container.querySelector('#modal-team-name') as HTMLSpanElement;
  const modalTeamPrimary = container.querySelector('#modal-team-primary') as HTMLSpanElement;
  const modalTeamSecondary = container.querySelector('#modal-team-secondary') as HTMLSpanElement;
  const prevPlayerBtn = container.querySelector('#prev-player-btn') as HTMLButtonElement;
  const nextPlayerBtn = container.querySelector('#next-player-btn') as HTMLButtonElement;
  const prevPlayerNum = container.querySelector('#prev-player-num') as HTMLSpanElement;
  const nextPlayerNum = container.querySelector('#next-player-num') as HTMLSpanElement;
  const editPlayerNumber = container.querySelector('#edit-player-number') as HTMLInputElement;
  const editPlayerName = container.querySelector('#edit-player-name') as HTMLInputElement;
  const editGoalsList = container.querySelector('#edit-player-goals-list') as HTMLUListElement;
  const editAddGoalBtn = container.querySelector('#edit-add-goal-btn') as HTMLButtonElement;
  const editAddOwnGoalBtn = container.querySelector('#edit-add-own-goal-btn') as HTMLButtonElement;
  const editYellowCardsList = container.querySelector('#edit-yellow-cards-list') as HTMLUListElement;
  const editAddYellowBtn = container.querySelector('#edit-add-yellow-btn') as HTMLButtonElement;
  const editRedCardsList = container.querySelector('#edit-red-cards-list') as HTMLUListElement;
  const editAddRedBtn = container.querySelector('#edit-add-red-btn') as HTMLButtonElement;
  const modalSaveBtn = container.querySelector('#modal-save-btn') as HTMLButtonElement;
  const modalEditCancelBtn = container.querySelector('#modal-edit-cancel-btn') as HTMLButtonElement;
  const modalDeletePlayerBtn = container.querySelector('#modal-delete-player-btn') as HTMLButtonElement;
  const deleteListAButton = container.querySelector('#delete-list-a') as HTMLButtonElement;
  const deleteListBButton = container.querySelector('#delete-list-b') as HTMLButtonElement;
  const resetStatsAButton = container.querySelector('#reset-stats-a') as HTMLButtonElement;
  const resetStatsBButton = container.querySelector('#reset-stats-b') as HTMLButtonElement;
  const unsavedA = container.querySelector('#unsaved-a') as HTMLSpanElement;
  const unsavedB = container.querySelector('#unsaved-b') as HTMLSpanElement;
  const playerListA = container.querySelector('#player-list-a') as HTMLDivElement;
  const playerListB = container.querySelector('#player-list-b') as HTMLDivElement;
  const playerTotalsA = container.querySelector('#player-totals-a') as HTMLDivElement;
  const playerTotalsB = container.querySelector('#player-totals-b') as HTMLDivElement;

  // ... (Basic helpers unchanged) ...
  const teamAFields: [HTMLInputElement, HTMLLabelElement][] = [[teamAName, teamANameLabel],[teamAAbbr, teamAAbbrLabel],[teamAPrimary, teamAPrimaryLabel],[teamASecondary, teamASecondaryLabel]];
  const teamBFields: [HTMLInputElement, HTMLLabelElement][] = [[teamBName, teamBNameLabel],[teamBAbbr, teamBAbbrLabel],[teamBPrimary, teamBPrimaryLabel],[teamBSecondary, teamBSecondaryLabel]];
  const updateUnsavedIndicators = () => { if (unsavedA) unsavedA.textContent = isTeamAUnsaved ? '(unsaved data)' : ''; if (unsavedB) unsavedB.textContent = isTeamBUnsaved ? '(unsaved data)' : ''; };
  let confirmAction: ConfirmAction = null;
  const showConfirmModal = (message: string, onConfirm: ConfirmAction) => { modalMessage.textContent = message; confirmAction = onConfirm; confirmModal.style.display = 'flex'; };
  const hideConfirmModal = () => { confirmModal.style.display = 'none'; modalMessage.textContent = ''; confirmAction = null; };
  modalConfirmBtn.addEventListener('click', async () => { if (confirmAction) { try { await confirmAction(); } catch (error: any) { showNotification(`Error: ${error.message}`, 'error'); } } hideConfirmModal(); });
  modalCancelBtn.addEventListener('click', hideConfirmModal);
  confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) { hideConfirmModal(); } });

  // --- Helper to find current period limit ---
  const loadPeriodLimit = async () => {
    try {
        const periods = await getPeriods();
        const { config } = getState();
        if (config && config.currentPeriod) {
            const p = periods.find(per => per.name === config.currentPeriod);
            if (p) currentPeriodLimit = p.endTime;
        }
    } catch (e) { console.error(e); }
  };

  // --- Calculate Time Helper ---
  const getCurrentGameTime = (): { reg: number, add: number } => {
      const { timer } = getState();
      const totalSeconds = timer.seconds;
      const limitSeconds = currentPeriodLimit * 60;
      
      let reg, add;
      if (totalSeconds <= limitSeconds) {
          reg = Math.floor(totalSeconds / 60) + 1;
          add = 0;
      } else {
          reg = currentPeriodLimit;
          add = Math.ceil((totalSeconds - limitSeconds) / 60);
      }
      return { reg, add };
  };


  // --- Updated: Goals Renderer (Supports Goal objects) ---
  const renderGoalList = (listEl: HTMLUListElement, goals: Goal[]) => {
    listEl.innerHTML = '';
    if (goals.length === 0) {
      listEl.innerHTML = `<li class="goal-list-item">No Goals</li>`;
      return;
    }
    
    // Sort by absolute time (reg + add)
    goals.sort((a, b) => (a.regMinute + a.addMinute) - (b.regMinute + b.addMinute));
    
    goals.forEach((goal, index) => {
      const li = document.createElement('li');
      li.className = 'goal-list-item';
      
      const label = goal.isOwnGoal ? "Own Goal" : "Goal";
      // Value to show in input: "90" (if add=0) or "90+5" (if add>0)
      // Actually, for editing, we probably want to edit reg/add separately? 
      // The prompt implies a simple text display or basic input.
      // Let's show two inputs: Reg + Add
      
      li.innerHTML = `
        <div class="goal-item-content">
            <span>${label} @</span>
            <input type="number" class="goal-minute-input reg-input" value="${goal.regMinute}" data-index="${index}" min="1" max="999" style="width: 40px;">
            <span>+</span>
            <input type="number" class="goal-minute-input add-input" value="${goal.addMinute}" data-index="${index}" min="0" max="99" style="width: 40px;">
            <span>'</span>
        </div>
        <button class="goal-delete-btn" data-index="${index}">❌</button>
      `;
      listEl.appendChild(li);
    });

    // Listeners
    listEl.querySelectorAll('.goal-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLButtonElement).dataset.index || '-1', 10);
        if (idx > -1) { goals.splice(idx, 1); renderGoalList(listEl, goals); }
      });
    });
    
    listEl.querySelectorAll('.reg-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.currentTarget as HTMLInputElement;
        const idx = parseInt(target.dataset.index || '-1', 10);
        const val = parseInt(target.value, 10) || 1;
        if (idx > -1) goals[idx].regMinute = val;
      });
    });
    
    listEl.querySelectorAll('.add-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.currentTarget as HTMLInputElement;
        const idx = parseInt(target.dataset.index || '-1', 10);
        const val = parseInt(target.value, 10) || 0;
        if (idx > -1) goals[idx].addMinute = val;
      });
    });
  };

  // --- Cards Renderer (Simple List of Integers) ---
  const renderCardList = (listEl: HTMLUListElement, minutes: number[], type: string) => {
      listEl.innerHTML = '';
      if (minutes.length === 0) { listEl.innerHTML = `<li class="goal-list-item">No ${type}s</li>`; return; }
      minutes.sort((a, b) => a - b);
      minutes.forEach((m, i) => {
          const li = document.createElement('li');
          li.className = 'goal-list-item';
          li.innerHTML = `
            <div class="goal-item-content">
                <span>${type} @</span>
                <input type="number" class="card-minute-input" value="${m}" data-index="${i}" min="1" max="999">
                <span>'</span>
            </div>
            <button class="card-delete-btn" data-index="${i}">❌</button>
          `;
          listEl.appendChild(li);
      });
      
      listEl.querySelectorAll('.card-delete-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
              const idx = parseInt((e.currentTarget as HTMLButtonElement).dataset.index || '-1', 10);
              if (idx > -1) { minutes.splice(idx, 1); renderCardList(listEl, minutes, type); }
          });
      });
      listEl.querySelectorAll('.card-minute-input').forEach(input => {
          input.addEventListener('change', (e) => {
              const idx = parseInt((e.currentTarget as HTMLInputElement).dataset.index || '-1', 10);
              const val = parseInt((e.currentTarget as HTMLInputElement).value, 10) || 1;
              if (idx > -1) minutes[idx] = val;
          });
      });
  };


  // --- Show Edit Modal ---
  const showPlayerEditModal = (player: PlayerConfig, team: 'teamA' | 'teamB') => {
    playerToEdit = player;
    teamToEdit = team;
    
    const { config } = getState();
    if (!config) return;
    
    const teamConfig = config[team];
    const players = teamConfig.players;
    const currentIndex = players.findIndex(p => p.number === player.number);
    
    modalTeamName.textContent = teamConfig.name;
    modalTeamPrimary.style.backgroundColor = teamConfig.colors.primary;
    modalTeamSecondary.style.backgroundColor = teamConfig.colors.secondary;

    const prevPlayer = players[currentIndex - 1];
    const nextPlayer = players[currentIndex + 1];
    if (prevPlayer) { prevPlayerNum.textContent = `#${prevPlayer.number}`; prevPlayerBtn.disabled = false; } else { prevPlayerNum.textContent = ''; prevPlayerBtn.disabled = true; }
    if (nextPlayer) { nextPlayerNum.textContent = `#${nextPlayer.number}`; nextPlayerBtn.disabled = false; } else { nextPlayerNum.textContent = ''; nextPlayerBtn.disabled = true; }

    // Deep copy complex objects
    editGoals = player.goals.map(g => ({ ...g }));
    editYellowCards = [...player.yellowCards];
    editRedCards = [...player.redCards];

    playerEditTitle.textContent = `#${player.number} ${player.name}`;
    editPlayerNumber.value = player.number.toString();
    editPlayerName.value = player.name;
    
    renderGoalList(editGoalsList, editGoals);
    renderCardList(editYellowCardsList, editYellowCards, 'Yellow');
    renderCardList(editRedCardsList, editRedCards, 'Red');
    
    playerEditModal.style.display = 'flex';
  };
  
  const hidePlayerEditModal = () => { playerEditModal.style.display = 'none'; playerToEdit = null; teamToEdit = null; editGoals = []; editYellowCards = []; editRedCards = []; };
  const navigatePlayer = (direction: 'prev' | 'next') => { if (!playerToEdit || !teamToEdit) return; const { config } = getState(); if (!config) return; const players = config[teamToEdit].players; const currentIndex = players.findIndex(p => p.number === playerToEdit!.number); const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1; if (newIndex >= 0 && newIndex < players.length) { showPlayerEditModal(players[newIndex], teamToEdit); } };
  prevPlayerBtn.addEventListener('click', () => navigatePlayer('prev'));
  nextPlayerBtn.addEventListener('click', () => navigatePlayer('next'));

  // --- Add Goal Logic ---
  editAddGoalBtn.addEventListener('click', () => {
    const { reg, add } = getCurrentGameTime();
    editGoals.push({ regMinute: reg, addMinute: add, isOwnGoal: false });
    renderGoalList(editGoalsList, editGoals);
  });

  editAddOwnGoalBtn.addEventListener('click', () => {
      const { reg, add } = getCurrentGameTime();
      editGoals.push({ regMinute: reg, addMinute: add, isOwnGoal: true });
      renderGoalList(editGoalsList, editGoals);
  });

  // --- Add Card Logic ---
  // Note: Cards still use simple integer minutes for now based on previous requirements
  // We will calculate total minutes (reg + add) for simplicity in display if backend expects int
  // Or if backend expects int, we just sum them.
  editAddYellowBtn.addEventListener('click', () => {
    if (editYellowCards.length >= 2) { showNotification('Max 2 yellow cards.', 'error'); return; }
    const { reg, add } = getCurrentGameTime();
    const totalMin = reg + add; 
    editYellowCards.push(totalMin);
    renderCardList(editYellowCardsList, editYellowCards, 'Yellow');
    
    const { isAutoConvertYellowToRedOn } = getState();
    if (editYellowCards.length === 2 && isAutoConvertYellowToRedOn && editRedCards.length < 1) {
      editRedCards.push(totalMin);
      renderCardList(editRedCardsList, editRedCards, 'Red');
      showNotification('2nd yellow auto-added a red card!');
    }
  });

  editAddRedBtn.addEventListener('click', () => {
    if (editRedCards.length >= 1) { showNotification('Max 1 red card.', 'error'); return; }
    const { reg, add } = getCurrentGameTime();
    editRedCards.push(reg + add);
    renderCardList(editRedCardsList, editRedCards, 'Red');
  });
  
  modalEditCancelBtn.addEventListener('click', hidePlayerEditModal);
  modalDeletePlayerBtn.addEventListener('click', () => { if (!playerToEdit || !teamToEdit) return; const player = playerToEdit; const team = teamToEdit; hidePlayerEditModal(); showConfirmModal(`Are you sure you want to delete ${player.name} (#${player.number})?`, async () => { await deletePlayer(team, player.number); showNotification(`${player.name} deleted!`); }); });
  
  // --- SAVE & AUTO-SCORE LOGIC ---
  modalSaveBtn.addEventListener('click', async () => { 
      if (!playerToEdit || !teamToEdit) return; 
      const newNumber = parseInt(editPlayerNumber.value, 10); 
      const newName = editPlayerName.value.trim(); 
      if (isNaN(newNumber) || newNumber < 0 || newNumber > 99) { showNotification('Player number must be between 0 and 99.', 'error'); return; } 
      if (!newName) { showNotification('Player name cannot be empty.', 'error'); return; } 
      
      // 1. Calculate Differences
      const oldRegular = playerToEdit.goals.filter(g => !g.isOwnGoal).length;
      const oldOwn = playerToEdit.goals.filter(g => g.isOwnGoal).length;
      
      const newRegular = editGoals.filter(g => !g.isOwnGoal).length;
      const newOwn = editGoals.filter(g => g.isOwnGoal).length;
      
      const diffRegular = newRegular - oldRegular;
      const diffOwn = newOwn - oldOwn;

      const updatedPlayerData: PlayerConfig = { 
          ...playerToEdit, 
          number: newNumber, 
          name: newName, 
          yellowCards: editYellowCards, 
          redCards: editRedCards, 
          goals: editGoals, // Updated list
      }; 
      
      try { 
          await editPlayer(teamToEdit, playerToEdit.number, updatedPlayerData); 
          showNotification(`Player #${updatedPlayerData.number} ${updatedPlayerData.name} saved!`); 
          
          // 2. Apply Auto-Score based on Diff
          const { config, isAutoAddScoreOn } = getState();
          if (isAutoAddScoreOn && config) {
              // A. Regular Goals -> Add to THIS team
              if (diffRegular !== 0) {
                  const currentScore = config[teamToEdit].score;
                  const newScore = Math.max(0, currentScore + diffRegular);
                  await setScore(teamToEdit, newScore);
                  if (diffRegular > 0) showNotification(`Auto-added ${diffRegular} goal(s) to ${config[teamToEdit].name}!`);
                  else showNotification(`Auto-removed ${Math.abs(diffRegular)} goal(s) from ${config[teamToEdit].name}!`);
              }
              
              // B. Own Goals -> Add to OPPONENT team
              if (diffOwn !== 0) {
                  const opponentTeam = teamToEdit === 'teamA' ? 'teamB' : 'teamA';
                  const opponentScore = config[opponentTeam].score;
                  const newOpScore = Math.max(0, opponentScore + diffOwn);
                  await setScore(opponentTeam, newOpScore);
                  if (diffOwn > 0) showNotification(`Auto-added ${diffOwn} own goal(s) to Opponent!`);
                  else showNotification(`Auto-removed ${Math.abs(diffOwn)} own goal(s) from Opponent!`);
              }
          }

          hidePlayerEditModal(); 
      } catch (error: any) { 
          showNotification(`Error: ${error.message}`, 'error'); 
      } 
  });


  // --- Player List Rendering ---
  const updatePlayerLists = () => {
    const { config } = getState();
    if (!config) return;

    // Team A Stats
    const teamAPlayers = config.teamA.players;
    const totalAGoals = teamAPlayers.reduce((sum, p) => sum + p.goals.filter(g => !g.isOwnGoal).length, 0);
    const totalAYellow = teamAPlayers.reduce((sum, p) => sum + p.yellowCards.length, 0);
    const totalARed = teamAPlayers.reduce((sum, p) => sum + p.redCards.length, 0);
    const totalAOnField = teamAPlayers.filter(p => p.onField).length;
    
    // Opponent Own Goals (B -> A)
    const teamBOwnGoals = config.teamB.players.reduce((sum, p) => sum + p.goals.filter(g => g.isOwnGoal).length, 0);
    const displayScoreA = teamBOwnGoals > 0 ? `${totalAGoals} (+${teamBOwnGoals} O.G.)` : `${totalAGoals}`;

    playerTotalsA.innerHTML = `
      <span class="player-total-item">⚽ Goals: ${displayScoreA}</span>
      <span class="player-total-item">🟨 Cards: ${totalAYellow}</span>
      <span class="player-total-item">🟥 Cards: ${totalARed}</span>
      <span class="player-total-item">✅ On Field: ${totalAOnField}</span>
      <span class="player-total-item">👥 Total: ${teamAPlayers.length}</span>
    `;

    // Team B Stats
    const teamBPlayers = config.teamB.players;
    const totalBGoals = teamBPlayers.reduce((sum, p) => sum + p.goals.filter(g => !g.isOwnGoal).length, 0);
    const totalBYellow = teamBPlayers.reduce((sum, p) => sum + p.yellowCards.length, 0);
    const totalBRed = teamBPlayers.reduce((sum, p) => sum + p.redCards.length, 0);
    const totalBOnField = teamBPlayers.filter(p => p.onField).length;
    
    // Opponent Own Goals (A -> B)
    const teamAOwnGoals = teamAPlayers.reduce((sum, p) => sum + p.goals.filter(g => g.isOwnGoal).length, 0);
    const displayScoreB = teamAOwnGoals > 0 ? `${totalBGoals} (+${teamAOwnGoals} O.G.)` : `${totalBGoals}`;

    playerTotalsB.innerHTML = `
      <span class="player-total-item">⚽ Goals: ${displayScoreB}</span>
      <span class="player-total-item">🟨 Cards: ${totalBYellow}</span>
      <span class="player-total-item">🟥 Cards: ${totalBRed}</span>
      <span class="player-total-item">✅ On Field: ${totalBOnField}</span>
      <span class="player-total-item">👥 Total: ${teamBPlayers.length}</span>
    `;

    // Tables
    const renderRows = (team: 'teamA' | 'teamB', players: PlayerConfig[]) => {
        if (players.length === 0) return '<p>No players on roster.</p>';
        return `
        <table class="player-list-table">
          <thead><tr><th>#</th><th>Name</th><th>⚽</th><th>🟨</th><th>🟥</th><th>✅</th><th>Actions</th></tr></thead>
          <tbody>
            ${players.map(player => `
              <tr>
                <td>${player.number}</td>
                <td>${player.name}</td>
                <td>${player.goals.filter(g => !g.isOwnGoal).length}</td>
                <td>${player.yellowCards.length}</td>
                <td>${player.redCards.length}</td>
                <td><input type="checkbox" class="on-field-checkbox" data-team="${team}" data-number="${player.number}" ${player.onField ? 'checked' : ''}></td>
                <td>
                  <div class="player-action-cell">
                    <button class="player-action-btn player-goal-btn" data-team="${team}" data-number="${player.number}">⚽</button>
                    <button class="player-action-btn player-yellow-btn" data-team="${team}" data-number="${player.number}">🟨</button>
                    <button class="player-action-btn player-red-btn" data-team="${team}" data-number="${player.number}">🟥</button>
                    <button class="player-action-btn player-edit-btn" data-team="${team}" data-number="${player.number}">✏️</button>
                    <button class="player-action-btn player-delete-btn" data-team="${team}" data-number="${player.number}">🗑️</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`;
    };
    
    playerListA.innerHTML = renderRows('teamA', config.teamA.players);
    playerListB.innerHTML = renderRows('teamB', config.teamB.players);
    
    // Attach listeners
    attachTableListeners(container, config);
  };
  
  // Extracted listener attachment to keep things clean
  const attachTableListeners = (container: HTMLElement, config: any) => {
      container.querySelectorAll('.on-field-checkbox').forEach(box => { box.addEventListener('change', async (e) => { const target = e.currentTarget as HTMLInputElement; const team = target.dataset.team as 'teamA' | 'teamB'; const number = parseInt(target.dataset.number || '', 10); if (team && !isNaN(number)) { await toggleOnField(team, number); } }); });
      container.querySelectorAll('.player-delete-btn').forEach(btn => { btn.addEventListener('click', (e) => { const target = e.currentTarget as HTMLButtonElement; const team = target.dataset.team as 'teamA' | 'teamB'; const number = parseInt(target.dataset.number || '', 10); if (!team || isNaN(number)) return; const player = (team === 'teamA' ? config.teamA.players : config.teamB.players).find((p: PlayerConfig) => p.number === number); showConfirmModal(`Are you sure you want to delete ${player.name}?`, async () => { await deletePlayer(team, number); showNotification(`${player.name} deleted!`); }); }); });
      container.querySelectorAll('.player-edit-btn').forEach(btn => { btn.addEventListener('click', (e) => { const target = e.currentTarget as HTMLButtonElement; const team = target.dataset.team as 'teamA' | 'teamB'; const number = parseInt(target.dataset.number || '', 10); if (!team || isNaN(number)) return; const player = (team === 'teamA' ? config.teamA.players : config.teamB.players).find((p: PlayerConfig) => p.number === number); if (player) showPlayerEditModal(player, team); }); });
      
      // Quick Actions
      container.querySelectorAll('.player-goal-btn').forEach(btn => { btn.addEventListener('click', async (e) => { 
          const target = e.currentTarget as HTMLButtonElement; const team = target.dataset.team as 'teamA' | 'teamB'; const number = parseInt(target.dataset.number || '', 10);
          const { timer } = getState(); const { reg, add } = getCurrentGameTime(); // use helper!
          await addGoal(team, number, reg, add, false);
          showNotification(`Goal given to #${number}`);
      }); });
      container.querySelectorAll('.player-yellow-btn').forEach(btn => { btn.addEventListener('click', async (e) => { 
          const target = e.currentTarget as HTMLButtonElement; const team = target.dataset.team as 'teamA' | 'teamB'; const number = parseInt(target.dataset.number || '', 10);
          const { timer } = getState(); const { reg, add } = getCurrentGameTime(); const total = reg + add; 
          await addCard(team, number, 'yellow', total);
          showNotification(`Yellow card given to #${number}`);
      }); });
      container.querySelectorAll('.player-red-btn').forEach(btn => { btn.addEventListener('click', async (e) => { 
          const target = e.currentTarget as HTMLButtonElement; const team = target.dataset.team as 'teamA' | 'teamB'; const number = parseInt(target.dataset.number || '', 10);
          const { timer } = getState(); const { reg, add } = getCurrentGameTime(); const total = reg + add; 
          await addCard(team, number, 'red', total);
          showNotification(`Red card given to #${number}`);
      }); });
  };
  

  // --- Add Event Listeners ---
  const numberInputHandler = (e: Event) => { const target = e.target as HTMLInputElement; target.value = target.value.replace(/[^0-9]/g, ''); if (target.value.length > 2) { target.value = target.value.slice(0, 2); } if (target.value === '') return; if (parseInt(target.value, 10) > 99) { target.value = '99'; } if (parseInt(target.value, 10) < 0) { target.value = '0'; } };
  teamAPlayerNum.addEventListener('input', numberInputHandler); teamBPlayerNum.addEventListener('input', numberInputHandler); editPlayerNumber.addEventListener('input', numberInputHandler);
  teamAFields.forEach(([input, label]) => { if (input) { input.addEventListener('input', () => { isTeamAUnsaved = true; if (label) label.style.fontStyle = 'italic'; updateUnsavedIndicators(); }); } });
  teamBFields.forEach(([input, label]) => { if (input) { input.addEventListener('input', () => { isTeamBUnsaved = true; if (label) label.style.fontStyle = 'italic'; updateUnsavedIndicators(); }); } });
  container.querySelectorAll("input[maxlength='4']").forEach((input) => { input.addEventListener('input', (e) => { const target = e.target as HTMLButtonElement; target.value = target.value.toUpperCase(); }); });
  container.querySelector('#sync-a')?.addEventListener('click', (e) => { e.preventDefault(); if (teamAPrimary && teamASecondary) { teamASecondary.value = teamAPrimary.value; isTeamAUnsaved = true; if (teamASecondaryLabel) teamASecondaryLabel.style.fontStyle = 'italic'; updateUnsavedIndicators(); } });
  container.querySelector('#sync-b')?.addEventListener('click', (e) => { e.preventDefault(); if (teamBPrimary && teamBSecondary) { teamBSecondary.value = teamBPrimary.value; isTeamBUnsaved = true; if (teamBSecondaryLabel) teamBSecondaryLabel.style.fontStyle = 'italic'; updateUnsavedIndicators(); } });
  container.querySelector('#save-team-info')?.addEventListener('click', async () => { try { const teamAInfo = { name: teamAName.value, abbreviation: teamAAbbr.value }; const teamBInfo = { name: teamBName.value, abbreviation: teamBAbbr.value }; await saveTeamInfo(teamAInfo, teamBInfo); const teamAColors = { primary: teamAPrimary.value, secondary: teamASecondary.value }; const teamBColors = { primary: teamBPrimary.value, secondary: teamBSecondary.value }; await saveColors(teamAColors, teamBColors); isTeamAUnsaved = false; isTeamBUnsaved = false; updateUnsavedIndicators(); teamAFields.forEach(([_, label]) => { if (label) label.style.fontStyle = 'normal'; }); teamBFields.forEach(([_, label]) => { if (label) label.style.fontStyle = 'normal'; }); showNotification('Team info and colors saved!'); } catch (error: any) { showNotification(`Error saving: ${error.message}`, 'error'); } });
  addPlayerAButton.addEventListener('click', async () => { const numberVal = teamAPlayerNum.value; const nameVal = teamAPlayerName.value.trim(); if (!numberVal || !nameVal) { showNotification('Player number and name are required.', 'error'); return; } const playerNumber = parseInt(numberVal, 10); if (isNaN(playerNumber) || playerNumber < 0 || playerNumber > 99) { showNotification('Player number must be between 0 and 99.', 'error'); return; } const { config } = getState(); const existingPlayer = config?.teamA.players.find(p => p.number === playerNumber); if (existingPlayer) { showConfirmModal( `Player #${playerNumber} (${existingPlayer.name}) already exists. Do you want to replace them with ${nameVal}? This will reset their stats.`, async () => { await replacePlayer('teamA', playerNumber, nameVal); showNotification(`Player #${playerNumber} (${nameVal}) updated and stats reset!`); teamAPlayerNum.value = ''; teamAPlayerName.value = ''; } ); } else { try { await addPlayer('teamA', playerNumber, nameVal); showNotification(`Player #${playerNumber} ${nameVal} added to Team A!`); teamAPlayerNum.value = ''; teamAPlayerName.value = ''; } catch (error: any) { showNotification(`Error: ${error.message}`, 'error'); } } });
  addPlayerBButton.addEventListener('click', async () => { const numberVal = teamBPlayerNum.value; const nameVal = teamBPlayerName.value.trim(); if (!numberVal || !nameVal) { showNotification('Player number and name are required.', 'error'); return; } const playerNumber = parseInt(numberVal, 10); if (isNaN(playerNumber) || playerNumber < 0 || playerNumber > 99) { showNotification('Player number must be between 0 and 99.', 'error'); return; } const { config } = getState(); const existingPlayer = config?.teamB.players.find(p => p.number === playerNumber); if (existingPlayer) { showConfirmModal( `Player #${playerNumber} (${existingPlayer.name}) already exists. Do you want to replace them with ${nameVal}? This will reset their stats.`, async () => { await replacePlayer('teamB', playerNumber, nameVal); showNotification(`Player #${playerNumber} (${nameVal}) updated and stats reset!`); teamBPlayerNum.value = ''; teamBPlayerName.value = ''; } ); } else { try { await addPlayer('teamB', playerNumber, nameVal); showNotification(`Player #${playerNumber} ${nameVal} added to Team B!`); teamBPlayerNum.value = ''; teamBPlayerName.value = ''; } catch (error: any) { showNotification(`Error: ${error.message}`, 'error'); } } });
  deleteListAButton.addEventListener('click', () => { const { config } = getState(); const teamName = config?.teamA.name ?? 'Team A'; const teamAbbr = config?.teamA.abbreviation ?? 'TMA'; showConfirmModal(`Are you sure you want to delete the entire player list for ${teamName} (${teamAbbr})?`, async () => { await clearPlayerList('teamA'); showNotification('Team A player list cleared!'); }); });
  deleteListBButton.addEventListener('click', () => { const { config } = getState(); const teamName = config?.teamB.name ?? 'Team B'; const teamAbbr = config?.teamB.abbreviation ?? 'TMB'; showConfirmModal(`Are you sure you want to delete the entire player list for ${teamName} (${teamAbbr})?`, async () => { await clearPlayerList('teamB'); showNotification('Team B player list cleared!'); }); });
  resetStatsAButton.addEventListener('click', () => { const { config } = getState(); const teamName = config?.teamA.name ?? 'Team A'; const teamAbbr = config?.teamA.abbreviation ?? 'TMA'; showConfirmModal(`Are you sure you want to reset all stats (goals, cards, on-field) for ${teamName} (${teamAbbr})?`, async () => { await resetTeamStats('teamA'); showNotification('Team A stats reset!'); }); });
  resetStatsBButton.addEventListener('click', () => { const { config } = getState(); const teamName = config?.teamB.name ?? 'Team B'; const teamAbbr = config?.teamB.abbreviation ?? 'TMB'; showConfirmModal(`Are you sure you want to reset all stats (goals, cards, on-field) for ${teamName} (${teamAbbr})?`, async () => { await resetTeamStats('teamB'); showNotification('Team B stats reset!'); }); });

  loadPeriodLimit();

  const onStateUpdate = () => {
    updatePlayerLists();
    loadPeriodLimit(); // Refresh limit if periods changed
  };
  
  subscribe(onStateUpdate); 
  updatePlayerLists(); 

  return () => {
    unsubscribe(onStateUpdate); 
  };
}