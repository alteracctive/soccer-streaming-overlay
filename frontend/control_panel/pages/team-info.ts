import { getState, saveTeamInfo } from '../stateManager';
import { showNotification } from '../notification';

export function render(container: HTMLElement) {
  const { config } = getState();

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      
      <div class="card">
        <h4>Team A Info</h4>
        <div class="form-group">
          <label for="team-a-name">Team Name</label>
          <input type="text" id="team-a-name" value="${
            config?.teamA.name ?? ''
          }">
        </div>
        <div class="form-group">
          <label for="team-a-abbr">Abbreviation (Max 4)</label>
          <input type="text" id="team-a-abbr" maxlength="4" value="${
            config?.teamA.abbreviation ?? ''
          }">
        </div>
      </div>

      <div class="card">
        <h4>Team B Info</h4>
        <div class="form-group">
          <label for="team-b-name">Team Name</label>
          <input type="text" id="team-b-name" value="${
            config?.teamB.name ?? ''
          }">
        </div>
        <div class="form-group">
          <label for="team-b-abbr">Abbreviation (Max 4)</label>
          <input type="text" id="team-b-abbr" maxlength="4" value="${
            config?.teamB.abbreviation ?? ''
          }">
        </div>
      </div>

    </div>
    <button id="save-team-info" style="margin-top: 16px;">Save Info</button>
  `;

  // --- Get Element References ---
  const teamAName = container.querySelector('#team-a-name') as HTMLInputElement;
  const teamAAbbr = container.querySelector('#team-a-abbr') as HTMLInputElement;
  const teamBName = container.querySelector('#team-b-name') as HTMLInputElement;
  // *** FIX: Changed selector from '#team-a-abbr' to '#team-b-abbr' ***
  const teamBAbbr = container.querySelector(
    '#team-b-abbr',
  ) as HTMLInputElement;

  // --- Add Event Listeners ---
  container.querySelectorAll("input[maxlength='4']").forEach((input) => {
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      target.value = target.value.toUpperCase();
    });
  });

  container
    .querySelector('#save-team-info')
    ?.addEventListener('click', async () => {
      const teamA = {
        name: teamAName.value,
        abbreviation: teamAAbbr.value,
      };
      const teamB = {
        name: teamBName.value,
        abbreviation: teamBAbbr.value,
      };

      await saveTeamInfo(teamA, teamB);
      showNotification('Team info saved!');
    });
}