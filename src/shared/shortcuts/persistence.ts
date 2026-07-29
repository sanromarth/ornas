import { getSettings, updateSetting } from '../../services/settings';
import { shortcutRegistry } from './registry';

export async function loadShortcutOverrides() {
  try {
    const settings = await getSettings();
    if (settings.custom_shortcuts) {
      shortcutRegistry.loadFromSettings(settings.custom_shortcuts);
    }
  } catch (error) {
    console.error('Failed to load shortcut overrides:', error);
  }
}

export async function saveShortcutOverrides() {
  try {
    const overrides = shortcutRegistry.exportOverrides();
    await updateSetting('custom_shortcuts', JSON.stringify(overrides));
  } catch (error) {
    console.error('Failed to save shortcut overrides:', error);
  }
}
