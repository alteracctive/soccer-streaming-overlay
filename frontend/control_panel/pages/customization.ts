import {
  getState,
  saveColors,
  saveScoreboardStyle,
} from '../stateManager';
import { showNotification } from '../notification';

export function render(container: HTMLElement) {
  const { config, scoreboardStyle } = getState();

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">

      <div class="card">
         <h3>Teams</h3>
         <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px; align-items: start; margin-top: 10px;">
            <div> <h4>Team A Colors</h4>
                <div class="color-picker-row"> <label for="team-a-primary">Primary Color</label> <input type="color" id="team-a-primary" value="${ config?.teamA.colors.primary ?? '#FF0000' }"> </div>
                <div class="color-picker-row"> <label for="team-a-secondary">Secondary Color</label> <input type="color" id="team-a-secondary" value="${ config?.teamA.colors.secondary ?? '#FFFFFF' }"> </div>
                <button id="sync-a" class="btn-secondary" style="margin-top: 12px;">Use Primary as Secondary</button>
            </div>
            <div style="width: 1px; background-color: var(--border-color); height: 100%; align-self: stretch;"></div> <div> <h4>Team B Colors</h4>
                <div class="color-picker-row"> <label for="team-b-primary">Primary Color</label> <input type="color" id="team-b-primary" value="${ config?.teamB.colors.primary ?? '#0000FF' }"> </div>
                <div class="color-picker-row"> <label for="team-b-secondary">Secondary Color</label> <input type="color" id="team-b-secondary" value="${ config?.teamB.colors.secondary ?? '#FFFFFF' }"> </div>
                <button id="sync-b" class="btn-secondary" style="margin-top: 12px;">Use Primary as Secondary</button>
            </div>
         </div>
         <button id="save-team-colors" style="margin-top: 20px;">Save Team Colors</button>
      </div>


      <div class="card">
        <h3>Scoreboard</h3>
        <div style="margin-top: 10px;">
          <div class="color-picker-row">
             <label for="sb-color-primary">Box Color (Main)</label>
             <input type="color" id="sb-color-primary" value="${ scoreboardStyle?.primary ?? '#000000' }">
          </div>
          <div class="color-picker-row">
             <label for="sb-color-secondary">Text Color (Primary)</label>
             <input type="color" id="sb-color-secondary" value="${ scoreboardStyle?.secondary ?? '#FFFFFF' }">
          </div>

          <div class="slider-row" style="margin-top: 15px;">
            <div class="form-group">
              <label for="sb-opacity" style="display: flex; justify-content: space-between;">
                Opacity
                <span id="sb-opacity-value">${scoreboardStyle?.opacity ?? 75}%</span>
              </label>
              <input type="range" id="sb-opacity" min="50" max="100" value="${scoreboardStyle?.opacity ?? 75}" style="width: 100%;">
            </div>

            <div class="form-group">
              <label for="sb-scale" style="display: flex; justify-content: space-between;">
                Scale
                <span id="sb-scale-value">${scoreboardStyle?.scale ?? 100}%</span>
              </label>
              <input type="range" id="sb-scale" min="50" max="150" value="${scoreboardStyle?.scale ?? 100}" style="width: 100%;">
            </div>
          </div>
          </div>
        <button id="save-scoreboard-settings" style="margin-top: 12px;">Save Scoreboard</button>
      </div>
    </div>
  `;

  // --- Get Element References ---
  const teamAPrimary = container.querySelector('#team-a-primary') as HTMLInputElement;
  const teamASecondary = container.querySelector('#team-a-secondary') as HTMLInputElement;
  const teamBPrimary = container.querySelector('#team-b-primary') as HTMLInputElement;
  const teamBSecondary = container.querySelector('#team-b-secondary') as HTMLInputElement;
  const sbPrimaryInput = container.querySelector('#sb-color-primary') as HTMLInputElement;
  const sbSecondaryInput = container.querySelector('#sb-color-secondary') as HTMLInputElement;
  const sbOpacitySlider = container.querySelector('#sb-opacity') as HTMLInputElement;
  const sbOpacityValueSpan = container.querySelector('#sb-opacity-value') as HTMLSpanElement;
  const sbScaleSlider = container.querySelector('#sb-scale') as HTMLInputElement;
  const sbScaleValueSpan = container.querySelector('#sb-scale-value') as HTMLSpanElement;

  // --- Add Event Listeners ---

  // Sync Team A Secondary Color
  container.querySelector('#sync-a')?.addEventListener('click', () => {
    if (teamAPrimary && teamASecondary) {
        teamASecondary.value = teamAPrimary.value;
    }
  });

  // Sync Team B Secondary Color
  container.querySelector('#sync-b')?.addEventListener('click', () => {
    if (teamBPrimary && teamBSecondary) {
        teamBSecondary.value = teamBPrimary.value;
    }
  });

  // Save Team Colors Button
  container.querySelector('#save-team-colors')?.addEventListener('click', async () => {
      if (!teamAPrimary || !teamASecondary || !teamBPrimary || !teamBSecondary) {
          showNotification("Error finding team color pickers.", "error");
          return;
      }
      const teamA = { primary: teamAPrimary.value, secondary: teamASecondary.value };
      const teamB = { primary: teamBPrimary.value, secondary: teamBSecondary.value };
      try {
        await saveColors(teamA, teamB);
        showNotification('Team colors saved!');
      } catch (error: any) {
        showNotification(`Error: ${error.message}`, 'error');
      }
    });

  // Update Opacity Display Span when Slider Moves
  if (sbOpacitySlider && sbOpacityValueSpan) {
      sbOpacitySlider.addEventListener('input', () => {
          sbOpacityValueSpan.textContent = `${sbOpacitySlider.value}%`;
      });
  }

  // Update Scale Display Span when Slider Moves
  if (sbScaleSlider && sbScaleValueSpan) {
      sbScaleSlider.addEventListener('input', () => {
          sbScaleValueSpan.textContent = `${sbScaleSlider.value}%`;
      });
  }

  // Save Scoreboard Settings Button
  container.querySelector('#save-scoreboard-settings')?.addEventListener('click', async () => {
      if (!sbPrimaryInput || !sbSecondaryInput || !sbOpacitySlider || !sbScaleSlider) {
           showNotification('Error finding scoreboard setting inputs.', 'error');
           return;
      }
      try {
        await saveScoreboardStyle({
          primary: sbPrimaryInput.value,
          secondary: sbSecondaryInput.value,
          opacity: parseInt(sbOpacitySlider.value, 10),
          scale: parseInt(sbScaleSlider.value, 10),
        });
        showNotification('Scoreboard settings saved!');
      } catch (error: any) {
        showNotification(`Error: ${error.message}`, 'error');
      }
    });
}