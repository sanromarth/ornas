import { useState } from 'react';
import { useVaultStore } from '../../../stores/vault-store';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Lock } from 'lucide-react';
import { useToast } from '../../../shared/components/useToast';

export function VaultLockScreen() {
  const { unlockVault, isChecking } = useVaultStore();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleUnlock = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password) return;

    setLoading(true);
    try {
      await unlockVault(password);
      addToast({ title: 'Vault unlocked', variant: 'success' });
      setPassword('');
    } catch (err: any) {
      addToast({ title: 'Failed to unlock', description: err.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface p-8">
        <p className="text-text-secondary">Checking vault status...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-surface p-8 text-center">
      <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-medium text-text-primary mb-2">Vault is Locked</h2>
      <p className="text-sm text-text-secondary max-w-sm mb-8">
        This clip is encrypted. Please enter your master password to unlock the vault and view this clip.
      </p>
      
      <form onSubmit={handleUnlock} className="flex flex-col gap-4 w-full max-w-xs">
        <Input 
          type="password" 
          placeholder="Master Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <Button 
          type="submit" 
          loading={loading}
          disabled={!password}
          className="w-full"
        >
          Unlock Vault
        </Button>
      </form>
    </div>
  );
}
