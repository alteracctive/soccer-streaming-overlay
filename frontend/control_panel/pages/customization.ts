// frontend/control_panel/pages/customization.ts
import {
  getState,
  saveScoreboardStyle,
  saveLayout,
  saveMatchInfo,
  toggleMatchInfoVisibility,
  subscribe,
  unsubscribe,
  type ScoreboardStyleOnly,
  type LayoutConfig
} from '../stateManager';
import { showNotification } from '../notification';

export function render(container: HTMLElement) {
  const { scoreboardStyle, isMatchInfoVisible } = getState();

  container.innerHTML = `
    <style>
      .unsaved-indicator {
        opacity: 0.7;
        font-weight: normal;
        font-size: 0.8em;
        margin-left: 8px;
        font-style: italic;
      }
      .switch-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .switch-toggle label {
        margin-bottom: 0;
        font-weight: 500;
      }
      .switch-toggle .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 28px;
      }
      .switch-toggle .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .switch-toggle .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 28px;
      }
      .switch-toggle .slider:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      .switch-toggle input:checked + .slider {
        background-color: var(--green);
      }
      .switch-toggle input:focus + .slider {
        box-shadow: 0 0 1px var(--green);
      }
      .switch-toggle input:checked + .slider:before {
        transform: translateX(22px);
      }
    </style>

    <div style="display: flex; flex-direction: column; gap: 16px;">

      <div class="card">
        <h3>Scoreboard Style <span id="unsaved-style" class="unsaved-indicator"></span></h3>
        <div style="margin-top: 10px;">
          <div class="color-picker-row">
             <label id="sb-color-primary-label" for="sb-color-primary">Box Background Color</label>
             <input type="color" id="sb-color-primary" value="${
               scoreboardStyle?.primary ?? '#000000'
             }">
          </div>
          <div class="color-picker-row">
             <label id="sb-color-secondary-label" for="sb-color-secondary">Main Text Color</label>
             <input type="color" id="sb-color-secondary" value="${
               scoreboardStyle?.secondary ?? '#FFFFFF'
             }">
          </div>
          <div class="color-picker-row">
             <label id="sb-color-tertiary-label" for="sb-color-tertiary">Alternative Text Color</label>
             <input type="color" id="sb-color-tertiary" value="${
               scoreboardStyle?.tertiary ?? '#ffd700'
             }">
          </div>

          <div class="slider-row" style="margin-top: 15px;">
            <div class="form-group">
              <label id="sb-opacity-label" for="sb-opacity" style="display: flex; justify-content: space-between;">
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
              <label id="sb-scale-label" for="sb-scale" style="display: flex; justify-content: space-between;">
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
        <button id="save-scoreboard-settings" style="margin-top: 12px;">Save Style</button>
      </div>
      
      <div class="card">
        <h4>Match Info <span id="match-info-unsaved" class="unsaved-indicator"></span></h4>
        <div class="form-group inline-form-group" style="align-items: end;">
          <div class="form-group" style="flex-grow: 1;">
            <label id="match-info-label" for="match-info-input">Text</label>
            <input type="text" id="match-info-input" value="${scoreboardStyle?.matchInfo ?? ''}">
          </div>
          <button id="save-match-info" style="flex-shrink: 0;">Save</button>
          <button id="toggle-match-info" style="min-width: 100px; flex-shrink: 0;">
            ${isMatchInfoVisible ? 'Showing' : 'Hidden'}
          </button>
        </div>
      </div>

      <div class="card">
        <h3>Scoreboard Layout <span id="unsaved-layout" class="unsaved-indicator"></span></h3>
        <div class="form-group" style="display: flex; justify-content: space-between; align-items: center;">
          <label id="timer-position-label" for="timer-position-select" style="margin-bottom: 0; font-weight: 500;">Timer Position</label>
          <select id="timer-position-select" style="min-width: 120px;">
            <option value="Under" ${
              scoreboardStyle?.timerPosition === 'Under' ? 'selected' : ''
            }>Under</option>
            <option value="Right" ${
              scoreboardStyle?.timerPosition === 'Right' ? 'selected' : ''
            }>Right</option>
          </select>
        </div>
        
        <div class="form-group switch-toggle" style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 16px;">
          <label id="red-card-indicator-label" for="red-card-indicator-toggle">Show Red Card Indicators</label>
          <label class="switch">
            <input type="checkbox" id="red-card-indicator-toggle" ${scoreboardStyle?.showRedCardIndicators ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        
        <button id="save-layout-settings" style="margin-top: 12px;">Save Layout</button>
      </div>

    </div>
  `;

  // --- Local State for Unsaved Data ---
  let isStyleUnsaved = false;
  let isLayoutUnsaved = false;
  let isMatchInfoUnsaved = false;

  // --- Get Element References ---
  // Style
  const sbPrimaryInput = container.querySelector(
    '#sb-color-primary',
  ) as HTMLInputElement;
  const sbSecondaryInput = container.querySelector(
    '#sb-color-secondary',
  ) as HTMLInputElement;
  const sbTertiaryInput = container.querySelector(
    '#sb-color-tertiary',
  ) as HTMLInputElement;
  const sbOpacitySlider = container.querySelector(
    '#sb-opacity',
  ) as HTMLInputElement;
  const sbOpacityValueSpan = container.querySelector(
    '#sb-opacity-value',
  ) as HTMLSpanElement;
  const sbScaleSlider = container.querySelector(
    '#sb-scale',
  ) as HTMLInputElement;
  const sbScaleValueSpan = container.querySelector(
    '#sb-scale-value',
  ) as HTMLSpanElement;
  
  // Style Labels
  const sbPrimaryLabel = container.querySelector('#sb-color-primary-label') as HTMLLabelElement;
  const sbSecondaryLabel = container.querySelector('#sb-color-secondary-label') as HTMLLabelElement;
  const sbTertiaryLabel = container.querySelector('#sb-color-tertiary-label') as HTMLLabelElement;
  const sbOpacityLabel = container.querySelector('#sb-opacity-label') as HTMLLabelElement;
  const sbScaleLabel = container.querySelector('#sb-scale-label') as HTMLLabelElement;
  const unsavedStyle = container.querySelector('#unsaved-style') as HTMLSpanElement;
  
  // Match Info Refs
  const matchInfoInput = container.querySelector(
    '#match-info-input',
  ) as HTMLInputElement;
  const saveMatchInfoBtn = container.querySelector(
    '#save-match-info',
  ) as HTMLButtonElement;
  const toggleMatchInfoBtn = container.querySelector(
    '#toggle-match-info',
  ) as HTMLButtonElement;
  const matchInfoUnsaved = container.querySelector(
    '#match-info-unsaved',
  ) as HTMLSpanElement;
  const matchInfoLabel = container.querySelector(
    '#match-info-label',
  ) as HTMLLabelElement;
  
  // Layout
  const timerPositionSelect = container.querySelector(
    '#timer-position-select',
  ) as HTMLSelectElement;
  const saveLayoutBtn = container.querySelector(
    '#save-layout-settings',
  ) as HTMLButtonElement;
  const timerPositionLabel = container.querySelector(
    '#timer-position-label',
  ) as HTMLLabelElement;
  const unsavedLayout = container.querySelector('#unsaved-layout') as HTMLSpanElement;
  const redCardToggle = container.querySelector(
    '#red-card-indicator-toggle',
  ) as HTMLInputElement;
  const redCardLabel = container.querySelector(
    '#red-card-indicator-label',
  ) as HTMLLabelElement;
  
  
  // --- Helper Functions ---
  const updateUnsavedIndicators = () => {
    // This function now *only* controls the (unsaved data) text in the title
    if (unsavedStyle) {
      unsavedStyle.textContent = isStyleUnsaved ? '(unsaved data)' : '';
    }
    if (unsavedLayout) {
      unsavedLayout.textContent = isLayoutUnsaved ? '(unsaved data)' : '';
    }
    if (matchInfoUnsaved) {
      matchInfoUnsaved.textContent = isMatchInfoUnsaved ? '(unsaved data)' : '';
    }
  };
  
  // --- Main UI Update Function (for subscriptions) ---
  const updateUI = () => {
    const { scoreboardStyle, isMatchInfoVisible } = getState();
    if (!scoreboardStyle) return;

    // --- Update Style Section ---
    if (!isStyleUnsaved) {
      sbPrimaryInput.value = scoreboardStyle.primary;
      sbSecondaryInput.value = scoreboardStyle.secondary;
      sbTertiaryInput.value = scoreboardStyle.tertiary;
      sbOpacitySlider.value = scoreboardStyle.opacity.toString();
      sbOpacityValueSpan.textContent = `${scoreboardStyle.opacity}%`;
      sbScaleSlider.value = scoreboardStyle.scale.toString();
      sbScaleValueSpan.textContent = `${scoreboardStyle.scale}%`;
      
      // Reset label styles
      sbPrimaryLabel.style.fontStyle = 'normal';
      sbSecondaryLabel.style.fontStyle = 'normal';
      sbTertiaryLabel.style.fontStyle = 'normal';
      sbOpacityLabel.style.fontStyle = 'normal';
      sbScaleLabel.style.fontStyle = 'normal';
    }
    
    // --- Update Layout Section ---
    if (!isLayoutUnsaved) {
      timerPositionSelect.value = scoreboardStyle.timerPosition;
      redCardToggle.checked = scoreboardStyle.showRedCardIndicators;
      
      // Reset label styles
      timerPositionLabel.style.fontStyle = 'normal';
      redCardLabel.style.fontStyle = 'normal';
    }
    
    // --- Update Match Info Section ---
    if (!isMatchInfoUnsaved) {
      matchInfoInput.value = scoreboardStyle.matchInfo;
      // Reset label style
      matchInfoLabel.style.fontStyle = 'normal';
    }
    
    // Update toggle button
    if (toggleMatchInfoBtn) {
        if (isMatchInfoVisible) {
          toggleMatchInfoBtn.textContent = 'Showing';
          toggleMatchInfoBtn.classList.remove('btn-red', 'btn-secondary');
          toggleMatchInfoBtn.classList.add('btn-green');
        } else {
          toggleMatchInfoBtn.textContent = 'Hidden';
          toggleMatchInfoBtn.classList.remove('btn-green', 'btn-secondary');
          toggleMatchInfoBtn.classList.add('btn-red');
        }
    }
  };


  // --- Add Event Listeners ---

  // --- Scoreboard Style Listeners ---
  sbPrimaryInput.addEventListener('input', () => {
    isStyleUnsaved = true;
    sbPrimaryLabel.style.fontStyle = 'italic';
    updateUnsavedIndicators();
  });
  sbSecondaryInput.addEventListener('input', () => {
    isStyleUnsaved = true;
    sbSecondaryLabel.style.fontStyle = 'italic';
    updateUnsavedIndicators();
  });
  sbTertiaryInput.addEventListener('input', () => {
    isStyleUnsaved = true;
    sbTertiaryLabel.style.fontStyle = 'italic';
    updateUnsavedIndicators();
  });
  sbOpacitySlider.addEventListener('input', () => {
    isStyleUnsaved = true;
    sbOpacityValueSpan.textContent = `${sbOpacitySlider.value}%`;
    sbOpacityLabel.style.fontStyle = 'italic';
    updateUnsavedIndicators();
  });
  sbScaleSlider.addEventListener('input', () => {
    isStyleUnsaved = true;
    sbScaleValueSpan.textContent = `${sbScaleSlider.value}%`;
    sbScaleLabel.style.fontStyle = 'italic';
    updateUnsavedIndicators();
  });

  // --- Layout Listeners ---
  timerPositionSelect.addEventListener('change', () => {
    isLayoutUnsaved = true;
    timerPositionLabel.style.fontStyle = 'italic';
    updateUnsavedIndicators();
  });
  redCardToggle.addEventListener('change', () => {
    isLayoutUnsaved = true;
    redCardLabel.style.fontStyle = 'italic';
    updateUnsavedIndicators();
  });
  
  // --- Match Info Listener ---
  matchInfoInput.addEventListener('input', () => {
    isMatchInfoUnsaved = true;
    matchInfoLabel.style.fontStyle = 'italic';
    updateUnsavedIndicators();
  });


  // --- Save Button Listeners ---

  // Save Scoreboard Settings Button
  container
    .querySelector('#save-scoreboard-settings')
    ?.addEventListener('click', async () => {
      try {
        const styleData: ScoreboardStyleOnly = {
          primary: sbPrimaryInput.value,
          secondary: sbSecondaryInput.value,
          tertiary: sbTertiaryInput.value,
          opacity: parseInt(sbOpacitySlider.value, 10),
          scale: parseInt(sbScaleSlider.value, 10),
        };
        
        await saveScoreboardStyle(styleData);
        
        isStyleUnsaved = false;
        updateUnsavedIndicators();
        // Reset individual label styles
        sbPrimaryLabel.style.fontStyle = 'normal';
        sbSecondaryLabel.style.fontStyle = 'normal';
        sbTertiaryLabel.style.fontStyle = 'normal';
        sbOpacityLabel.style.fontStyle = 'normal';
        sbScaleLabel.style.fontStyle = 'normal';
        
        showNotification('Scoreboard style saved!');
      } catch (error: any) {
        showNotification(`Error: ${error.message}`, 'error');
      }
    });

  // Save Layout Button Listener
  saveLayoutBtn.addEventListener('click', async () => {
    try {
      const layoutData: LayoutConfig = {
        position: timerPositionSelect.value as 'Under' | 'Right',
        showRedCardIndicators: redCardToggle.checked
      };
      
      await saveLayout(layoutData);
      
      isLayoutUnsaved = false;
      updateUnsavedIndicators();
      // Reset individual label styles
      timerPositionLabel.style.fontStyle = 'normal';
      redCardLabel.style.fontStyle = 'normal';
      
      showNotification('Layout saved!');
    } catch (error: any) {
      showNotification(`Error: ${error.message}`, 'error');
    }
  });
  
  // Save Match Info Listener
  saveMatchInfoBtn.addEventListener('click', async () => {
    try {
      await saveMatchInfo(matchInfoInput.value);
      isMatchInfoUnsaved = false;
      updateUnsavedIndicators();
      // Reset individual label styles
      matchInfoLabel.style.fontStyle = 'normal';
      showNotification('Match info saved!');
    } catch (error: any) {
      showNotification(`Error: ${error.message}`, 'error');
    }
  });
  
  // Toggle Match Info Listener
  toggleMatchInfoBtn.addEventListener('click', () => {
    toggleMatchInfoVisibility();
  });
  
  
  // --- Subscribe to state changes ---
  subscribe(updateUI);
  
  // --- Set initial state ---
  updateUI();
  
  // Return cleanup function
  return () => {
    unsubscribe(updateUI);
  };
}