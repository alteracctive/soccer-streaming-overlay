// frontend/control_panel/pages/shortcuts.ts
import { saveShortcut, getState, subscribe, unsubscribe } from '../stateManager';
import { showNotification } from '../notification';
import { normalizeKey, generateComboId } from '../globalShortcuts'; // Import helpers

export function render(container: HTMLElement) {
  let listeningForActionId: string | null = null;
  
  // Track keys being held during binding
  let bindingHeldKeys = new Set<string>();

  container.innerHTML = `
    <div class="card">
        <h4>Keyboard Shortcuts</h4>
        <p style="font-size: 13px; opacity: 0.8; margin-bottom: 20px;">
            Click a button to rebind. Hold up to 3 keys (e.g. <b>A+S+D</b> or <b>Ctrl+Shift+Space</b>).<br>
            Release keys to save. Press <b>Escape</b> to clear.
        </p>
        
        <table class="shortcuts-table" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
                    <th style="padding: 10px;">Action</th>
                    <th style="padding: 10px; width: 250px; text-align: center;">Key Binding</th>
                </tr>
            </thead>
            <tbody id="shortcuts-list-body">
                </tbody>
        </table>
    </div>
  `;

  const listBody = container.querySelector('#shortcuts-list-body') as HTMLTableSectionElement;

  const renderList = () => {
      const { shortcuts } = getState();

      if (shortcuts.length === 0) {
          listBody.innerHTML = `<tr><td colspan="2" style="padding: 20px; text-align: center;">Loading shortcuts...</td></tr>`;
          return;
      }

      listBody.innerHTML = shortcuts.map(s => {
          const isListening = listeningForActionId === s.action_id;
          
          let display = s.key 
            ? `<code style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px;">${s.key}</code>` 
            : '<span style="opacity: 0.5; font-style: italic;">None</span>';

          const btnClass = isListening ? 'btn-green' : 'btn-secondary';
          
          // While listening, show what the user is currently holding
          if (isListening) {
              if (bindingHeldKeys.size > 0) {
                  display = `<code style="background: rgba(40, 167, 69, 0.2); border: 1px solid var(--green); padding: 2px 6px; border-radius: 4px;">${generateComboId(bindingHeldKeys)}</code>`;
              } else {
                  display = "Type keys...";
              }
          }

          return `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 10px;">${s.label}</td>
                <td style="padding: 10px; text-align: center;">
                    <button class="${btnClass} shortcut-btn" data-id="${s.action_id}" style="min-width: 140px;">
                        ${display}
                    </button>
                </td>
            </tr>
          `;
      }).join('');

      // Re-attach button listeners
      listBody.querySelectorAll('.shortcut-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
              const target = e.currentTarget as HTMLButtonElement;
              const id = target.dataset.id;
              if (id) {
                  if (listeningForActionId === id) {
                      stopListening();
                  } else {
                      startListening(id);
                  }
                  renderList();
              }
          });
      });
  };

  const startListening = (id: string) => {
      listeningForActionId = id;
      bindingHeldKeys.clear();
      window.__isBindingShortcut = true; // Disable global listeners
  };

  const stopListening = () => {
      listeningForActionId = null;
      bindingHeldKeys.clear();
      window.__isBindingShortcut = false; // Re-enable global listeners
  };

  // --- Binding Logic ---
  
  const handleKeyDown = (e: KeyboardEvent) => {
      if (!listeningForActionId) return;
      
      e.preventDefault();
      e.stopPropagation();

      // Cancel on Escape
      if (e.code === 'Escape') {
          saveBinding(listeningForActionId, null);
          return;
      }

      // Add key if not already present
      const keyName = normalizeKey(e.code);
      if (!bindingHeldKeys.has(keyName)) {
          // Check limit
          if (bindingHeldKeys.size >= 3) {
              // Option: Replace oldest or just ignore? 
              // Ignoring feels better for stability
              showNotification("Max 3 keys reached", "error");
              return;
          }
          bindingHeldKeys.add(keyName);
          renderList(); // Update UI to show current combo
      }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
      if (!listeningForActionId) return;
      
      e.preventDefault();
      
      // The moment a key is lifted, we finalize the combo that was being held
      // (This is standard behavior for combo recording)
      if (bindingHeldKeys.size > 0) {
          const comboId = generateComboId(bindingHeldKeys);
          saveBinding(listeningForActionId, comboId);
      }
  };

  const saveBinding = async (actionId: string, key: string | null) => {
      stopListening();

      // Check duplicate
      if (key) {
          const existing = getState().shortcuts.find(s => s.action_id === actionId);
          if (existing && existing.key === key) {
              renderList();
              return;
          }
      }

      try {
          await saveShortcut(actionId, key);
          showNotification(`Shortcut saved: ${key || 'Cleared'}`);
          // State update triggers renderList via subscribe
      } catch (error) {
          showNotification('Failed to save shortcut', 'error');
          renderList();
      }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  subscribe(renderList);
  renderList();

  return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      unsubscribe(renderList);
      window.__isBindingShortcut = false; 
  };
}