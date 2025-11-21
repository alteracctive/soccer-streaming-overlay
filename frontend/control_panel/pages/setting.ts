// frontend/control_panel/pages/setting.ts
import { showNotification } from '../notification';
import { 
  getState, 
  setAutoAddScore, 
  setAutoConvertYellowToRed,
  setAutoAdvancePeriod,
  setFutsalClock,
  downloadJson,
  uploadJson,
  getRawJson,
  subscribe,
  unsubscribe,
  type ScoreboardConfig,
  type TeamConfig
} from '../stateManager';

function getFriendlyFileName(fileName: string): string {
  switch (fileName) {
    case 'team-info-config.json':
      return 'Team Info & Rosters';
    case 'scoreboard-customization.json':
      return 'Scoreboard Style & Layout';
    case 'time-period-setting.json': // <-- New
      return 'Match Period Settings';
    case 'teamA':
      return 'Team A Info Only';
    case 'teamB':
      return 'Team B Info Only';
    default:
      return fileName;
  }
}

function createPartialConfig(config: ScoreboardConfig, team: 'teamA' | 'teamB'): object {
  const teamToKeep = (team === 'teamA') ? config.teamA : config.teamB;
  
  const emptyTeam = {
    name: "TEAM B",
    abbreviation: "TMB",
    score: -1,
    colors: {
      primary: "#0000FF",
      secondary: "#FFFFFF"
    },
    players: []
  };

  return {
    teamA: teamToKeep,
    teamB: emptyTeam
  };
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


export function render(container: HTMLElement) {
  const { isAutoAddScoreOn, isAutoConvertYellowToRedOn, isFutsalClockOn, isAutoAdvancePeriodOn } = getState();
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
    
    <div class="modal-overlay export-options-modal" id="export-options-modal" style="display: none;">
      <div class="modal-content">
        <h4>Export Options</h4>
        <p style="text-align: center;">Which team's info do you want to export?</p>
        <div class="modal-buttons">
          <button id="modal-export-both-btn">Both Teams</button>
          <button id="modal-export-a-btn">Team A Only</button>
          <button id="modal-export-b-btn">Team B Only</button>
          <button id="modal-export-options-cancel-btn" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay export-view-modal" id="export-view-modal" style="display: none;">
      <div class="modal-content">
        <h4 id="export-view-modal-title">Export File Content</h4>
        <textarea id="export-view-textarea" readonly></textarea>
        <div class="modal-buttons">
          <button id="modal-export-view-cancel-btn" class="btn-secondary">Close</button>
          <button id="modal-copy-btn" class="btn-secondary">Copy to Clipboard</button>
          <button id="modal-download-btn" class="btn-green">Download File</button>
        </div>
      </div>
    </div>
    
    <div class="modal-overlay team-assign-modal" id="team-assign-modal" style="display: none;">
      <div class="modal-content">
        <h4>Single Team File Detected</h4>
        <p style="text-align: center;">This file contains data for one team. Which team do you want to overwrite?</p>
        <div class="modal-buttons">
          <button id="modal-assign-a-btn" class="btn-green">Overwrite Team A</button>
          <button id="modal-assign-b-btn" class="btn-green">Overwrite Team B</button>
          <button id="modal-assign-cancel-btn" class="btn-secondary">Cancel</button>
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
        
        <hr style="border: none; border-top: 1px solid var(--border-color); margin: 16px 0;">

        <div class="form-group switch-toggle">
          <label for="auto-advance-toggle">Auto-advance Period on Time Set</label>
          <label class="switch">
            <input type="checkbox" id="auto-advance-toggle" ${isAutoAdvancePeriodOn ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        <p style="font-size: 13px; opacity: 0.8; margin-top: 8px; margin-bottom: 0;">
          When ON, clicking "Set to [Time]" in the dashboard will automatically switch the match period to the next one in the list.
        </p>
        
        <hr style="border: none; border-top: 1px solid var(--border-color); margin: 16px 0;">

        <div class="form-group switch-toggle">
          <label for="futsal-clock-toggle">Futsal Clock (Countdown)</label>
          <label class="switch">
            <input type="checkbox" id="futsal-clock-toggle" ${isFutsalClockOn ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        <p style="font-size: 13px; opacity: 0.8; margin-top: 8px; margin-bottom: 0;">
          When ON, the timer will count down and stop at 00:00. Changing this setting will stop the timer.
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
              <option value="time-period-setting.json">Match Period Settings</option>
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

  let currentExportBlob: Blob | null = null;
  let currentExportFileName: string = '';
  let teamDataToImport: TeamConfig | null = null;

  const themeToggle = container.querySelector('#theme-toggle') as HTMLInputElement;
  const autoScoreToggle = container.querySelector('#auto-score-toggle') as HTMLInputElement;
  const autoConvertToggle = container.querySelector('#auto-convert-toggle') as HTMLInputElement;
  const autoAdvanceToggle = container.querySelector('#auto-advance-toggle') as HTMLInputElement;
  const futsalClockToggle = container.querySelector('#futsal-clock-toggle') as HTMLInputElement;
    
  const fileSelect = container.querySelector('#json-file-select') as HTMLSelectElement;
  const importBtn = container.querySelector('#import-btn') as HTMLButtonElement;
  const exportBtn = container.querySelector('#export-btn') as HTMLButtonElement;
  const importModal = container.querySelector('#import-modal') as HTMLDivElement;
  const importModalTitle = container.querySelector('#import-modal-title') as HTMLHeadingElement;
  const importTextarea = container.querySelector('#import-json-textarea') as HTMLTextAreaElement;
  const importFileInput = container.querySelector('#import-file-input') as HTMLInputElement;
  const importFileName = container.querySelector('#import-file-name') as HTMLSpanElement;
  const modalImportCancelBtn = container.querySelector('#modal-import-cancel-btn') as HTMLButtonElement;
  const modalImportSaveBtn = container.querySelector('#modal-import-save-btn') as HTMLButtonElement;
  const exportOptionsModal = container.querySelector('#export-options-modal') as HTMLDivElement;
  const exportBothBtn = container.querySelector('#modal-export-both-btn') as HTMLButtonElement;
  const exportABtn = container.querySelector('#modal-export-a-btn') as HTMLButtonElement;
  const exportBBtn = container.querySelector('#modal-export-b-btn') as HTMLButtonElement;
  const exportOptionsCancelBtn = container.querySelector('#modal-export-options-cancel-btn') as HTMLButtonElement;
  const exportViewModal = container.querySelector('#export-view-modal') as HTMLDivElement;
  const exportViewModalTitle = container.querySelector('#export-view-modal-title') as HTMLHeadingElement;
  const exportViewTextarea = container.querySelector('#export-view-textarea') as HTMLTextAreaElement;
  const modalExportViewCancelBtn = container.querySelector('#modal-export-view-cancel-btn') as HTMLButtonElement;
  const modalCopyBtn = container.querySelector('#modal-copy-btn') as HTMLButtonElement;
  const modalDownloadBtn = container.querySelector('#modal-download-btn') as HTMLButtonElement;
  const teamAssignModal = container.querySelector('#team-assign-modal') as HTMLDivElement;
  const assignTeamABtn = container.querySelector('#modal-assign-a-btn') as HTMLButtonElement;
  const assignTeamBBtn = container.querySelector('#modal-assign-b-btn') as HTMLButtonElement;
  const assignCancelBtn = container.querySelector('#modal-assign-cancel-btn') as HTMLButtonElement;

  const onStateUpdate = () => {
    const { isFutsalClockOn, isAutoAdvancePeriodOn } = getState();
    if (futsalClockToggle) futsalClockToggle.checked = isFutsalClockOn;
    if (autoAdvanceToggle) autoAdvanceToggle.checked = isAutoAdvancePeriodOn;
  };
  subscribe(onStateUpdate);

  themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) { document.body.classList.add('dark-mode'); localStorage.setItem('theme', 'dark'); } 
    else { document.body.classList.remove('dark-mode'); localStorage.setItem('theme', 'light'); }
  });
  autoScoreToggle.addEventListener('change', () => { setAutoAddScore(autoScoreToggle.checked); showNotification(`Auto-add score ${autoScoreToggle.checked ? 'Enabled' : 'Disabled'}`); });
  autoConvertToggle.addEventListener('change', () => { setAutoConvertYellowToRed(autoConvertToggle.checked); showNotification(`Auto-convert 2-to-1 ${autoConvertToggle.checked ? 'Enabled' : 'Disabled'}`); });
  autoAdvanceToggle.addEventListener('change', () => { setAutoAdvancePeriod(autoAdvanceToggle.checked); showNotification(`Auto-advance period ${autoAdvanceToggle.checked ? 'Enabled' : 'Disabled'}`); });
  futsalClockToggle.addEventListener('change', () => { const isOn = futsalClockToggle.checked; setFutsalClock(isOn); showNotification(`Futsal Clock ${isOn ? 'Enabled' : 'Disabled'}. Timer stopped.`); });
  
  const showExportViewModal = (fileName: string, content: string, blob: Blob) => { currentExportBlob = blob; currentExportFileName = fileName; exportViewModalTitle.textContent = `Export: ${fileName}`; exportViewTextarea.value = content; exportViewModal.style.display = 'flex'; };
  const hideExportViewModal = () => { exportViewModal.style.display = 'none'; currentExportBlob = null; currentExportFileName = ''; };
  modalExportViewCancelBtn.addEventListener('click', hideExportViewModal);
  modalCopyBtn.addEventListener('click', () => { navigator.clipboard.writeText(exportViewTextarea.value); showNotification('Copied to clipboard!'); });
  modalDownloadBtn.addEventListener('click', () => { if (currentExportBlob && currentExportFileName) { triggerDownload(currentExportBlob, currentExportFileName); hideExportViewModal(); } else { showNotification('Error: No export data found.', 'error'); } });

  const hideExportOptionsModal = () => { exportOptionsModal.style.display = 'none'; };
  const handleDownload = async (type: 'all' | 'teamA' | 'teamB') => { hideExportOptionsModal(); const { config } = getState(); if (!config) { showNotification('Config not loaded.', 'error'); return; } const baseFileName = 'team-info-config.json'; try { const blob = await downloadJson(baseFileName); if (type === 'all') { const content = await blob.text(); const teamAAbbr = config.teamA.abbreviation || 'TMA'; const teamBAbbr = config.teamB.abbreviation || 'TMB'; const downloadName = `${teamAAbbr}-vs-${teamBAbbr}.json`; showExportViewModal(downloadName, content, blob); } else { const originalJsonString = await blob.text(); const originalConfig = JSON.parse(originalJsonString) as ScoreboardConfig; const modifiedConfig = createPartialConfig(originalConfig, type); const modifiedJsonString = JSON.stringify(modifiedConfig, null, 2); const newBlob = new Blob([modifiedJsonString], { type: 'application/json' }); const teamName = (type === 'teamA' ? config.teamA.name : config.teamB.name) || type; const downloadName = `${teamName.replace(/\s+/g, '')}-info.json`; showExportViewModal(downloadName, modifiedJsonString, newBlob); } } catch (error: any) { showNotification(`Error exporting: ${error.message}`, 'error'); } };
  exportBothBtn.addEventListener('click', () => handleDownload('all'));
  exportABtn.addEventListener('click', () => handleDownload('teamA'));
  exportBBtn.addEventListener('click', () => handleDownload('teamB'));
  exportOptionsCancelBtn.addEventListener('click', hideExportOptionsModal);
  
  exportBtn.addEventListener('click', async () => { const fileName = fileSelect.value; if (fileName === 'team-info-config.json') { exportOptionsModal.style.display = 'flex'; } else { try { const blob = await downloadJson(fileName); const content = await blob.text(); showExportViewModal(fileName, content, blob); } catch (error: any) { showNotification(`Error exporting: ${error.message}`, 'error'); } } });
  importBtn.addEventListener('click', () => { const fileName = fileSelect.value; if (fileName !== 'team-info-config.json' && fileName !== 'scoreboard-customization.json' && fileName !== 'time-period-setting.json') { showNotification('Please select a full config file to import.', 'error'); return; } importModalTitle.textContent = `Import (Upload) to ${getFriendlyFileName(fileName)}`; importTextarea.value = ''; importFileName.textContent = 'No file chosen'; importFileInput.value = ''; importModal.style.display = 'flex'; });
  modalImportCancelBtn.addEventListener('click', () => { importModal.style.display = 'none'; });
  importFileInput.addEventListener('change', () => { const file = importFileInput.files?.[0]; if (file) { importFileName.textContent = file.name; const reader = new FileReader(); reader.onload = (e) => { importTextarea.value = e.target?.result as string; }; reader.readAsText(file); } else { importFileName.textContent = 'No file chosen'; } });

  const hideTeamAssignModal = () => { teamAssignModal.style.display = 'none'; teamDataToImport = null; };
  const handleTeamImport = async (targetTeam: 'teamA' | 'teamB') => { if (!teamDataToImport) { showNotification('Error: No team data to import.', 'error'); return; } try { assignTeamABtn.disabled = true; assignTeamBBtn.disabled = true; const currentConfigJson = await getRawJson('team-info-config.json'); const currentConfig = JSON.parse(currentConfigJson) as ScoreboardConfig; if (targetTeam === 'teamA') { currentConfig.teamA = teamDataToImport; } else { currentConfig.teamB = teamDataToImport; } const newJsonData = JSON.stringify(currentConfig, null, 2); await uploadJson('team-info-config.json', newJsonData); showNotification(`Successfully imported data to ${targetTeam}!`); hideTeamAssignModal(); } catch (error: any) { console.error(error); showNotification(`Import Failed: ${error.message}`, 'error'); } finally { assignTeamABtn.disabled = false; assignTeamBBtn.disabled = false; } };
  assignTeamABtn.addEventListener('click', () => handleTeamImport('teamA'));
  assignTeamBBtn.addEventListener('click', () => handleTeamImport('teamB'));
  assignCancelBtn.addEventListener('click', hideTeamAssignModal);
  
  modalImportSaveBtn.addEventListener('click', async () => { 
    const fileName = fileSelect.value as "team-info-config.json" | "scoreboard-customization.json" | "time-period-setting.json"; 
    const jsonData = importTextarea.value; 
    if (!jsonData.trim()) { showNotification('No JSON data to import.', 'error'); return; } 
    try { 
        modalImportSaveBtn.disabled = true; 
        modalImportSaveBtn.textContent = 'Validating...'; 
        let uploadedConfig; try { uploadedConfig = JSON.parse(jsonData); } catch (e) { throw new Error('Data is not valid JSON.'); } 
        if (fileName === 'team-info-config.json') { if (uploadedConfig.teamA && uploadedConfig.teamB && uploadedConfig.teamB.score === -1) { teamDataToImport = uploadedConfig.teamA as TeamConfig; importModal.style.display = 'none'; teamAssignModal.style.display = 'flex'; return; } } 
        await uploadJson(fileName, jsonData); showNotification(`Successfully imported ${getFriendlyFileName(fileName)}! Data is now active.`); importModal.style.display = 'none'; 
    } catch (error: any) { console.error(error); showNotification(`Import Failed: ${error.message}`, 'error'); } finally { modalImportSaveBtn.disabled = false; modalImportSaveBtn.textContent = 'Validate and Overwrite'; } 
  });

  return () => {
    unsubscribe(onStateUpdate);
  };
}