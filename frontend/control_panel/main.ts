// frontend/control_panel/main.ts
import { render as renderDashboard } from './pages/dashboard';
import { render as renderBroadcast } from './pages/broadcast';
import { render as renderCustomization } from './pages/customization';
import { render as renderTeamInfo } from './pages/team-info';
import { render as renderSetting } from './pages/setting';
import { render as renderDetails } from './pages/details';
import { render as renderShortcuts } from './pages/shortcuts';
import { initGlobalShortcuts } from './globalShortcuts';

import {
  initStateManager,
  stateEmitter,
  CONNECTION_STATUS_EVENT,
  STATE_UPDATE_EVENT,
  getState,
  setScore,
  timerControls
} from './stateManager';
import { showNotification } from './notification';

function formatTime(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60);
  const sec = (totalSeconds % 60).toString().padStart(2, '0');
  const min = (totalMinutes < 100) ? totalMinutes.toString().padStart(2, '0') : totalMinutes.toString();
  return `${min}:${sec}`;
}

function formatScore(score: number): string {
  if (score < 0) score = 0;
  return score.toString().padStart(2, '0');
}

interface PageModule {
  render: (container: HTMLElement) => void | (() => void);
}

const pages: Record<string, PageModule> = {
  dashboard: { render: renderDashboard },
  broadcast: { render: renderBroadcast },
  customization: { render: renderCustomization },
  'team-info': { render: renderTeamInfo },
  setting: { render: renderSetting },
  details: { render: renderDetails },
  shortcuts: { render: renderShortcuts },
};

const contentContainer = document.getElementById('app-content') as HTMLElement;
const navLinks = document.querySelectorAll('.nav-link');

let currentPageCleanup: (() => void) | null = null;

export function navigate(pageName: string) {
  if (currentPageCleanup) {
    currentPageCleanup();
    currentPageCleanup = null;
  }

  const page = pages[pageName];

  if (page && contentContainer) {
    contentContainer.innerHTML = '';
    const result = page.render(contentContainer);
    if (typeof result === 'function') {
      currentPageCleanup = result;
    }

    navLinks.forEach((link) => {
      if (link.getAttribute('data-page') === pageName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  } else {
    console.error(`Page "${pageName}" not found.`);
    contentContainer.innerHTML = `<p>Error: Page not found.</p>`;
  }
}

navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const pageName = (e.target as HTMLElement).getAttribute('data-page');
    if (pageName) {
      navigate(pageName);
    }
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }

  const copyBtn = document.getElementById('copy-overlay-link');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const overlayUrl = 'http://localhost:8001/overlay/index.html';
      navigator.clipboard.writeText(overlayUrl)
        .then(() => { showNotification('Overlay URL copied!'); })
        .catch((err) => { showNotification('Failed to copy URL', 'error'); });
    });
  }

  const statusIndicator = document.getElementById('status-indicator') as HTMLDivElement;
  if (statusIndicator) {
    stateEmitter.addEventListener(CONNECTION_STATUS_EVENT, (event) => {
      const isConnected = (event as CustomEvent).detail;
      if (isConnected) {
        statusIndicator.classList.remove('disconnected');
        statusIndicator.classList.add('connected');
        statusIndicator.title = 'Connected';
      } else {
        statusIndicator.classList.remove('connected');
        statusIndicator.classList.add('disconnected');
        statusIndicator.title = 'Disconnected';
      }
    });
  }

  const miniScoreA = document.getElementById('mini-score-a') as HTMLButtonElement;
  const miniScoreB = document.getElementById('mini-score-b') as HTMLButtonElement;
  const miniTimerBtn = document.getElementById('mini-timer-btn') as HTMLButtonElement;

  const stripAPrimary = document.getElementById('mini-strip-a-primary') as HTMLDivElement;
  const stripASecondary = document.getElementById('mini-strip-a-secondary') as HTMLDivElement;
  const stripBPrimary = document.getElementById('mini-strip-b-primary') as HTMLDivElement;
  const stripBSecondary = document.getElementById('mini-strip-b-secondary') as HTMLDivElement;

  if (miniScoreA && miniScoreB && miniTimerBtn) {
    miniScoreA.addEventListener('click', () => {
        const { config } = getState();
        if (config) setScore('teamA', config.teamA.score + 1);
    });

    miniScoreB.addEventListener('click', () => {
        const { config } = getState();
        if (config) setScore('teamB', config.teamB.score + 1);
    });

    miniTimerBtn.addEventListener('click', () => {
        const { timer } = getState();
        if (timer.isRunning) timerControls.stop();
        else timerControls.start();
    });

    const updateMiniScoreboard = () => {
      const { config, timer } = getState();

      if (config) {
        miniScoreA.textContent = formatScore(config.teamA.score);
        miniScoreB.textContent = formatScore(config.teamB.score);

        if (stripAPrimary) stripAPrimary.style.backgroundColor = config.teamA.colors.primary;
        if (stripASecondary) stripASecondary.style.backgroundColor = config.teamA.colors.secondary;
        if (stripBPrimary) stripBPrimary.style.backgroundColor = config.teamB.colors.primary;
        if (stripBSecondary) stripBSecondary.style.backgroundColor = config.teamB.colors.secondary;
      } else {
        miniScoreA.textContent = '00';
        miniScoreB.textContent = '00';
      }

      miniTimerBtn.textContent = formatTime(timer.seconds);
      
      if (timer.isRunning) {
          miniTimerBtn.classList.add('timer-running');
          miniTimerBtn.classList.remove('timer-stopped');
      } else {
          miniTimerBtn.classList.add('timer-stopped');
          miniTimerBtn.classList.remove('timer-running');
      }
    };

    stateEmitter.addEventListener(STATE_UPDATE_EVENT, updateMiniScoreboard);
    updateMiniScoreboard();
  }

  await initStateManager();
  
  // --- Initialize Shortcuts: TRUE = Enable Notifications ---
  await initGlobalShortcuts(true);
  
  navigate('dashboard');
});