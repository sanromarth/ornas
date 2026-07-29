import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { BackupService, BackupProgress } from '../services/BackupService';

import { RestoreWizard } from './RestoreWizard';

export function BackupSection() {
  const [progress, setProgress] = useState<BackupProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRestoreWizard, setShowRestoreWizard] = useState(false);

  const handleExport = async () => {
    setError(null);
    setSuccess(null);
    setIsExporting(true);
    try {
      await BackupService.exportBackup((p) => setProgress(p));
      setSuccess("Backup exported successfully.");
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || String(err));
    } finally {
      setIsExporting(false);
      setProgress(null);
    }
  };



  return (
    <section className="space-y-6">
      <h3 className="text-[11px] uppercase font-bold text-text-tertiary tracking-widest pl-1">Backup & Restore</h3>
      
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-center justify-between">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-text-primary">Export Database</label>
              <p className="text-sm text-text-secondary leading-relaxed">Create a ZIP backup of your entire clipboard history, images, and settings.</p>
            </div>
            <Button 
              onClick={handleExport}
              loading={isExporting}
              variant="secondary"
            >
              Export ZIP
            </Button>
          </div>

          <div className="flex gap-4 items-center justify-between">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-text-primary">Restore Database</label>
              <p className="text-sm text-text-secondary leading-relaxed">Import a ZIP backup to merge or replace your current database.</p>
            </div>
            <Button 
              onClick={() => setShowRestoreWizard(true)}
              variant="secondary"
            >
              Restore Backup
            </Button>
          </div>
        </div>

        {progress && (
          <div className="flex flex-col gap-2 p-3 bg-surface border border-border rounded-md">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>{progress.status}</span>
              <span>{progress.progress}%</span>
            </div>
            <div className="w-full bg-background h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 text-sm text-danger bg-danger/10 rounded-md shrink-0">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm text-success bg-success/10 rounded-md shrink-0">
            {success}
          </div>
        )}
      </div>

      {showRestoreWizard && (
        <RestoreWizard onClose={() => setShowRestoreWizard(false)} />
      )}
    </section>
  );
}
