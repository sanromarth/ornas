import { Settings } from 'lucide-react';
import { IconButton } from '../components/IconButton';
import { cn } from '../lib/utils';
import { useUIStore } from '../../stores/ui-store';
import OrnasLogo from '../../assets/logo.svg';

interface ToolbarProps {
  className?: string;
}

export function Toolbar({ className }: ToolbarProps) {
  const { toggleSettings } = useUIStore();

  return (
    <header 
      data-tauri-drag-region
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-2 border-b border-border bg-background h-11 shrink-0 select-none",
        className
      )}
    >
      <div data-tauri-drag-region className="flex items-center gap-2">
        <img src={OrnasLogo} alt="ORNAS Logo" className="w-5 h-5 pointer-events-none" />
        <span className="font-semibold text-base tracking-[-0.01em] text-text-primary pointer-events-none font-['Outfit']">
          ORNAS
        </span>
      </div>
      
      <div data-tauri-drag-region className="flex-1" />

      <div data-tauri-drag-region className="flex items-center justify-end gap-2">
        <div className="pointer-events-auto">
          <IconButton 
            aria-label="Settings" 
            onClick={toggleSettings}
            className="text-text-secondary hover:text-text-primary h-8 w-8 min-w-[32px] min-h-[32px]"
          >
            <Settings size={20} />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
