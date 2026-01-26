// frontend/control_panel/globalShortcuts.ts
import { 
    timerControls, 
    getState,
    toggleScoreboard,
    toggleMatchInfoVisibility,
    toggleGameReport,
    togglePlayersListA,
    togglePlayersListB,
    setPlayersListVisibility 
} from './stateManager';
import { showNotification } from './notification';

declare global {
    interface Window {
        __isBindingShortcut: boolean;
    }
}

// Track currently held keys
const activeKeys = new Set<string>();

export function normalizeKey(code: string): string {
    if (code === 'ControlLeft' || code === 'ControlRight') return 'Ctrl';
    if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
    if (code === 'AltLeft' || code === 'AltRight') return 'Alt';
    if (code === 'MetaLeft' || code === 'MetaRight') return 'Meta';
    return code;
}

export function generateComboId(keys: Set<string>): string {
    return Array.from(keys).sort().join('+');
}

// --- Updated Function Signature ---
export async function initGlobalShortcuts(enableNotifications: boolean = true) {
    window.__isBindingShortcut = false;

    // 1. Disable Context Menu
    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // 2. Clear keys on window blur
    window.addEventListener('blur', () => {
        activeKeys.clear();
    });

    // 3. Global Key Down
    window.addEventListener('keydown', (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        if (e.ctrlKey || e.altKey || e.metaKey) {
            e.preventDefault();
        }

        if (e.repeat) return;
        if (window.__isBindingShortcut) return;

        const keyName = normalizeKey(e.code);
        activeKeys.add(keyName);

        const comboId = generateComboId(activeKeys);
        if (!comboId) return;

        const { shortcuts } = getState();
        const match = shortcuts.find(s => s.key === comboId);

        if (match) {
            e.preventDefault();
            console.log(`Shortcut triggered: ${match.action_id} [${comboId}]`);
            
            // Helper to conditionally show notification
            const notify = (msg: string) => {
                if (enableNotifications) showNotification(msg);
            };

            switch (match.action_id) {
                case 'toggle_timer':
                    const { timer } = getState();
                    if (timer.isRunning) {
                        timerControls.stop();
                        notify(`Timer Stopped (${match.label})`);
                    } else {
                        timerControls.start();
                        notify(`Timer Started (${match.label})`);
                    }
                    break;

                case 'toggle_scoreboard':
                    toggleScoreboard();
                    notify("Scoreboard toggled via Shortcut");
                    break;

                case 'toggle_match_info':
                    toggleMatchInfoVisibility();
                    notify("Match Info toggled via Shortcut");
                    break;

                case 'toggle_game_report':
                    toggleGameReport();
                    notify("Game Report toggled via Shortcut");
                    break;

                case 'toggle_players_list_a':
                    togglePlayersListA();
                    notify("Team A List toggled via Shortcut");
                    break;

                case 'toggle_players_list_b':
                    togglePlayersListB();
                    notify("Team B List toggled via Shortcut");
                    break;

                case 'toggle_players_list_all':
                    const { isPlayersListVisibleA, isPlayersListVisibleB } = getState();
                    if (isPlayersListVisibleA || isPlayersListVisibleB) {
                        setPlayersListVisibility(false, false);
                        notify("All Lists Hidden via Shortcut");
                    } else {
                        setPlayersListVisibility(true, true);
                        notify("All Lists Shown via Shortcut");
                    }
                    break;
                
                default:
                    notify(`Action triggered: ${match.label}`);
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