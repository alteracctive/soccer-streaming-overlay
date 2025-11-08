// frontend/control_panel/pages/setting.ts
import { showNotification } from '../notification';
import { getState, setAutoAddScore, setAutoConvertYellowToRed } from '../stateManager';

export function render(container: HTMLElement) {
  // Get initial state from the manager
  const { isAutoAddScoreOn, isAutoConvertYellowToRedOn } = getState();
  const isDarkMode = document.body.classList.contains('dark-mode');

  container.innerHTML = `
    <style>
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
        <h4>Appearance</h4>
        <div class="form-group switch-toggle">
          <label for="theme-toggle">Dark Mode</label>
          <label class="switch">
            <input type="checkbox" id="theme-toggle" ${isDarkMode ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="card">
        <h4>Interaction</h4>
        <div class="form-group switch-toggle">
          <label for="auto-score-toggle">Auto-add Score from Player</label>
          <label class="switch">
            <input type="checkbox" id="auto-score-toggle" ${isAutoAddScoreOn ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        <p style="font-size: 13px; opacity: 0.8; margin-top: 8px; margin-bottom: 0;">
          When ON, adding a goal (⚽) to a player in the Team Info page will automatically add +1 to that team's score.
        </p>

        <hr style="border: none; border-top: 1px solid var(--border-color); margin: 16px 0;">

        <div class="form-group switch-toggle">
          <label for="auto-convert-toggle">Auto-convert 2 Yellows to 1 Red</label>
          <label class="switch">
            <input type="checkbox" id="auto-convert-toggle" ${isAutoConvertYellowToRedOn ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        <p style="font-size: 13px; opacity: 0.8; margin-top: 8px; margin-bottom: 0;">
          When ON, giving a player their 2nd yellow card will automatically give them a red card.
        </p>
      </div>
    </div>
  `;

  // --- Get Element References ---
  const themeToggle = container.querySelector(
    '#theme-toggle',
  ) as HTMLInputElement;
  const autoScoreToggle = container.querySelector(
    '#auto-score-toggle',
  ) as HTMLInputElement;
  const autoConvertToggle = container.querySelector( // <-- New
    '#auto-convert-toggle',
  ) as HTMLInputElement;

  // --- Add Event Listeners ---
  
  // Dark Mode Toggle
  themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  });
  
  // Auto-Score Toggle
  autoScoreToggle.addEventListener('change', () => {
    setAutoAddScore(autoScoreToggle.checked);
    showNotification(
      `Auto-add score ${autoScoreToggle.checked ? 'Enabled' : 'Disabled'}`,
    );
  });

  // Auto-Convert Toggle
  autoConvertToggle.addEventListener('change', () => {
    setAutoConvertYellowToRed(autoConvertToggle.checked);
    showNotification(
      `Auto-convert 2-to-1 ${autoConvertToggle.checked ? 'Enabled' : 'Disabled'}`,
    );
  });
}