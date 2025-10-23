import { render as renderDashboard } from './pages/dashboard';
import { render as renderBroadcast } from './pages/broadcast';
import { render as renderCustomization } from './pages/customization';
import { render as renderTeamInfo } from './pages/team-info';
import { render as renderSetting } from './pages/setting';
import {
  initStateManager,
  stateEmitter,
  CONNECTION_STATUS_EVENT,
  STATE_UPDATE_EVENT,
  getState
} from './stateManager';
import { showNotification } from './notification';

function formatTime(totalSeconds: number): string {
  const min = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const sec = (totalSeconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

function formatScore(score: number): string {
  if (score < 0) score = 0;
  return score.toString().padStart(2, '0');
}

// Define the shape of a page module
interface PageModule {
  render: (container: HTMLElement) => void | (() => void);
}

// Map page names to their render functions
const pages: Record<string, PageModule> = {
  dashboard: { render: renderDashboard },
  broadcast: { render: renderBroadcast },
  customization: { render: renderCustomization },
  'team-info': { render: renderTeamInfo },
  setting: { render: renderSetting },
};

const contentContainer = document.getElementById(
  'app-content',
) as HTMLElement;
const navLinks = document.querySelectorAll('.nav-link');

// Store the currently active page's cleanup function
let currentPageCleanup: (() => void) | null = null;

/**
 * Main navigation function
 */
function navigate(pageName: string) {
  // 1. Cleanup the old page first
  if (currentPageCleanup) {
    currentPageCleanup();
    currentPageCleanup = null;
  }

  const page = pages[pageName];

  if (page && contentContainer) {
    // Clear current content
    contentContainer.innerHTML = '';
    
    // 2. Render the new page. It might return a cleanup function.
    const result = page.render(contentContainer);
    if (typeof result === 'function') {
      currentPageCleanup = result;
    }

    // Update active class on nav links
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

// Add click event listeners to sidebar links
navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const pageName = (e.target as HTMLElement).getAttribute('data-page');
    if (pageName) {
      navigate(pageName);
    }
  });
});

/**
 * Main app initialization on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Load theme first
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }

  // Add Copy Link functionality
  const copyBtn = document.getElementById('copy-overlay-link');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const overlayUrl = `${window.location.origin}/overlay/`;
      navigator.clipboard
        .writeText(overlayUrl)
        .then(() => {
          showNotification('Overlay URL copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy URL: ', err);
          showNotification('Failed to copy URL', 'error');
        });
    });
  }

  // Add Status Indicator logic
  const statusIndicator = document.getElementById('status-indicator') as HTMLDivElement;
  if (statusIndicator) {
    // Listen for connection status changes from the state manager
    stateEmitter.addEventListener(CONNECTION_STATUS_EVENT, (event) => {
      try {
        // *** ADDED THIS LOG ***
        console.log('Status listener fired!', event);
        
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
      } catch (e) {
        console.error('Error in status listener:', e);
      }
    });
  } else {
    console.error('Could not find #status-indicator element!');
  }

  const miniScoreA = document.getElementById('mini-score-a') as HTMLElement;
  const miniScoreB = document.getElementById('mini-score-b') as HTMLElement;
  const miniTimer = document.getElementById('mini-timer') as HTMLElement;

  const stripAPrimary = document.getElementById('mini-strip-a-primary') as HTMLDivElement;
  const stripASecondary = document.getElementById('mini-strip-a-secondary') as HTMLDivElement;
  const stripBPrimary = document.getElementById('mini-strip-b-primary') as HTMLDivElement;
  const stripBSecondary = document.getElementById('mini-strip-b-secondary') as HTMLDivElement;

  if (miniScoreA && miniScoreB && miniTimer) {
    // Function to update the mini scoreboard
    const updateMiniScoreboard = () => {
      const { config, timer } = getState();

      if (config) {
        miniScoreA.textContent = formatScore(config.teamA.score);
        miniScoreB.textContent = formatScore(config.teamB.score);

        // *** 2. SET STRIP COLORS ***
        if (stripAPrimary) stripAPrimary.style.backgroundColor = config.teamA.colors.primary;
        if (stripASecondary) stripASecondary.style.backgroundColor = config.teamA.colors.secondary;
        if (stripBPrimary) stripBPrimary.style.backgroundColor = config.teamB.colors.primary;
        if (stripBSecondary) stripBSecondary.style.backgroundColor = config.teamB.colors.secondary;
      } else {
        miniScoreA.textContent = '00';
        miniScoreB.textContent = '00';
        miniScoreA.style.color = 'var(--text-color)';
        miniScoreB.style.color = 'var(--text-color)';
      }

      miniTimer.textContent = formatTime(timer.seconds);
    };

    // Listen for all state updates (scores, timer, etc.)
    stateEmitter.addEventListener(STATE_UPDATE_EVENT, updateMiniScoreboard);

    // Run once immediately to set the default 00:00 / 00 - 00
    updateMiniScoreboard();
  }

  // Initialize State Manager
  // This connects to the WebSocket and will trigger the first connection event
  await initStateManager();

  // Now render the default page
  navigate('dashboard');
});