import { showNotification } from '../notification';

export function render(container: HTMLElement) {
  container.innerHTML = `
    <div class="card">
      <h4>Appearance</h4>
      <div class="form-group theme-toggle">
        <label for="theme-toggle">Dark Mode</label>
        <input type="checkbox" id="theme-toggle">
      </div>
    </div>
  `;

  // --- Add Event Listeners ---
  const toggle = container.querySelector(
    '#theme-toggle',
  ) as HTMLInputElement;

  // Set initial state of the toggle
  toggle.checked = document.body.classList.contains('dark-mode');

  toggle.addEventListener('change', () => {
    if (toggle.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  });
  
  // All connection settings logic has been removed.
}