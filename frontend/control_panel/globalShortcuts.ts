// frontend/control_panel/globalShortcuts.ts
import { timerControls, getState } from './stateManager';
import { showNotification } from './notification';

declare global {
    interface Window {
        __isBindingShortcut: boolean;
    }
}

// Track currently held keys
const activeKeys = new Set<string>();

/**
 * Maps raw event codes to user-friendly canonical names.
 * Merges Left/Right modifiers into single keys.
 */
export function normalizeKey(code: string): string {
    if (code === 'ControlLeft' || code === 'ControlRight') return 'Ctrl';
    if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
    if (code === 'AltLeft' || code === 'AltRight') return 'Alt';
    if (code === 'MetaLeft' || code === 'MetaRight') return 'Meta';
    return code;
}

/**
 * Generates the canonical ID for a set of keys.
 * Sorts them alphabetically to ensure order doesn't matter.
 * e.g. {KeyA, KeyB} -> "KeyA+KeyB"
 */
export function generateComboId(keys: Set<string>): string {
    return Array.from(keys).sort().join('+');
}

export async function initGlobalShortcuts() {
    window.__isBindingShortcut = false;

    // 1. Disable Context Menu
    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // 2. Clear keys on window blur to prevent "stuck" keys
    window.addEventListener('blur', () => {
        activeKeys.clear();
    });

    // 3. Global Key Down
    window.addEventListener('keydown', (e) => {
        // A. Ignore inputs
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        // B. Block default browser actions for modifiers
        if (e.ctrlKey || e.altKey || e.metaKey) {
            e.preventDefault();
        }

        // C. Ignore if repeat (Hardware auto-repeat)
        // This solves the "Trigger only once" requirement
        if (e.repeat) return;

        // D. Ignore if binding
        if (window.__isBindingShortcut) return;

        // E. Update State
        const keyName = normalizeKey(e.code);
        activeKeys.add(keyName);

        // F. Check Match
        const comboId = generateComboId(activeKeys);
        if (!comboId) return;

        const { shortcuts } = getState();
        const match = shortcuts.find(s => s.key === comboId);

        if (match) {
            e.preventDefault();
            console.log(`Shortcut triggered: ${match.action_id} [${comboId}]`);
            
            switch (match.action_id) {
                case 'toggle_timer':
                    const { timer } = getState();
                    if (timer.isRunning) {
                        timerControls.stop();
                        showNotification(`Timer Stopped (${match.label})`);
                    } else {
                        timerControls.start();
                        showNotification(`Timer Started (${match.label})`);
                    }
                    break;
                
                default:
                    showNotification(`Action: ${match.label}`);
                    break;
            }
        }
    });

    // 4. Global Key Up
    window.addEventListener('keyup', (e) => {
        const keyName = normalizeKey(e.code);
        activeKeys.delete(keyName);
    });
}