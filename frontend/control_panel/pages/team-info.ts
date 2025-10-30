// frontend/control_panel/pages/team-info.ts
import { getState, saveTeamInfo, saveColors } from '../stateManager';
import { showNotification } from '../notification';

export function render(container: HTMLElement) {
  const { config } = getState();

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      
      <div class="card">
        <h4>Team A Info</h4>
        <div class="inline-form-group">
          <div class="form-group" style="flex-grow: 1;">
            <label for="team-a-name">Team Name</label>
            <input type="text" id="team-a-name" value="${
              config?.teamA.name ?? ''
            }">
          </div>
          <div class="form-group" style="width: 120px;">
            <label for="team-a-abbr">Abbreviation</label>
            <input type="text" id="team-a-abbr" maxlength="4" value="${
              config?.teamA.abbreviation ?? ''
            }">
          </div>
        </div>

        <h5 style="margin-top: 16px; margin-bottom: 8px; border-top: 1px solid var(--border-color); padding-top: 12px;">Team A Colors</h5>
        <div class="color-picker-row">
          <label for="team-a-primary">Primary Color</label>
          <input type="color" id="team-a-primary" value="${
            config?.teamA.colors.primary ?? '#FF0000'
          }">
        </div>
        <div class="color-picker-row">
          <label for="team-a-secondary">Secondary Color</label>
          <input type="color" id="team-a-secondary" value="${
            config?.teamA.colors.secondary ?? '#FFFFFF'
          }">
        </div>
        <button id="sync-a" class="btn-secondary" style="margin-top: 12px; width: 100%;">Use Primary as Secondary</button>
      </div>

      <div class="card">
        <h4>Team B Info</h4>
        <div class="inline-form-group">
          <div class="form-group" style="flex-grow: 1;">
            <label for="team-b-name">Team Name</label>
            <input type="text" id="team-b-name" value="${
              config?.teamB.name ?? ''
            }">
          </div>
          <div class="form-group" style="width: 120px;">
            <label for="team-b-abbr">Abbreviation</label>
            <input type="text" id="team-b-abbr" maxlength="4" value="${
              config?.teamB.abbreviation ?? ''
            }">
          </div>
        </div>

        <h5 style="margin-top: 16px; margin-bottom: 8px; border-top: 1px solid var(--border-color); padding-top: 12px;">Team B Colors</h5>
        <div class="color-picker-row">
          <label for="team-b-primary">Primary Color</label>
          <input type="color" id="team-b-primary" value="${
            config?.teamB.colors.primary ?? '#0000FF'
          }">
        </div>
        <div class="color-picker-row">
          <label for="team-b-secondary">Secondary Color</label>
          <input type="color" id="team-b-secondary" value="${
            config?.teamB.colors.secondary ?? '#FFFFFF'
          }">
        </div>
        <button id="sync-b" class="btn-secondary" style="margin-top: 12px; width: 100%;">Use Primary as Secondary</button>
      </div>

    </div>
    <button id="save-team-info" style="margin-top: 16px;">Save Team Info</button>
  `;

  // --- Get Element References ---
  // Info
  const teamAName = container.querySelector('#team-a-name') as HTMLInputElement;
  const teamAAbbr = container.querySelector('#team-a-abbr') as HTMLInputElement;
  const teamBName = container.querySelector('#team-b-name') as HTMLInputElement;
  const teamBAbbr = container.querySelector(
    '#team-b-abbr',
  ) as HTMLInputElement;

  // Colors
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

  // --- Add Event Listeners ---
  // Abbreviation formatting
  container.querySelectorAll("input[maxlength='4']").forEach((input) => {
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      target.value = target.value.toUpperCase();
    });
  });

  // Sync Team A Secondary Color
  container.querySelector('#sync-a')?.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent form submission if it was inside a form
    if (teamAPrimary && teamASecondary) {
      teamASecondary.value = teamAPrimary.value;
    }
  });

  // Sync Team B Secondary Color
  container.querySelector('#sync-b')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (teamBPrimary && teamBSecondary) {
      teamBSecondary.value = teamBPrimary.value;
    }
  });

  // Main Save Button
  container
    .querySelector('#save-team-info')
    ?.addEventListener('click', async () => {
      try {
        // 1. Save Names and Abbreviations
        const teamAInfo = {
          name: teamAName.value,
          abbreviation: teamAAbbr.value,
        };
        const teamBInfo = {
          name: teamBName.value,
          abbreviation: teamBAbbr.value,
        };
        await saveTeamInfo(teamAInfo, teamBInfo);

        // 2. Save Colors
        const teamAColors = {
          primary: teamAPrimary.value,
          secondary: teamASecondary.value,
        };
        const teamBColors = {
          primary: teamBPrimary.value,
          secondary: teamBSecondary.value,
        };
        await saveColors(teamAColors, teamBColors);

        // 3. Show notification
        showNotification('Team info and colors saved!');
      } catch (error: any) {
        showNotification(`Error saving: ${error.message}`, 'error');
      }
    });
}