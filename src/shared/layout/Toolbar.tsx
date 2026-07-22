import { Settings, Moon, Sun, Monitor } from 'lucide-react';
import { IconButton } from '../components/IconButton';
import { cn } from '../lib/utils';
import { useUIStore } from '../../stores/ui-store';
import { useSettings } from '../../features/settings/hooks/useSettings';
import { Logo } from '../components/Logo';

interface ToolbarProps {
  className?: string;
}

export function Toolbar({ className }: ToolbarProps) {
  const { toggleSettings } = useUIStore();
  const { settings, updateSetting } = useSettings();

  const cycleTheme = () => {
    const current = settings?.theme || 'system';
    const next = current === 'system' ? 'dark' : current === 'dark' ? 'light' : 'system';
    updateSetting({ key: 'theme', value: next });
  };

  return (
    <header 
      data-tauri-drag-region
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-2 border-b border-border bg-background h-11 shrink-0 select-none",
        className
      )}
    >
      <div data-tauri-drag-region className="flex items-center gap-2">
        <Logo className="text-text-primary" />
        <span className="font-semibold text-base tracking-[-0.01em] text-text-primary pointer-events-none font-['Outfit']">
          ORNAS
        </span>
      </div>
      
      <div data-tauri-drag-region className="flex-1" />

      <div data-tauri-drag-region className="flex items-center justify-end gap-3">
        <div className="pointer-events-auto flex items-center gap-1.5">
          <div className="relative group">
            <IconButton
              aria-label="Toggle theme"
              onClick={cycleTheme}
              className="text-text-secondary hover:text-text-primary hover:bg-hover h-8 w-8"
            >
              {(!settings?.theme || settings.theme === 'system') && <Monitor size={17} />}
              {settings?.theme === 'dark' && <Moon size={17} />}
              {settings?.theme === 'light' && <Sun size={17} />}
            </IconButton>
            <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none px-2 py-1 bg-elevated text-text-primary text-[11px] font-medium rounded shadow-md border border-border whitespace-nowrap z-50">
              Theme: {settings?.theme === 'dark' ? 'Dark' : settings?.theme === 'light' ? 'Light' : 'System'}
            </div>
          </div>
          
          <div className="relative group">
            <IconButton 
              aria-label="Settings" 
              onClick={toggleSettings}
              className="text-text-secondary hover:text-text-primary hover:bg-hover h-8 w-8"
            >
              <Settings size={18} />
            </IconButton>
            <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none px-2 py-1 bg-elevated text-text-primary text-[11px] font-medium rounded shadow-md border border-border whitespace-nowrap z-50">
              Settings (Ctrl+,)
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
