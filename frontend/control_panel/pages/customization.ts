// frontend/control_panel/pages/customization.ts
import {
  getState,
  saveScoreboardStyle,
} from '../stateManager';
import { showNotification } from '../notification';

export function render(container: HTMLElement) {
  const { scoreboardStyle } = getState();

  container.innerHTML = `
    <style>
      .unsaved-indicator {
        opacity: 0.7;
        font-weight: normal;
        font-size: 0.8em;
        margin-left: 8px;
        font-style: italic;
      }
    </style>

    <div style="display: flex; flex-direction: column; gap: 16px;">

      <div class="card">
        <h3>Scoreboard <span id="unsaved-scoreboard" class="unsaved-indicator"></span></h3>
        <div style="margin-top: 10px;">
          <div class="color-picker-row">
             <label for="sb-color-primary">Box Color (Main)</label>
             <input type="color" id="sb-color-primary" value="${
               scoreboardStyle?.primary ?? '#000000'
             }">
          </div>
          <div class="color-picker-row">
             <label for="sb-color-secondary">Text Color (Primary)</label>
             <input type="color" id="sb-color-secondary" value="${
               scoreboardStyle?.secondary ?? '#FFFFFF'
             }">
          </div>

          <div class="slider-row" style="margin-top: 15px;">
            <div class="form-group">
              <label for="sb-opacity" style="display: flex; justify-content: space-between;">
                Opacity
                <span id="sb-opacity-value">${
                  scoreboardStyle?.opacity ?? 75
                }%</span>
              </label>
              <input type="range" id="sb-opacity" min="50" max="100" value="${
                scoreboardStyle?.opacity ?? 75
              }" style="width: 100%;">
            </div>

            <div class="form-group">
              <label for="sb-scale" style="display: flex; justify-content: space-between;">
                Scale
                <span id="sb-scale-value">${
                  scoreboardStyle?.scale ?? 100
                }%</span>
              </label>
              <input type="range" id="sb-scale" min="50" max="150" value="${
                scoreboardStyle?.scale ?? 100
              }" style="width: 100%;">
            </div>
          </div>
          </div>
        <button id="save-scoreboard-settings" style="margin-top: 12px;">Save Scoreboard</button>
      </div>
    </div>
  `;

  // --- Local State for Unsaved Data ---
  let isScoreboardUnsaved = false;

  // --- Get Element References ---
  // Inputs
  const sbPrimaryInput = container.querySelector(
    '#sb-color-primary',
  ) as HTMLInputElement;
  const sbSecondaryInput = container.querySelector(
    '#sb-color-secondary',
  ) as HTMLInputElement;
  const sbOpacitySlider = container.querySelector(
    '#sb-opacity',
  ) as HTMLInputElement;
  const sbScaleSlider = container.querySelector(
    '#sb-scale',
  ) as HTMLInputElement;
  
  // Labels
  const sbPrimaryLabel = container.querySelector('label[for="sb-color-primary"]') as HTMLLabelElement;
  const sbSecondaryLabel = container.querySelector('label[for="sb-color-secondary"]') as HTMLLabelElement;
  const sbOpacityLabel = container.querySelector('label[for="sb-opacity"]') as HTMLLabelElement;
  const sbScaleLabel = container.querySelector('label[for="sb-scale"]') as HTMLLabelElement;

  // Span Indicators
  const sbOpacityValueSpan = container.querySelector(
    '#sb-opacity-value',
  ) as HTMLSpanElement;
  const sbScaleValueSpan = container.querySelector(
    '#sb-scale-value',
  ) as HTMLSpanElement;
  const unsavedScoreboard = container.querySelector(
    '#unsaved-scoreboard',
  ) as HTMLSpanElement;
  
  // Group fields and labels
  const scoreboardFields: [HTMLInputElement, HTMLLabelElement][] = [
    [sbPrimaryInput, sbPrimaryLabel],
    [sbSecondaryInput, sbSecondaryLabel],
    [sbOpacitySlider, sbOpacityLabel],
    [sbScaleSlider, sbScaleLabel]
  ];
  
  // --- Helper Function ---
  const updateUnsavedIndicator = () => {
    if (unsavedScoreboard) {
      unsavedScoreboard.textContent = isScoreboardUnsaved ? '(unsaved data)' : '';
    }
  };


  // --- Add Event Listeners ---

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
  
  // Add 'input' listeners to all fields
  scoreboardFields.forEach(([input, label]) => {
    if (input) {
      input.addEventListener('input', () => {
        isScoreboardUnsaved = true;
        if (label) label.style.fontStyle = 'italic';
        updateUnsavedIndicator();
      });
    }
  });


  // Save Scoreboard Settings Button
  container
    .querySelector('#save-scoreboard-settings')
    ?.addEventListener('click', async () => {
      if (
        !sbPrimaryInput ||
        !sbSecondaryInput ||
        !sbOpacitySlider ||
        !sbScaleSlider
      ) {
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
        
        // Reset unsaved state
        isScoreboardUnsaved = false;
        updateUnsavedIndicator();
        scoreboardFields.forEach(([_, label]) => {
          if (label) label.style.fontStyle = 'normal';
        });

        showNotification('Scoreboard settings saved!');
      } catch (error: any) {
        showNotification(`Error: ${error.message}`, 'error');
      }
    });
}