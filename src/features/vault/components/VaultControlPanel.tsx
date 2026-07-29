import React, { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Dialog } from '../../../shared/components/Dialog';
import { Input } from '../../../shared/components/Input';
import { SecurityTransparencyPanel } from './VaultTrustBadges';
import { Lock, Unlock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useToast } from '../../../shared/components/useToast';

interface VaultControlPanelProps {
  isUnlocked: boolean;
  onLock: () => Promise<void>;
  onUnlock: (password: string) => Promise<void>;
}

export function VaultControlPanel({ isUnlocked, onLock, onUnlock }: VaultControlPanelProps) {
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const { addToast } = useToast();

  const handleUnlockSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password) return;
    setIsUnlocking(true);
    try {
      await onUnlock(password);
      setUnlockDialogOpen(false);
      setPassword('');
      addToast({ title: 'Vault unlocked', variant: 'success' });
    } catch (_err) {
      addToast({ title: 'Incorrect password', description: 'Please try again.', variant: 'error' });
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleNotImplemented = () => {
    addToast({ title: 'Feature in development', description: 'This feature will be available in a future update.', variant: 'info' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Status Card */}
      <div className={`border rounded-xl p-6 flex flex-col gap-4 transition-colors duration-300 ${isUnlocked ? 'bg-success/5 border-success/20' : 'bg-surface border-border shadow-sm'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isUnlocked ? 'bg-success/10' : 'bg-hover border border-border'}`}>
              {isUnlocked ? <Unlock size={18} className="text-success" /> : <Lock size={18} className="text-text-tertiary" />}
            </div>
            <div>
              <div className="text-[11px] uppercase font-bold text-text-tertiary tracking-widest mb-0.5">Vault Status</div>
              <div className={`text-lg font-bold ${isUnlocked ? 'text-success' : 'text-text-primary'}`}>
                {isUnlocked ? 'Unlocked' : 'Locked'}
              </div>
            </div>
          </div>
          <div>
            {isUnlocked ? (
              <Button variant="secondary" onClick={onLock} className="min-w-[100px]">
                Lock Vault
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setUnlockDialogOpen(true)} className="min-w-[100px]">
                Unlock Vault
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-sm text-text-secondary leading-relaxed">
          {isUnlocked 
            ? 'Your sensitive clipboard entries are automatically encrypted and decrypted in real-time.' 
            : 'Your vault is locked. Encrypted clipboard entries cannot be read or pasted until unlocked.'}
        </p>
      </div>

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="secondary" onClick={handleNotImplemented} className="h-12 justify-start px-4">
          Change Password
        </Button>
        <Button variant="secondary" onClick={handleNotImplemented} className="h-12 justify-start px-4">
          Backup Vault
        </Button>
        <Button variant="secondary" onClick={handleNotImplemented} className="h-12 justify-start px-4">
          Export Encrypted Backup
        </Button>
        <Button variant="secondary" onClick={handleNotImplemented} className="h-12 justify-start px-4">
          Restore Backup
        </Button>
      </div>

      <SecurityTransparencyPanel />

      {/* Unlock Dialog */}
      <Dialog 
        isOpen={unlockDialogOpen} 
        onClose={() => {
          if (!isUnlocking) {
            setUnlockDialogOpen(false);
            setPassword('');
          }
        }} 
        title="Unlock Vault"
      >
        <form onSubmit={handleUnlockSubmit} className="space-y-6">
          <Input 
            type={showPassword ? "text" : "password"}
            placeholder="Master Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            rightIcon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            onRightIconClick={() => setShowPassword(!showPassword)}
          />

          <div className="flex items-start gap-3 bg-primary/5 rounded-lg p-4">
            <ShieldAlert size={16} className="text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary block mb-1">Forgot your password?</span>
              Because ORNAS is privacy-first and does not store recovery keys, forgotten Vault passwords cannot be recovered.
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setUnlockDialogOpen(false)} disabled={isUnlocking}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!password} loading={isUnlocking}>
              Unlock
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
}
