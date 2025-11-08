// Create a container for notifications
const container = document.createElement('div');
container.id = 'notification-container';
container.style.position = 'fixed';
container.style.bottom = '20px';
container.style.left = '20px';
container.style.zIndex = '2000'; // High z-index to be on top
document.body.appendChild(container);

/**
 * Shows a notification message at the bottom-left of the screen.
 * @param message The text to display.
 * @param type The type of notification (e.g., 'success', 'error').
 * @param duration Duration in ms to show the notification.
 */
export function showNotification(
  message: string,
  type: 'success' | 'error' = 'success',
  duration: number = 3000,
) {
  const notif = document.createElement('div');
  notif.className = `notification ${type}`;
  notif.textContent = message;

  // Add to container
  container.appendChild(notif);

  // Animate in
  setTimeout(() => {
    notif.classList.add('show');
  }, 10); // 10ms delay to allow CSS transition

  // Animate out and remove
  setTimeout(() => {
    notif.classList.remove('show');
    // Wait for animation to finish before removing
    notif.addEventListener('transitionend', () => {
      try {
        container.removeChild(notif);
      } catch (e) {
        // Ignore error if already removed
      }
    });
  }, duration);
}