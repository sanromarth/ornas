import { useEffect, lazy, Suspense } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useUIStore } from '../stores/ui-store';
import { useVaultStore } from '../stores/vault-store';
import { Toolbar } from '../shared/layout/Toolbar';
import { useSettings } from '../features/settings/hooks/useSettings';
import { Sidebar } from '../shared/layout/Sidebar';
import { SearchBar } from '../features/search';
import { ClipboardList, ClipboardPreview, FilterContextHeader } from '../features/clipboard';
import { SettingsPanel } from '../features/settings/components/SettingsPanel';
import { useClipboardEvents } from '../features/clipboard/hooks/useClipboardEvents';
import { useResizablePanel } from '../shared/hooks/useResizablePanel';
import { PanelSplitter } from '../shared/components/PanelSplitter';
import { WelcomeOverlay } from '../features/onboarding/components/WelcomeOverlay';
import { BulkActionToolbar } from '../features/clipboard/components/BulkActionToolbar';
import { useGlobalShortcuts, loadShortcutOverrides } from '../shared/shortcuts';
import { useAppActions } from '../shared/actions';

const CommandPalette = lazy(() => import('../features/command-palette').then(m => ({ default: m.CommandPalette })));
const CheatSheet = lazy(() => import('../features/cheat-sheet').then(m => ({ default: m.CheatSheet })));

/**
 * Panel width constraints (from RESPONSIVE_DESKTOP_GUIDELINES.md):
 *
 * Sidebar:      Min 200px, Max 350px, collapsible via Ctrl+B
 * List Panel:   Min 280px, Max 500px
 * Preview:      Fluid (flex-grow), minimum 400px before horizontal scrolling
 */
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 350;
const SIDEBAR_DEFAULT = 240;
const LIST_MIN = 280;
const LIST_MAX = 500;
const LIST_DEFAULT = 320;

export function App() {
  const toggleSettings = useUIStore((s) => s.toggleSettings);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const cheatSheetOpen = useUIStore((s) => s.cheatSheetOpen);
  const { checkStatus } = useVaultStore();
  const { settings } = useSettings();

  // Subscribe to backend clipboard events (clip-created, clip-updated, clip-deleted)
  useClipboardEvents();

  // Wire global keyboard shortcuts and app actions
  useGlobalShortcuts();
  useAppActions();

  useEffect(() => {
    loadShortcutOverrides().catch(console.error);
  }, []);

  // ── Resizable Panels ──
  const sidebar = useResizablePanel({
    storageKey: 'ornas_sidebar_width',
    defaultWidth: SIDEBAR_DEFAULT,
    minWidth: SIDEBAR_MIN,
    maxWidth: SIDEBAR_MAX,
    collapsible: true,
    collapsedStorageKey: 'ornas_sidebar_collapsed',
  });

  const listPanel = useResizablePanel({
    storageKey: 'ornas_list_width',
    defaultWidth: LIST_DEFAULT,
    minWidth: LIST_MIN,
    maxWidth: LIST_MAX,
  });

  // Sync sidebar collapsed state with UI store
  useEffect(() => {
    if (sidebarOpen === sidebar.isCollapsed) {
      sidebar.setCollapsed(!sidebarOpen);
    }
  }, [sidebarOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const storeOpen = !sidebar.isCollapsed;
    if (useUIStore.getState().sidebarOpen !== storeOpen) {
      // Keep store in sync when hook state changes (e.g. from localStorage restore)
      useUIStore.setState({ sidebarOpen: storeOpen });
    }
  }, [sidebar.isCollapsed]);

  useEffect(() => {
    // Initialize if not present
    if (!localStorage.getItem('ornas_last_focused_at')) {
      localStorage.setItem('ornas_last_focused_at', Date.now().toString());
    }

    let timeoutId: number;
    const unlisten = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      if (!focused) {
        localStorage.setItem('ornas_last_focused_at', Date.now().toString());
        window.dispatchEvent(new Event('ornas-focus-changed'));
      } else {
        // Clear "new" indicators 3 seconds after focusing
        timeoutId = window.setTimeout(() => {
          localStorage.setItem('ornas_last_focused_at', Date.now().toString());
          window.dispatchEvent(new Event('ornas-focus-changed'));
        }, 3000);
      }
    });

    return () => {
      unlisten.then(f => f());
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    const theme = settings?.theme || 'system';
    document.documentElement.setAttribute('data-theme', theme);

    // Listen for system preference changes when using "system" theme
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => document.documentElement.setAttribute('data-theme', 'system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings?.theme]);

  useEffect(() => {
    // Disable default browser context menu to prevent accidental image URL copying
    // (Shift+RightClick still allows it for debugging)
    const handleContextMenu = (e: MouseEvent) => {
      if (!e.shiftKey) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-app text-text-primary">
      <h1 className="sr-only">ORNAS Clipboard Manager</h1>

      {/* Left Sidebar — always rendered, width transitions for smooth collapse */}
      <div
        className="ornas-sidebar-panel h-full outline-none"
        data-panel="sidebar"
        tabIndex={-1}
        data-collapsed={sidebar.isCollapsed ? 'true' : 'false'}
        style={{ width: sidebar.isCollapsed ? 0 : sidebar.width }}
        aria-hidden={sidebar.isCollapsed}
      >
        <Sidebar />
      </div>

      {/* Sidebar ↔ List Splitter */}
      {!sidebar.isCollapsed && <PanelSplitter {...sidebar.splitterProps} />}

      {/* Center Panel - History List */}
      <div
        className="flex flex-col h-full bg-surface border-r border-border shrink-0 overflow-hidden outline-none"
        data-panel="list"
        tabIndex={-1}
        style={{ width: listPanel.width }}
      >
        <Toolbar />
        <SearchBar />
        <FilterContextHeader />
        <ClipboardList />
      </div>

      {/* List ↔ Preview Splitter */}
      <PanelSplitter onMouseDown={listPanel.splitterProps.onMouseDown} />

      {/* Right Panel - Preview */}
      <div
        className="flex flex-col flex-1 h-full bg-background min-w-0 overflow-hidden outline-none"
        data-panel="preview"
        tabIndex={-1}
      >
        <ClipboardPreview />
      </div>

      {/* Global Modals */}
      <BulkActionToolbar />
      <SettingsPanel onClose={toggleSettings} />
      <WelcomeOverlay />
      <Suspense fallback={null}>
        {commandPaletteOpen && <CommandPalette />}
        {cheatSheetOpen && <CheatSheet />}
      </Suspense>
    </main>
  );
}
