// frontend/control_panel/pages/setting.ts
import { showNotification } from '../notification';
import { 
  getState, 
  setAutoAddScore, 
  setAutoConvertYellowToRed,
  downloadJson,
  uploadJson
} from '../stateManager';

// --- Helper Function ---
function getFriendlyFileName(fileName: string): string {
  switch (fileName) {
    case 'team-info-config.json':
      return 'Team Info & Rosters';
    case 'scoreboard-customization.json':
      return 'Scoreboard Style & Layout';
    default:
      return fileName;
  }
}

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
    
    <div class="modal-overlay import-export-modal" id="import-modal" style="display: none;">
      <div class="modal-content">
        <h4 id="import-modal-title">Import (Upload) File</h4>
        <div class="player-edit-modal-body">
          <p>You can either paste your JSON content below or upload a file. This will **overwrite** the current configuration.</p>
          <div class="form-group">
            <label for="import-json-textarea">JSON Data</label>
            <textarea id="import-json-textarea"></textarea>
          </div>
          <div class="divider-text">OR</div>
          <input type="file" id="import-file-input" accept="application/json">
          <label for="import-file-input" class="btn-file-upload">
            Click to Upload File
            <br>
            <span id="import-file-name" style="font-size: 12px; opacity: 0.8;">No file chosen</span>
          </label>
        </div>
        <div class="modal-buttons">
          <button id="modal-import-cancel-btn" class="btn-secondary">Cancel</button>
          <button id="modal-import-save-btn" class="btn-red">Validate and Overwrite</button>
        </div>
      </div>
    </div>


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
      
      <div class="card">
        <h4>Import / Export</h4>
        <div class="form-group inline-form-group" style="align-items: end;">
          <div class="form-group" style="flex-grow: 1;">
            <label for="json-file-select">Configuration File</label>
            <select id="json-file-select" style="padding: 8px; border-radius: 4px; width: 100%;">
              <option value="team-info-config.json">All Team Info</option>
              <option value="scoreboard-customization.json">Scoreboard Style & Layout</option>
            </select>
          </div>
          <button id="import-btn" class="btn-secondary" style="flex-shrink: 0;">Import (Upload)</button>
          <button id="export-btn" style="flex-shrink: 0;">Export (Download)</button>
        </div>
        <p style="font-size: 13px; opacity: 0.8; margin-top: 8px; margin-bottom: 0;">
          <b>Import:</b> Upload a JSON file from your computer to replace the app's current data.
          <br>
          <b>Export:</b> Download the currently active JSON file from the app to your computer as a backup.
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
  const autoConvertToggle = container.querySelector(
    '#auto-convert-toggle',
  ) as HTMLInputElement;
    
  // Import/Export Refs
  const fileSelect = container.querySelector('#json-file-select') as HTMLSelectElement;
  const importBtn = container.querySelector('#import-btn') as HTMLButtonElement;
  const exportBtn = container.querySelector('#export-btn') as HTMLButtonElement;
  
  // Modal Refs
  const importModal = container.querySelector('#import-modal') as HTMLDivElement;
  const importModalTitle = container.querySelector('#import-modal-title') as HTMLHeadingElement;
  const importTextarea = container.querySelector('#import-json-textarea') as HTMLTextAreaElement;
  const importFileInput = container.querySelector('#import-file-input') as HTMLInputElement;
  const importFileName = container.querySelector('#import-file-name') as HTMLSpanElement;
  const modalImportCancelBtn = container.querySelector('#modal-import-cancel-btn') as HTMLButtonElement;
  const modalImportSaveBtn = container.querySelector('#modal-import-save-btn') as HTMLButtonElement;


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
  
  // --- Updated Import/Export Listeners ---
  
  // "Export" (Download) Button
  exportBtn.addEventListener('click', async () => {
    const fileName = fileSelect.value;
    try {
      const blob = await downloadJson(fileName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification(`Exported ${getFriendlyFileName(fileName)}!`);
    } catch (error: any) {
      showNotification(`Error exporting: ${error.message}`, 'error');
    }
  });
  
  // "Import" (Upload) Button - Show Modal
  importBtn.addEventListener('click', () => {
    const fileName = fileSelect.value;
    importModalTitle.textContent = `Import (Upload) to ${getFriendlyFileName(fileName)}`;
    importTextarea.value = '';
    importFileName.textContent = 'No file chosen';
    importFileInput.value = ''; // <-- This is the fix
    importModal.style.display = 'flex';
  });
  
  // Modal: Cancel Button
  modalImportCancelBtn.addEventListener('click', () => {
    importModal.style.display = 'none';
  });
  
  // Modal: File Input
  importFileInput.addEventListener('change', () => {
    const file = importFileInput.files?.[0];
    if (file) {
      importFileName.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        importTextarea.value = e.target?.result as string;
      };
      reader.readAsText(file);
    } else {
      importFileName.textContent = 'No file chosen';
    }
  });
  
  // Modal: Save (Validate and Overwrite) Button
  modalImportSaveBtn.addEventListener('click', async () => {
    const fileName = fileSelect.value;
    const jsonData = importTextarea.value;
    
    if (!jsonData.trim()) {
      showNotification('No JSON data to import.', 'error');
      return;
    }
    
    try {
      modalImportSaveBtn.disabled = true;
      modalImportSaveBtn.textContent = 'Validating...';
      
      await uploadJson(fileName, jsonData);
      
      showNotification(`Successfully imported ${getFriendlyFileName(fileName)}! Data is now active.`);
      importModal.style.display = 'none';
    } catch (error: any) {
      console.error(error);
      showNotification(`Import Failed: ${error.message}`, 'error');
    } finally {
      modalImportSaveBtn.disabled = false;
      modalImportSaveBtn.textContent = 'Validate and Overwrite';
    }
  });
}