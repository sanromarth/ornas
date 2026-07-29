import { useState } from 'react';
import { BackupService, BackupManifest, ImportMode, BackupProgress } from '../services/BackupService';
import { Button } from '../../../shared/components/Button';
import { AlertTriangle, Check, Database, Upload } from 'lucide-react';

interface RestoreWizardProps {
  onClose: () => void;
}

export function RestoreWizard({ onClose }: RestoreWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [manifest, setManifest] = useState<BackupManifest | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<BackupProgress | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSelectFile = async () => {
    setError(null);
    try {
      const result = await BackupService.validateBackup();
      if (result) {
        setManifest(result.manifest);
        setFilePath(result.filePath);
        setStep(2);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRestore = async () => {
    if (!filePath) return;
    setError(null);
    setIsRestoring(true);
    try {
      await BackupService.executeRestore(filePath, mode, (p) => setProgress(p));
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Database className="w-5 h-5 text-accent" />
            Restore Database
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 rounded-md bg-danger/10 border border-danger/20 text-danger text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-medium text-text-primary">Select Backup File</h3>
                <p className="text-sm text-text-secondary max-w-sm mx-auto">
                  Choose an ORNAS backup archive (.zip) to restore your data. The file will be verified before making any changes.
                </p>
              </div>
              <Button onClick={handleSelectFile} size="lg">Browse Files</Button>
            </div>
          )}

          {step === 2 && manifest && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-surface border border-border/50">
                <h4 className="text-sm font-medium text-text-primary mb-3">Backup Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-tertiary block">Date</span>
                    <span className="text-text-secondary">{new Date(manifest.timestamp * 1000).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block">Items</span>
                    <span className="text-text-secondary">{manifest.item_count} clips</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block">Images</span>
                    <span className="text-text-secondary">{manifest.image_count}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block">Version</span>
                    <span className="text-text-secondary">{manifest.ornas_version}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-text-primary">Restore Mode</h4>
                
                <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${mode === 'merge' ? 'border-accent bg-accent/5' : 'border-border/50 hover:border-border'}`}>
                  <input type="radio" name="mode" value="merge" checked={mode === 'merge'} onChange={() => setMode('merge')} className="mt-1" />
                  <div>
                    <span className="block font-medium text-text-primary mb-1">Merge (Safe)</span>
                    <span className="block text-sm text-text-secondary">Keep your existing clips and add the backup's clips. Duplicates are resolved automatically.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${mode === 'replace_all' ? 'border-danger/50 bg-danger/5' : 'border-border/50 hover:border-border'}`}>
                  <input type="radio" name="mode" value="replace_all" checked={mode === 'replace_all'} onChange={() => setMode('replace_all')} className="mt-1" />
                  <div>
                    <span className="block font-medium text-danger mb-1">Replace All (Destructive)</span>
                    <span className="block text-sm text-text-secondary">Wipe your current database and replace it entirely with the backup. A safety backup of your current state will be created first.</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
              {isSuccess ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-success">
                    <Check className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium text-text-primary">Restore Complete</h3>
                    <p className="text-sm text-text-secondary">Your data has been successfully restored.</p>
                  </div>
                  <Button onClick={handleRestart} size="lg">Restart ORNAS</Button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
                  <div className="space-y-2 w-full max-w-xs mx-auto">
                    <h3 className="text-xl font-medium text-text-primary">Restoring...</h3>
                    {progress && (
                      <div className="text-sm text-text-secondary w-full text-left bg-surface border border-border p-3 rounded-md">
                        <div className="flex justify-between mb-1">
                          <span>{progress.status}</span>
                          <span>{progress.progress}%</span>
                        </div>
                        <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                          <div className="bg-accent h-full transition-all duration-300" style={{ width: `${progress.progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && step !== 3 && (
          <div className="px-6 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isRestoring}>Cancel</Button>
            {step === 2 && (
              <Button 
                variant={mode === 'replace_all' ? 'destructive' : 'primary'}
                onClick={() => setStep(3)}
              >
                Proceed with Restore
              </Button>
            )}
          </div>
        )}
        {!isSuccess && step === 3 && (
          <div className="px-6 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isRestoring}>Cancel</Button>
            <Button 
              variant={mode === 'replace_all' ? 'destructive' : 'primary'}
              onClick={handleRestore}
              disabled={isRestoring}
            >
              Start Restore
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
