import { useEffect } from 'react';
import { useUIStore } from '../stores/ui-store';
import { useVaultStore } from '../stores/vault-store';
import { cn } from '../shared/lib/utils';
import { Toolbar } from '../shared/layout/Toolbar';
import { Sidebar } from '../shared/layout/Sidebar';
import { SearchBar } from '../features/search';
import { ClipboardList, ClipboardPreview } from '../features/clipboard';
import { SettingsPanel } from '../features/settings/components/SettingsPanel';

export function App() {
  const { settingsOpen, toggleSettings } = useUIStore();
  const { checkStatus } = useVaultStore();

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        toggleSettings();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen, toggleSettings]);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-background text-text-primary rounded-xl">
      <h1 className="sr-only">ORNAS Clipboard Manager</h1>
      
      {/* Left Sidebar - Collections & Tags */}
      <Sidebar />

      {/* Center Panel - History List */}
      <div 
        className={cn(
          "flex flex-col h-full bg-background border-r border-border shrink-0 transition-[width,transform] duration-200 ease-[var(--ease-snappy)]",
          settingsOpen ? "w-[30%] -translate-x-full absolute" : "w-[35%] min-w-[280px]"
        )}
      >
        <Toolbar />
        <SearchBar />
        <ClipboardList />
      </div>

      {/* Right Panel - Preview / Settings */}
      <div className={cn(
        "flex flex-col flex-1 h-full transition-[width,transform] duration-200 ease-[var(--ease-snappy)]",
        settingsOpen ? "w-full bg-background" : "w-full bg-surface"
      )}>
        <ClipboardPreview />
        <SettingsPanel onClose={toggleSettings} />
      </div>
    </main>
  );
}
