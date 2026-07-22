import { useState } from 'react';
import { useVaultStore } from '../../../stores/vault-store';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useToast } from '../../../shared/components/useToast';

export function VaultSection() {
  const { isInitialized, isUnlocked, isChecking, setupVault, lockVault } = useVaultStore();
  const { addToast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isChecking) {
    return <div className="text-sm text-text-secondary">Checking vault status...</div>;
  }

  const handleSetup = async () => {
    if (!password) {
      addToast({ title: 'Password required', variant: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      addToast({ title: 'Passwords do not match', variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await setupVault(password);
      addToast({ title: 'Vault configured successfully', variant: 'success' });
      setPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      addToast({ title: 'Failed to configure vault', description: e.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    try {
      await lockVault();
      addToast({ title: 'Vault locked', variant: 'success' });
    } catch (e: any) {
      addToast({ title: 'Failed to lock vault', description: e.message, variant: 'error' });
    }
  };

  return (
    <div className="flex flex-col gap-6 shrink-0">
      <h3 className="text-xs uppercase font-medium text-text-secondary tracking-wider">Secure Vault</h3>
      
      {!isInitialized ? (
        <div className="flex flex-col gap-4 bg-surface p-4 rounded-lg border border-border">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-medium text-text-primary">Configure Vault</h4>
            <p className="text-sm text-text-secondary leading-relaxed">
              Set up a master password to encrypt sensitive clips. Keep this password safe, as it cannot be recovered.
            </p>
          </div>
          <div className="flex flex-col gap-3 mt-2">
            <Input 
              type="password" 
              placeholder="Master Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Input 
              type="password" 
              placeholder="Confirm Password" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            <Button 
              onClick={handleSetup} 
              loading={loading}
              disabled={!password || !confirmPassword}
              className="mt-2 self-start"
            >
              Initialize Vault
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 bg-surface p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-medium text-text-primary">Vault Status</h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                {isUnlocked ? 'Your vault is currently unlocked.' : 'Your vault is currently locked.'}
              </p>
            </div>
            {isUnlocked && (
              <Button onClick={handleLock} variant="secondary">
                Lock Vault
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
