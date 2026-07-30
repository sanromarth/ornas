import { useState, useEffect } from 'react';
import { 
  ExternalLink, RefreshCw, Shield, 
  Github, BookOpen, Bug, Heart, CheckCircle2, AlertTriangle, AlertCircle
} from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { Dialog } from '../../../shared/components/Dialog';
import { openUrl } from '@tauri-apps/plugin-opener';
import { getVersion } from '@tauri-apps/api/app';

interface UpdateData {
  version: string;
  publishedAt: string;
  releaseNotes: string;
  url: string;
}

export function AboutSection() {
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [updateData, setUpdateData] = useState<UpdateData | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.0-rc1');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getVersion().then((v) => setCurrentVersion(v)).catch(() => {});
  }, []);

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    setUpdateStatus(null);
    try {
      // Fast timeout in case GitHub is unreachable or offline
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('https://api.github.com/repos/sanromarth/ornas/releases/latest', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch releases');
      }

      const data = await response.json();
      const latestTag = data.tag_name || '';
      // Normalizing: remove leading 'v' for comparison
      const normalizedLatest = latestTag.startsWith('v') ? latestTag.slice(1) : latestTag;

      if (normalizedLatest === currentVersion || !normalizedLatest) {
        setUpdateStatus({ message: `✓ You're running the latest version of ORNAS.`, type: 'success' });
      } else {
        // Newer version exists!
        setUpdateData({
          version: latestTag,
          publishedAt: new Date(data.published_at).toLocaleDateString(),
          releaseNotes: data.body || 'No release notes provided.',
          url: data.html_url
        });
        setUpdateStatus({ message: `⬆ ORNAS ${latestTag} is available.`, type: 'info' });
        setIsUpdateDialogOpen(true);
      }
    } catch {
      setUpdateStatus({ message: 'Unable to reach GitHub. Please try again later.', type: 'error' });
    } finally {
      setCheckingUpdates(false);
    }
  };

  const openUrlFunc = async (url: string) => {
    try {
      await openUrl(url);
    } catch {
      setFallbackUrl(url);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 text-text-primary flex flex-col items-center animate-[ornas-slide-in-up_250ms_ease-out_both]">
      
      {/* ── Hero / Logo Area ── */}
      <div className="relative w-24 h-24 mb-6 group cursor-default">
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
        <div className="relative w-full h-full bg-gradient-to-b from-primary/80 to-primary rounded-3xl shadow-xl flex flex-col items-center justify-center border border-white/10 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
          {/* Subtle clipboard clip detail */}
          <div className="absolute top-0 w-8 h-1.5 bg-white/25 rounded-b-md shadow-sm" />
          <span className="text-5xl font-bold text-white tracking-tighter drop-shadow-sm select-none mt-2">
            O
          </span>
        </div>
      </div>

      <div className="text-center space-y-1.5 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">ORNAS</h2>
        <p className="text-sm font-medium text-text-secondary">Never Lose a Copy.</p>
      </div>

      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="px-3 py-1 rounded-full bg-surface border border-border text-xs font-mono font-medium text-text-secondary shadow-sm select-text">
          v{currentVersion}
        </div>
        <span className="text-border">—</span>
        <div className="text-xs text-text-tertiary font-mono select-text">
          Build 2026.07.rc1
        </div>
      </div>

      {/* ── Update Controls ── */}
      <div className="w-full flex flex-col items-center mb-10 min-h-[60px]">
        <div className="flex flex-col items-center gap-3 w-full">
          {!updateStatus ? (
            <Button
              variant="secondary"
              size="md"
              onClick={handleCheckUpdates}
              loading={checkingUpdates}
              className="w-full sm:w-auto shadow-sm rounded-full px-6"
            >
              {!checkingUpdates && <RefreshCw size={14} className="mr-2 text-text-secondary" />}
              {checkingUpdates ? 'Checking for updates...' : 'Check for Updates'}
            </Button>
          ) : (
            <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full border animate-in fade-in slide-in-from-top-2 duration-300 ${
              updateStatus.type === 'success' ? 'text-success bg-success/10 border-success/20' :
              updateStatus.type === 'error' ? 'text-text-secondary bg-surface border-border' :
              'text-primary bg-primary/10 border-primary/20'
            }`}>
              {updateStatus.type === 'success' && <CheckCircle2 size={16} />}
              {updateStatus.type === 'error' && <AlertTriangle size={16} className="text-text-tertiary" />}
              {updateStatus.type === 'info' && <RefreshCw size={16} />}
              <span className="font-medium">{updateStatus.message}</span>
              {updateStatus.type === 'info' && (
                <button 
                  onClick={() => setIsUpdateDialogOpen(true)}
                  className="ml-2 underline hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                >
                  View Details
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Links Card ── */}
      <div className="w-full bg-surface border border-border rounded-xl shadow-sm overflow-hidden mb-10">
        <LinkRow 
          icon={<Github size={16} />} 
          label="GitHub Repository" 
          url="https://github.com/sanromarth/ornas" 
          onOpen={openUrlFunc}
        />
        <div className="h-px bg-border ml-12" />
        <LinkRow 
          icon={<BookOpen size={16} />} 
          label="Documentation" 
          url="https://github.com/sanromarth/ornas#readme" 
          onOpen={openUrlFunc}
        />
        <div className="h-px bg-border ml-12" />
        <LinkRow 
          icon={<Bug size={16} />} 
          label="Report an Issue" 
          url="https://github.com/sanromarth/ornas/issues/new/choose" 
          onOpen={openUrlFunc}
        />
        <div className="h-px bg-border ml-12" />
        <LinkRow 
          icon={<Shield size={16} />} 
          label="Privacy Statement" 
          url="https://github.com/sanromarth/ornas/blob/main/PRIVACY.md" 
          onOpen={openUrlFunc}
        />
      </div>

      {/* ── Footer ── */}
      <div className="flex flex-col items-center gap-2 text-xs text-text-tertiary text-center">
        <p>Licensed under MIT License • Open Source & Privacy-First</p>
        <p className="flex items-center justify-center gap-1.5">
          Crafted with <Heart size={13} className="text-danger fill-danger/20" /> for keyboard productivity
        </p>
      </div>

      {/* ── Modals ── */}
      <Dialog
        isOpen={isUpdateDialogOpen}
        onClose={() => setIsUpdateDialogOpen(false)}
        title="Update Available"
      >
        {updateData && (
          <div className="space-y-4 text-text-primary">
            <div className="flex justify-between items-end border-b border-border pb-3">
              <div>
                <div className="text-sm text-text-secondary font-medium">New Version</div>
                <div className="text-xl font-bold">{updateData.version}</div>
              </div>
              <div className="text-sm text-text-tertiary text-right">
                Published {updateData.publishedAt}
              </div>
            </div>
            
            <div className="bg-surface border border-border rounded-lg p-4 max-h-[200px] overflow-y-auto text-sm">
              <pre className="font-sans whitespace-pre-wrap">{updateData.releaseNotes}</pre>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setIsUpdateDialogOpen(false)}>
                Later
              </Button>
              <Button variant="primary" onClick={() => {
                setIsUpdateDialogOpen(false);
                openUrlFunc(updateData.url);
              }}>
                Download Update
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        isOpen={!!fallbackUrl}
        onClose={() => { setFallbackUrl(null); setCopied(false); }}
        title="Could Not Open Link"
      >
        <div className="space-y-4 text-text-primary">
          <div className="flex items-start gap-3 bg-danger/10 border border-danger/20 rounded-lg p-4 text-sm">
            <AlertCircle className="text-danger shrink-0 mt-0.5" size={18} />
            <p>
              Unable to open your default browser.
              <br className="mb-1" />
              You can copy the link below and open it manually.
            </p>
          </div>
          <div className="flex justify-end pt-2 gap-3">
            <Button variant="secondary" onClick={() => { setFallbackUrl(null); setCopied(false); }}>
              Close
            </Button>
            <Button variant="primary" onClick={() => {
              if (fallbackUrl) {
                navigator.clipboard.writeText(fallbackUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ── Subcomponents ──

interface LinkRowProps {
  icon: React.ReactNode;
  label: string;
  url: string;
  onOpen: (url: string) => void;
}

function LinkRow({ icon, label, url, onOpen }: LinkRowProps) {
  return (
    <button
      onClick={() => onOpen(url)}
      className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-hover active:scale-[0.99] active:bg-black/5 dark:active:bg-white/5 transition-all duration-200 ease-[var(--ease-snappy)] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
    >
      <div className="flex items-center gap-3">
        <div className="text-text-tertiary group-hover:text-text-primary transition-colors duration-200">
          {icon}
        </div>
        <span className="text-[13px] font-medium text-text-primary">{label}</span>
      </div>
      <ExternalLink 
        size={14} 
        className="text-text-tertiary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-200 ease-out" 
      />
    </button>
  );
}
