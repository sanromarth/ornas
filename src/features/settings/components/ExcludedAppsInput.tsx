import { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function ExcludedAppsInput({ value, onChange, className, placeholder }: Props) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse the comma-separated string into an array of trimmed, non-empty, unique strings
  const apps = value
    .split(',')
    .map(app => app.trim())
    .filter(app => app.length > 0)
    .filter((app, index, self) => self.indexOf(app) === index);

  const updateBackendString = (newApps: string[]) => {
    // Join with a comma and a space for readability
    onChange(newApps.join(', '));
  };

  const handleAdd = (appToAdd: string) => {
    const trimmed = appToAdd.trim();
    if (!trimmed) return;
    
    // Deduplicate
    if (!apps.includes(trimmed)) {
      updateBackendString([...apps, trimmed]);
    }
    setInputValue('');
  };

  const handleRemove = (appToRemove: string) => {
    updateBackendString(apps.filter(app => app !== appToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(inputValue);
    } else if (e.key === ',' && inputValue.trim().length > 0) {
      // Note: we can allow commas inside names if they paste, but typing comma usually means separate tag
      e.preventDefault();
      handleAdd(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && apps.length > 0) {
      // Remove last item
      handleRemove(apps[apps.length - 1]);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue.trim()) {
      handleAdd(inputValue);
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-wrap items-center gap-1.5 min-h-[36px] w-full rounded-md border bg-background px-2 py-1.5 text-sm text-text-primary shadow-sm transition-all duration-100 ease-out cursor-text",
        isFocused ? "border-transparent ring-2 ring-focus-ring" : "border-border",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {apps.map((app) => (
        <span 
          key={app} 
          className="flex items-center gap-1 px-2 py-0.5 bg-surface border border-border rounded-md text-xs font-medium"
        >
          {app}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove(app);
            }}
            className="text-text-tertiary hover:text-text-primary focus:outline-none transition-colors rounded-sm focus-visible:ring-1 focus-visible:ring-focus-ring"
            aria-label={`Remove ${app}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder={apps.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] bg-transparent border-none p-0 h-6 text-sm focus:outline-none focus:ring-0 placeholder:text-text-secondary"
      />
    </div>
  );
}
