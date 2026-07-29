/**
 * VaultLockScreen — Shown in the preview panel when an encrypted clip is selected
 * but the vault is not yet unlocked.
 *
 * Design:
 *   - Centers in the preview panel (flex-1)
 *   - Lock icon: small and muted — the form is the hero, not the icon
 *   - Password input: autoFocus, submits on Enter via form
 *   - No extra decoration — the context (viewing an encrypted clip) is already established
 */

import { useState } from 'react';
import { useVaultStore } from '../../../stores/vault-store';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Lock } from 'lucide-react';
import { useToast } from '../../../shared/components/useToast';
import { Spinner } from '../../../shared/components/Spinner';

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
    } catch (err: unknown) {
      addToast({
        title: 'Incorrect password',
        description: err instanceof Error ? err.message : String(err),
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary gap-2">
        <Spinner size={14} />
        <span className="text-sm">Checking vault…</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      {/* Lock icon — small, muted, not the focus */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hover border border-border mb-5">
        <Lock size={18} className="text-text-tertiary" aria-hidden="true" />
      </div>

      <h2 className="text-[15px] font-medium text-text-primary mb-1">
        Vault is locked
      </h2>
      <p className="text-[13px] text-text-tertiary max-w-[28ch] mx-auto leading-relaxed mb-6">
        Enter your master password to decrypt this clip.
      </p>

      <form onSubmit={handleUnlock} className="flex flex-col gap-3 w-full max-w-[240px]">
        <Input
          type="password"
          placeholder="Master password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          aria-label="Master password"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={loading}
          disabled={!password}
          className="w-full"
        >
          Unlock
        </Button>
      </form>
    </div>
  );
}
