import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { BackupService, BackupProgress, ImportMode } from '../services/BackupService';

export function BackupSection() {
  const [progress, setProgress] = useState<BackupProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

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

  const handleImport = async (mode: ImportMode) => {
    setError(null);
    setSuccess(null);
    setIsImporting(true);
    try {
      await BackupService.importBackup(mode, (p) => setProgress(p));
      setSuccess("Backup imported successfully. Please restart ORNAS to refresh state.");
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || String(err));
    } finally {
      setIsImporting(false);
      setProgress(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 shrink-0">
      <h3 className="text-xs uppercase font-medium text-text-secondary tracking-wider">Backup & Restore</h3>
      
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
              disabled={isImporting}
              variant="secondary"
            >
              Export ZIP
            </Button>
          </div>

          <div className="flex gap-4 items-center justify-between">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-text-primary">Import Database (Merge)</label>
              <p className="text-sm text-text-secondary leading-relaxed">Import a ZIP backup. Existing clips will be kept, and new ones will be added (upsert).</p>
            </div>
            <Button 
              onClick={() => handleImport('merge')}
              loading={isImporting}
              disabled={isExporting}
              variant="secondary"
            >
              Merge ZIP
            </Button>
          </div>

          <div className="flex gap-4 items-center justify-between">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-danger">Import Database (Replace All)</label>
              <p className="text-sm text-text-secondary leading-relaxed">Completely overwrite your current history with the backup.</p>
            </div>
            <Button 
              onClick={() => setShowReplaceConfirm(true)}
              loading={isImporting}
              disabled={isExporting}
              variant="destructive"
            >
              Replace All
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

      <ConfirmDialog
        open={showReplaceConfirm}
        title="Replace All Data"
        description="This will permanently delete all current clips and replace them with the backup. This cannot be undone."
        confirmText="Replace All"
        onConfirm={() => handleImport('replace_all')}
        onCancel={() => setShowReplaceConfirm(false)}
      />
    </div>
  );
}
