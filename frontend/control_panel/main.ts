import { render as renderDashboard } from './pages/dashboard';
import { render as renderCustomization } from './pages/customization';
import { render as renderTeamInfo } from './pages/team-info';
import { render as renderSetting } from './pages/setting';
// *** IMPORT THE STATE MANAGER ***
import { initStateManager } from './stateManager';

// ... (PageModule interface is unchanged) ...
interface PageModule {
  render: (container: HTMLElement) => void;
}

const pages: Record<string, PageModule> = {
  dashboard: { render: renderDashboard },
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

function navigate(pageName: string) {
  // 1. Cleanup the old page first
  if (currentPageCleanup) {
    currentPageCleanup();
    currentPageCleanup = null;
  }
  
  const page = pages[pageName];

  if (page && contentContainer) {
    contentContainer.innerHTML = '';
    
    // 2. Render the new page. The render function *might* return a cleanup function.
    const result = page.render(contentContainer);
    if (typeof result === 'function') {
      currentPageCleanup = result;
    }

    // Update active class
    navLinks.forEach((link) => {
      link.classList.add('active');
      if (link.getAttribute('data-page') === pageName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  } else {
    // ... (error handling) ...
  }
}

// ... (navLinks click listener is unchanged) ...
navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const pageName = (e.target as HTMLElement).getAttribute('data-page');
    if (pageName) {
      navigate(pageName);
    }
  });
});

// --- UPDATED DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', async () => {
  // Load theme first
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }

  // *** INITIALIZE STATE MANAGER ***
  // This fetches config and connects to WebSocket
  await initStateManager();

  // Now render the default page
  navigate('dashboard');
});