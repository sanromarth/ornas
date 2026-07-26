import { useState } from 'react';
import { useVaultStore } from '../../../stores/vault-store';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useToast } from '../../../shared/components/useToast';
import { Eye, EyeOff } from 'lucide-react';

export function VaultSection() {
  const { isInitialized, isUnlocked, isChecking, setupVault, lockVault } = useVaultStore();
  const { addToast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    } catch (e: unknown) {
      addToast({ title: 'Failed to configure vault', description: (e instanceof Error ? e.message : String(e)), variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    try {
      await lockVault();
      addToast({ title: 'Vault locked', variant: 'success' });
    } catch (e: unknown) {
      addToast({ title: 'Failed to lock vault', description: (e instanceof Error ? e.message : String(e)), variant: 'error' });
    }
  };

  return (
    <section className="space-y-5">
      <h3 className="text-[11px] uppercase font-bold text-text-tertiary tracking-widest pl-1">Secure Vault</h3>
      
      {!isInitialized ? (
        <div className="flex gap-4 items-start justify-between">
          <div className="flex flex-col gap-1 flex-1 pr-8">
            <label className="text-sm font-medium text-text-primary">Configure Vault</label>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Set up a master password to encrypt sensitive clips. Keep this password safe, as it cannot be recovered.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0 w-64">
            <Input 
              type={showPassword ? "text" : "password"} 
              placeholder="Master Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              rightIcon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              onRightIconClick={() => setShowPassword(!showPassword)}
            />
            <Input 
              type={showPassword ? "text" : "password"} 
              placeholder="Confirm Password" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              rightIcon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              onRightIconClick={() => setShowPassword(!showPassword)}
            />
            <Button 
              onClick={handleSetup} 
              loading={loading}
              disabled={!password || !confirmPassword}
              variant="primary"
              className="mt-1 font-semibold"
            >
              Initialize Vault
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 items-center justify-between">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium text-text-primary">Vault Status</label>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              {isUnlocked ? 'Your vault is currently unlocked.' : 'Your vault is currently locked.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isUnlocked && (
              <Button onClick={handleLock} variant="secondary">
                Lock Vault
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
