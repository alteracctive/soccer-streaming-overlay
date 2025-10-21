import { getState, saveColors } from '../stateManager';
import { showNotification } from '../notification'; // *** IMPORT ***

export function render(container: HTMLElement) {
  // ... (HTML rendering is unchanged) ...
  const { config } = getState();

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      
      <div class="card">
        <h4>Team A Colors</h4>
        <div class="form-group">
          <label for="team-a-primary">Primary Color</label>
          <input type="color" id="team-a-primary" value="${
            config?.teamA.colors.primary ?? '#FF0000'
          }">
        </div>
        <div class="form-group">
          <label for="team-a-secondary">Secondary Color</label>
          <input type="color" id="team-a-secondary" value="${
            config?.teamA.colors.secondary ?? '#FFFFFF'
          }">
        </div>
        <button id="sync-a" class="btn-secondary">Use Primary as Secondary</button>
      </div>

      <div class="card">
        <h4>Team B Colors</h4>
        <div class="form-group">
          <label for="team-b-primary">Primary Color</label>
          <input type="color" id="team-b-primary" value="${
            config?.teamB.colors.primary ?? '#0000FF'
          }">
        </div>
        <div class="form-group">
          <label for="team-b-secondary">Secondary Color</label>
          <input type="color" id="team-b-secondary" value="${
            config?.teamB.colors.secondary ?? '#FFFFFF'
          }">
        </div>
        <button id="sync-b" class="btn-secondary">Use Primary as Secondary</button>
      </div>

    </div>
    <button id="save-colors" style="margin-top: 16px;">Save Colors</button>
  `;

  // ... (Element references and sync buttons are unchanged) ...
  const teamAPrimary = container.querySelector(
    '#team-a-primary',
  ) as HTMLInputElement;
  const teamASecondary = container.querySelector(
    '#team-a-secondary',
  ) as HTMLInputElement;
  const teamBPrimary = container.querySelector(
    '#team-b-primary',
  ) as HTMLInputElement;
  const teamBSecondary = container.querySelector(
    '#team-b-secondary',
  ) as HTMLInputElement;

  container.querySelector('#sync-a')?.addEventListener('click', () => {
    teamASecondary.value = teamAPrimary.value;
  });

  container.querySelector('#sync-b')?.addEventListener('click', () => {
    teamBSecondary.value = teamBPrimary.value;
  });

  // Save button
  container.querySelector('#save-colors')?.addEventListener('click', async () => {
    const teamA = {
      primary: teamAPrimary.value,
      secondary: teamASecondary.value,
    };
    const teamB = {
      primary: teamBPrimary.value,
      secondary: teamBSecondary.value,
    };

    await saveColors(teamA, teamB);
    showNotification('Colors saved!'); // *** UPDATED ***
  });
}