import { useState, useEffect } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { ClipDto } from '../../../shared/types';
import { useSetClipLanguage } from '../api/mutations';
import { Check, Type, WrapText, Code2, ChevronDown } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { Button } from '../../../shared/components/Button';

// All languages supported by our backend heuristics
const SUPPORTED_LANGUAGES = [
  { id: 'rust', label: 'Rust' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'yaml', label: 'YAML' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'sql', label: 'SQL' },
  { id: 'bash', label: 'Bash' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
  { id: 'go', label: 'Go' },
  { id: 'php', label: 'PHP' },
  { id: 'text', label: 'Plain Text' }
];

/** Detects whether the current theme resolves to dark mode via data-theme attribute. */
function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(() => {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark') return true;
    if (attr === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return false;
  });

  useEffect(() => {
    const check = () => {
      const attr = document.documentElement.getAttribute('data-theme');
      if (attr === 'dark') setIsDark(true);
      else if (attr === 'system') setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      else setIsDark(false);
    };

    // Observe data-theme attribute changes
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Also listen for OS preference changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', check);

    return () => {
      observer.disconnect();
      mq.removeEventListener('change', check);
    };
  }, []);

  return isDark;
}

interface CodeSnippetPreviewProps {
  clip: ClipDto;
}

export function CodeSnippetPreview({ clip }: CodeSnippetPreviewProps) {
  const [isPlain, setIsPlain] = useState(false);
  const [isWrapped, setIsWrapped] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const isDark = useIsDarkTheme();
  
  const { mutate: setLanguage } = useSetClipLanguage();
  
  const content = clip.content_text ?? clip.preview ?? '';
  const currentLang = clip.language || 'text';
  
  const handleLanguageSelect = (langId: string) => {
    setLanguage({
      id: clip.id,
      language: langId === 'text' ? null : langId,
      language_source: 'manual'
    });
    setIsLangMenuOpen(false);
    if (langId !== 'text') {
      setIsPlain(false);
    }
  };
  
  const activeLangLabel = SUPPORTED_LANGUAGES.find(l => l.id === currentLang)?.label || 'Plain Text';
  const showCode = !isPlain && currentLang !== 'text';
  const prismTheme = isDark ? themes.vsDark : themes.github;
  const lineNumberBorder = isDark ? 'border-white/10' : 'border-black/10';
  
  return (
    <div className="flex flex-col w-full h-full relative">
      {/* Click outside listener */}
      {isLangMenuOpen && (
        <div 
          className="absolute inset-0 z-10 bg-transparent" 
          onClick={() => setIsLangMenuOpen(false)}
        />
      )}
      
      {/* Controls Bar */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-app shrink-0 relative z-20">
        
        {/* Language Selector */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-xs h-8 text-text-secondary hover:text-text-primary"
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            aria-haspopup="listbox"
            aria-expanded={isLangMenuOpen}
          >
            <Code2 size={14} />
            <span>{activeLangLabel}</span>
            <ChevronDown size={14} className={cn("transition-transform duration-200", isLangMenuOpen && "rotate-180")} />
          </Button>
          
          {isLangMenuOpen && (
            <div 
              className="absolute top-full left-0 mt-1 w-48 bg-elevated border border-border rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto z-30"
              role="listbox"
              aria-label="Select language"
            >
              <div className="px-3 py-1 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                Override Language
              </div>
              {SUPPORTED_LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => handleLanguageSelect(lang.id)}
                  role="option"
                  aria-selected={currentLang === lang.id}
                  className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-hover flex items-center justify-between group"
                >
                  <span>{lang.label}</span>
                  {currentLang === lang.id && <Check size={14} className="text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Toggles */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsWrapped(!isWrapped)}
            className={cn(
              "gap-2 text-xs h-8 px-2 transition-colors",
              isWrapped ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-text-secondary hover:text-text-primary"
            )}
            title="Toggle Word Wrap"
          >
            <WrapText size={14} />
            <span className="hidden sm:inline">Wrap</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlain(!isPlain)}
            className={cn(
              "gap-2 text-xs h-8 px-2 transition-colors",
              isPlain ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-text-secondary hover:text-text-primary"
            )}
            title="View as Plain Text"
          >
            <Type size={14} />
            <span className="hidden sm:inline">Plain</span>
          </Button>
        </div>
      </div>
      
      {/* Code Editor Area */}
      <div className="flex-1 overflow-auto bg-muted">
        {showCode ? (
          <Highlight
            theme={prismTheme}
            code={content}
            language={currentLang}
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre 
                className={cn(
                  className, 
                  "m-0 p-4 min-h-full text-[13px] font-mono leading-relaxed flex flex-col",
                )} 
                style={style}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })} className={cn("flex", isWrapped ? "whitespace-pre-wrap break-all" : "whitespace-pre")}>
                    <span className={cn("inline-block w-8 shrink-0 text-right pr-4 select-none opacity-40 text-[11px] border-r mr-4", lineNumberBorder)}>
                      {i + 1}
                    </span>
                    <div className={cn("flex-1", isWrapped ? "whitespace-pre-wrap break-all" : "whitespace-pre")}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        ) : (
          <pre 
            className={cn(
              "m-0 p-4 min-h-full text-[13px] font-mono leading-relaxed text-text-primary",
              isWrapped ? "whitespace-pre-wrap break-all" : "whitespace-pre"
            )}
          >
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}
