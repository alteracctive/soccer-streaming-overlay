import { getState, subscribe, unsubscribe } from '../stateManager';

export function render(container: HTMLElement) {
  container.innerHTML = `
    <style>
      .preview-container {
        background-color: #a0a0a0;
        background-image: linear-gradient(45deg, #909090 25%, transparent 25%), 
                          linear-gradient(-45deg, #909090 25%, transparent 25%), 
                          linear-gradient(45deg, transparent 75%, #909090 75%), 
                          linear-gradient(-45deg, transparent 75%, #909090 75%);
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        border-radius: 8px;
        margin-bottom: 20px;
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        overflow: hidden;
      }
      
      .preview-scoreboard-container {
        position: absolute;
        top: 20px;
        left: 40px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        transform-origin: top left;
      }

      .preview-var-container {
        position: absolute;
        bottom: 20px;
        left: 20px;
        transform-origin: bottom left;
      }
      
      .preview-scoreboard-content-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .layout-right .preview-scoreboard-content-wrapper {
        flex-direction: row;
        align-items: stretch;
      }
      
      .preview-element {
        cursor: pointer;
        box-sizing: border-box;
        border: 2px solid transparent;
        transition: border 0.2s, transform 0.2s;
        border-radius: 8px;
      }
      .preview-element:hover {
        border: 2px dashed #ff0000;
        transform: scale(1.02);
      }
      .preview-element.selected {
        border: 2px solid #ff0000;
      }

      /* Basic structures mirroring overlay */
      .preview-match-info {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 600;
        padding: 4px 16px;
        min-width: 400px;
        height: 34px;
        white-space: nowrap;
      }
      
      .preview-score-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 32px;
        font-weight: bold;
        padding: 8px 16px;
        min-width: 400px;
        height: 50px;
      }
      
      .preview-timer-row {
        font-size: 24px;
        font-weight: bold;
        padding: 4px 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 150px;
      }
      
      .preview-extra-time {
        font-size: 24px;
        font-weight: bold;
        padding: 4px 10px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .preview-team-strip {
        width: 10px;
        height: 32px;
        display: flex;
        flex-direction: column;
        border-radius: 2px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .preview-team-strip div {
        flex: 1;
      }

      .preview-timer-section {
        display: flex;
        gap: 8px;
        justify-content: center;
      }
      
      .layout-right .preview-timer-section {
        flex-direction: row;
        width: auto;
        height: 50px;
      }
      .layout-right .preview-timer-row, .layout-right .preview-extra-time {
        height: 100%;
        box-sizing: border-box;
      }
      
      .preview-var-box {
        display: flex;
        flex-direction: column;
        border-radius: 5px;
        overflow: hidden;
        min-width: 250px;
      }
      .preview-var-title {
        font-weight: bold;
        text-align: center;
        padding: 2px 8px;
        font-size: 1.2em;
      }
      .preview-var-content {
        padding: 10px 15px;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      /* Game Report Preview */
      .preview-game-report {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 50%;
        min-width: 400px;
        display: flex;
        flex-direction: column;
        border-radius: 8px;
        overflow: hidden;
      }
      .preview-game-report.preview-element:hover {
        transform: translateX(-50%) scale(1.02);
      }
      .preview-report-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        font-weight: bold;
      }
      .preview-report-content {
        padding: 10px 16px;
        min-height: 80px;
        display: flex;
        justify-content: space-around;
      }

      /* Players List Preview */
      .preview-players-list {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 200px;
        border-radius: 8px;
        padding: 10px;
        display: flex;
        flex-direction: column;
      }
      .preview-players-list.preview-element:hover {
        transform: translateY(-50%) scale(1.02);
      }
      .preview-players-list.team-a {
        left: 20px;
      }
      .preview-players-list.team-b {
        right: 20px;
      }
      .preview-players-header {
        font-weight: bold;
        text-align: center;
        border-bottom: 1px solid rgba(255,255,255,0.2);
        padding-bottom: 5px;
        margin-bottom: 5px;
      }
      
      .details-panel {
        background-color: var(--bg-secondary);
        padding: 15px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        min-height: 100px;
      }
      .details-row {
        display: flex;
        margin-bottom: 8px;
      }
      .details-label {
        font-weight: bold;
        width: 150px;
        color: var(--text-muted);
      }
      .color-swatch {
        display: inline-block;
        width: 16px;
        height: 16px;
        border-radius: 4px;
        margin-right: 8px;
        vertical-align: middle;
        border: 1px solid #000;
      }
      
      .aspect-ratio-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }
      .aspect-ratio-controls input[type="number"] {
        padding: 5px 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-primary);
        color: var(--text-main);
        width: 80px;
      }
      .aspect-ratio-controls button {
        padding: 5px 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-secondary);
        color: var(--text-main);
        cursor: pointer;
      }
      .aspect-ratio-controls button:hover {
        background: var(--bg-hover);
      }
    </style>

    <div class="card">
      <h3>Overlay Preview</h3>
      
      <div class="aspect-ratio-controls">
        <label for="aspect-ratio-select">Aspect Ratio:</label>
        <select id="aspect-ratio-select">
          <option value="16:9">16:9</option>
          <option value="16:10">16:10</option>
          <option value="4:3">4:3</option>
          <option value="21:9">21:9</option>
          <option value="1:1">1:1</option>
          <option value="9:16">9:16</option>
          <option value="custom">Custom</option>
        </select>
        <label>Resolution:</label>
        <input type="number" id="res-width" value="1920">
        <span>x</span>
        <input type="number" id="res-height" value="1080">
        <button id="apply-aspect-ratio">Apply</button>
      </div>

      <p style="margin-bottom: 15px; color: var(--text-muted);">Click on any element in the preview to view its details and styling information.</p>
      
      <div class="preview-container" id="preview-container">
        
        <div class="preview-scoreboard-container" id="preview-scoreboard-container">
          <!-- Match Info -->
          <div id="el-match-info" class="preview-element preview-match-info" data-id="match-info">
            <span id="preview-match-text">Match Info</span>
          </div>
          
          <div class="preview-scoreboard-content-wrapper" id="preview-scoreboard-content-wrapper">
            <!-- Score Row -->
            <div id="el-score-row" class="preview-element preview-score-row" data-id="score-row">
              <div class="preview-team-strip">
                <div id="preview-strip-a-1"></div>
                <div id="preview-strip-a-2"></div>
              </div>
              <span id="preview-abbr-a">TMA</span>
              <span id="preview-score-a">00</span>
              <span>-</span>
              <span id="preview-score-b">00</span>
              <span id="preview-abbr-b">TMB</span>
              <div class="preview-team-strip">
                <div id="preview-strip-b-1"></div>
                <div id="preview-strip-b-2"></div>
              </div>
            </div>
            
            <!-- Timer Section -->
            <div class="preview-timer-section" id="preview-timer-section">
              <div id="el-timer" class="preview-element preview-timer-row" data-id="timer">
                <span id="preview-time">00:00</span>
              </div>
              <div id="el-extra-time" class="preview-element preview-extra-time" data-id="extra-time">
                <span>+3'</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- VAR Box Preview -->
        <div class="preview-var-container" id="preview-var-container">
          <div id="el-var-box" class="preview-element preview-var-box" data-id="var-box">
            <div id="preview-var-title" class="preview-var-title">VAR</div>
            <div id="preview-var-content" class="preview-var-content">
               <div style="font-weight: bold; margin-bottom: 5px;">Scenario - Message</div>
               <div style="font-size: 1.2em; font-weight: bold; text-align: center; padding-top: 5px; border-top: 1px solid #555;">Decision</div>
            </div>
          </div>
        </div>

        <!-- Players List Preview -->
        <div id="el-players-list-a" class="preview-element preview-players-list team-a" data-id="players-list-a">
          <div class="preview-players-header">Team A Players</div>
          <div style="font-size: 0.9em;">
            1. Player One<br>
            2. Player Two<br>
            ...
          </div>
        </div>
        
        <div id="el-players-list-b" class="preview-element preview-players-list team-b" data-id="players-list-b">
          <div class="preview-players-header">Team B Players</div>
          <div style="font-size: 0.9em;">
            1. Player Three<br>
            2. Player Four<br>
            ...
          </div>
        </div>

        <!-- Game Report Preview -->
        <div id="el-game-report" class="preview-element preview-game-report" data-id="game-report">
          <div id="preview-report-header" class="preview-report-header">
            <span>Team A</span>
            <span>0 - 0</span>
            <span>Team B</span>
          </div>
          <div id="preview-report-content" class="preview-report-content">
            <div style="flex:1; text-align: right;">Goal 10'<br>Goal 22'</div>
            <div style="width: 2px; background: rgba(255,255,255,0.2); margin: 0 10px;"></div>
            <div style="flex:1; text-align: left;">Goal 15'</div>
          </div>
        </div>

      </div>

      <h4>Element Details</h4>
      <div id="details-panel" class="details-panel">
        <em>Select an element above to see its details.</em>
      </div>
    </div>
  `;

  // DOM Elements
  const previewContainer = container.querySelector('#preview-container') as HTMLDivElement;
  const scoreboardContainer = container.querySelector('#preview-scoreboard-container') as HTMLDivElement;
  const varContainer = container.querySelector('#preview-var-container') as HTMLDivElement;
  const middleRow = container.querySelector('#preview-scoreboard-content-wrapper') as HTMLDivElement;
  const timerSection = container.querySelector('#preview-timer-section') as HTMLDivElement;
  
  const elMatchInfo = container.querySelector('#el-match-info') as HTMLDivElement;
  const elScoreRow = container.querySelector('#el-score-row') as HTMLDivElement;
  const elTimer = container.querySelector('#el-timer') as HTMLDivElement;
  const elExtraTime = container.querySelector('#el-extra-time') as HTMLDivElement;
  const elVarBox = container.querySelector('#el-var-box') as HTMLDivElement;
  
  const elPlayersListA = container.querySelector('#el-players-list-a') as HTMLDivElement;
  const elPlayersListB = container.querySelector('#el-players-list-b') as HTMLDivElement;
  const elGameReport = container.querySelector('#el-game-report') as HTMLDivElement;

  const detailsPanel = container.querySelector('#details-panel') as HTMLDivElement;
  
  const elements = [elMatchInfo, elScoreRow, elTimer, elExtraTime, elVarBox, elPlayersListA, elPlayersListB, elGameReport];

  const aspectRatioSelect = container.querySelector('#aspect-ratio-select') as HTMLSelectElement;
  const resWidthInput = container.querySelector('#res-width') as HTMLInputElement;
  const resHeightInput = container.querySelector('#res-height') as HTMLInputElement;
  const applyRatioBtn = container.querySelector('#apply-aspect-ratio') as HTMLButtonElement;

  const defaultResolutions: Record<string, [number, number]> = {
    '16:9': [1920, 1080],
    '16:10': [1920, 1200],
    '4:3': [1024, 768],
    '21:9': [2560, 1080],
    '1:1': [1080, 1080],
    '9:16': [1080, 1920]
  };

  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
  }

  aspectRatioSelect.addEventListener('change', () => {
    const val = aspectRatioSelect.value;
    if (val !== 'custom' && defaultResolutions[val]) {
      resWidthInput.value = defaultResolutions[val][0].toString();
      resHeightInput.value = defaultResolutions[val][1].toString();
      previewContainer.style.aspectRatio = val.replace(':', ' / ');
    }
  });

  const handleResolutionChange = () => {
    const w = parseInt(resWidthInput.value);
    const h = parseInt(resHeightInput.value);
    if (w > 0 && h > 0) {
      const divisor = gcd(w, h);
      const ratioW = w / divisor;
      const ratioH = h / divisor;
      let ratioStr = `${ratioW}:${ratioH}`;
      
      let found = false;
      for (const key of Object.keys(defaultResolutions)) {
         if (key === ratioStr || (w === defaultResolutions[key][0] && h === defaultResolutions[key][1])) {
           aspectRatioSelect.value = key;
           found = true;
           break;
         }
      }
      
      if (!found && ratioStr === '8:5') {
        aspectRatioSelect.value = '16:10';
        found = true;
      }
      if (!found && ratioStr === '64:27') {
         aspectRatioSelect.value = '21:9';
         found = true;
      }

      if (!found) {
        aspectRatioSelect.value = 'custom';
      }
    }
  };

  resWidthInput.addEventListener('input', handleResolutionChange);
  resHeightInput.addEventListener('input', handleResolutionChange);

  const applyAspectRatio = () => {
    const w = parseInt(resWidthInput.value);
    const h = parseInt(resHeightInput.value);
    if (w > 0 && h > 0) {
      previewContainer.style.aspectRatio = `${w} / ${h}`;
    }
  };

  applyRatioBtn.addEventListener('click', applyAspectRatio);
  [resWidthInput, resHeightInput].forEach(el => {
    el.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') applyAspectRatio();
    });
  });

  function hexToRgba(hex: string, opacityPercent: number): string {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) { r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16); }
    else if (hex.length === 7) { r = parseInt(hex.substring(1, 3), 16); g = parseInt(hex.substring(3, 5), 16); b = parseInt(hex.substring(5, 7), 16); }
    else { return `rgba(0, 0, 0, ${opacityPercent / 100})`; }
    const alpha = Math.max(0.5, Math.min(1.0, opacityPercent / 100));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const renderDetails = (elementId: string) => {
    const { scoreboardStyle } = getState();
    if (!scoreboardStyle) return;

    let html = '';
    const addRow = (label: string, value: string, colorHex?: string) => {
      let swatch = colorHex ? `<span class="color-swatch" style="background-color: ${colorHex};"></span>` : '';
      html += `<div class="details-row"><div class="details-label">${label}</div><div>${swatch}${value}</div></div>`;
    };

    switch (elementId) {
      case 'match-info':
        addRow('Element', 'Match Info Banner');
        addRow('Alignment', 'Relative to Main Scoreboard Row (Top)');
        addRow('Text', scoreboardStyle.matchInfo || '(Empty)');
        addRow('Background Color', `Box Alt Color (${scoreboardStyle.boxAltColor})`, scoreboardStyle.boxAltColor);
        addRow('Text Color', `Text Main Color (${scoreboardStyle.textMainColor})`, scoreboardStyle.textMainColor);
        break;
      case 'score-row':
        addRow('Element', 'Main Scoreboard Row');
        addRow('Alignment', 'Top Left Corner of Screen (with margins)');
        addRow('Background Color', `Box Main Color (${scoreboardStyle.boxMainColor})`, scoreboardStyle.boxMainColor);
        addRow('Text Color', `Text Main Color (${scoreboardStyle.textMainColor})`, scoreboardStyle.textMainColor);
        break;
      case 'timer':
        addRow('Element', 'Timer Box');
        addRow('Alignment', 'Relative to Main Scoreboard Row (Bottom)');
        addRow('Background Color', `Box Main Color (${scoreboardStyle.boxMainColor})`, scoreboardStyle.boxMainColor);
        addRow('Text Color', `Text Main Color (${scoreboardStyle.textMainColor})`, scoreboardStyle.textMainColor);
        break;
      case 'extra-time':
        addRow('Element', 'Extra Time Box');
        addRow('Alignment', 'Relative to Timer Box (Right)');
        addRow('Background Color', `Box Main Color (${scoreboardStyle.boxMainColor})`, scoreboardStyle.boxMainColor);
        addRow('Text Color', `Text Alt Color (${scoreboardStyle.textAltColor})`, scoreboardStyle.textAltColor);
        break;
      case 'var-box':
        addRow('Element', 'VAR Box');
        addRow('Alignment', 'Bottom Left Corner of Screen (with margins)');
        addRow('Header Background', `Box Alt Color (${scoreboardStyle.boxAltColor})`, scoreboardStyle.boxAltColor);
        addRow('Header Text Color', `Text Alt Color (${scoreboardStyle.textAltColor})`, scoreboardStyle.textAltColor);
        addRow('Content Background', `Box Main Color (${scoreboardStyle.boxMainColor})`, scoreboardStyle.boxMainColor);
        addRow('Content Text Color', `Text Main Color (${scoreboardStyle.textMainColor})`, scoreboardStyle.textMainColor);
        break;
      case 'players-list-a':
        addRow('Element', 'Team A Players List');
        addRow('Alignment', 'Left Edge (Middle Y-axis)');
        addRow('Background Color', 'Fixed Dark Overlay (rgba(0,0,0,0.75))');
        break;
      case 'players-list-b':
        addRow('Element', 'Team B Players List');
        addRow('Alignment', 'Right Edge (Middle Y-axis)');
        addRow('Background Color', 'Fixed Dark Overlay (rgba(0,0,0,0.75))');
        break;
      case 'game-report':
        addRow('Element', 'Game Report Container');
        addRow('Alignment', 'Bottom Edge (Center X-axis)');
        addRow('Background Color', 'Fixed Dark Overlay (rgba(0,0,0,0.75))');
        break;
    }
    
    addRow('Opacity Applied', `${scoreboardStyle.opacity}%`);
    detailsPanel.innerHTML = html;
  };

  elements.forEach(el => {
    el.addEventListener('click', () => {
      elements.forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      renderDetails(el.dataset.id || '');
    });
  });

  const updateUI = () => {
    const { scoreboardStyle, config, timer, extraTime } = getState();
    if (!scoreboardStyle || !config) return;

    const bgOpacityMain = hexToRgba(scoreboardStyle.boxMainColor, scoreboardStyle.opacity);
    const bgOpacityAlt = hexToRgba(scoreboardStyle.boxAltColor, scoreboardStyle.opacity);
    const scaleValue = Math.max(0.5, Math.min(1.5, scoreboardStyle.scale / 100));

    // Update Layout Structure
    scoreboardContainer.style.transform = `scale(${scaleValue})`;
    varContainer.style.transform = `scale(${scaleValue})`;
    
    if (scoreboardStyle.timerPosition === 'Right') {
      scoreboardContainer.classList.add('layout-right');
    } else {
      scoreboardContainer.classList.remove('layout-right');
    }

    // Match Info
    elMatchInfo.style.backgroundColor = bgOpacityAlt;
    elMatchInfo.style.color = scoreboardStyle.textMainColor;
    const matchTextEl = container.querySelector('#preview-match-text');
    if (matchTextEl) matchTextEl.textContent = scoreboardStyle.matchInfo || 'Sb2vn Cup | Match 1';

    // Score Row
    elScoreRow.style.backgroundColor = bgOpacityMain;
    elScoreRow.style.color = scoreboardStyle.textMainColor;
    
    const abbrA = container.querySelector('#preview-abbr-a');
    if (abbrA) abbrA.textContent = config.teamA.abbreviation;
    const scoreA = container.querySelector('#preview-score-a');
    if (scoreA) scoreA.textContent = config.teamA.score.toString();
    const stripA1 = container.querySelector('#preview-strip-a-1') as HTMLDivElement;
    if (stripA1) stripA1.style.backgroundColor = config.teamA.colors.primary;
    const stripA2 = container.querySelector('#preview-strip-a-2') as HTMLDivElement;
    if (stripA2) stripA2.style.backgroundColor = config.teamA.colors.secondary;

    const abbrB = container.querySelector('#preview-abbr-b');
    if (abbrB) abbrB.textContent = config.teamB.abbreviation;
    const scoreB = container.querySelector('#preview-score-b');
    if (scoreB) scoreB.textContent = config.teamB.score.toString();
    const stripB1 = container.querySelector('#preview-strip-b-1') as HTMLDivElement;
    if (stripB1) stripB1.style.backgroundColor = config.teamB.colors.primary;
    const stripB2 = container.querySelector('#preview-strip-b-2') as HTMLDivElement;
    if (stripB2) stripB2.style.backgroundColor = config.teamB.colors.secondary;

    // Timer
    elTimer.style.backgroundColor = bgOpacityMain;
    elTimer.style.color = scoreboardStyle.textMainColor;
    const timerText = container.querySelector('#preview-time');
    if (timerText) {
        const min = Math.floor(timer.seconds / 60);
        const sec = timer.seconds % 60;
        timerText.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    // Extra Time
    elExtraTime.style.backgroundColor = bgOpacityMain;
    elExtraTime.style.color = scoreboardStyle.textAltColor;
    if (extraTime.isVisible && extraTime.minutes > 0) {
        elExtraTime.style.display = 'flex';
        elExtraTime.innerHTML = `<span>+${extraTime.minutes}'</span>`;
    } else {
        // Force it to display for preview purposes, or maybe respect the toggle. 
        // Let's force display for preview so users can always click it.
        elExtraTime.style.display = 'flex';
        if (extraTime.minutes === 0) {
           elExtraTime.innerHTML = `<span>+0'</span>`;
        } else {
           elExtraTime.innerHTML = `<span>+${extraTime.minutes}'</span>`;
        }
    }
    
    // VAR Box
    const varTitle = container.querySelector('#preview-var-title') as HTMLDivElement;
    const varContent = container.querySelector('#preview-var-content') as HTMLDivElement;
    if (varTitle) {
      varTitle.style.backgroundColor = bgOpacityAlt;
      varTitle.style.color = scoreboardStyle.textAltColor;
    }
    if (varContent) {
      varContent.style.backgroundColor = bgOpacityMain;
      varContent.style.color = scoreboardStyle.textMainColor;
    }

    // Players Lists & Game Report
    elPlayersListA.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    elPlayersListA.style.color = scoreboardStyle.textMainColor;
    const playersHeaderA = elPlayersListA.querySelector('.preview-players-header') as HTMLElement;
    if (playersHeaderA) {
       playersHeaderA.textContent = config.teamA.name;
       playersHeaderA.style.color = scoreboardStyle.textAltColor;
    }

    elPlayersListB.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    elPlayersListB.style.color = scoreboardStyle.textMainColor;
    const playersHeaderB = elPlayersListB.querySelector('.preview-players-header') as HTMLElement;
    if (playersHeaderB) {
       playersHeaderB.textContent = config.teamB.name;
       playersHeaderB.style.color = scoreboardStyle.textAltColor;
    }

    elGameReport.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    elGameReport.style.color = scoreboardStyle.textMainColor;
    const reportHeader = elGameReport.querySelector('.preview-report-header') as HTMLElement;
    if (reportHeader) {
      reportHeader.innerHTML = `
        <span>${config.teamA.name}</span>
        <span style="font-size: 1.2em;">${config.teamA.score} - ${config.teamB.score}</span>
        <span>${config.teamB.name}</span>
      `;
      reportHeader.style.borderBottom = '2px solid rgba(255, 255, 255, 0.2)';
    }

    // Re-render details if something is selected
    const selected = container.querySelector('.preview-element.selected') as HTMLElement;
    if (selected) {
      renderDetails(selected.dataset.id || '');
    }
  };

  subscribe(updateUI);
  updateUI();

  return () => {
    unsubscribe(updateUI);
  };
}
