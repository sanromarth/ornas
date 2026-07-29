import { useVaultStore } from '../../../stores/vault-store';
import { VaultWizard } from './VaultWizard';
import { VaultControlPanel } from './VaultControlPanel';
import { VaultTrustBadges } from './VaultTrustBadges';

export function VaultSection() {
  const { isInitialized, isUnlocked, isChecking, setupVault, lockVault, unlockVault } = useVaultStore();

  if (isChecking) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="text-sm text-text-secondary animate-pulse">Checking vault status...</div>
      </div>
    );
  }

  return (
    <section className="max-w-2xl mx-auto py-8 text-text-primary animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Overview & Trust Panel */}
      <div className="mb-10 text-center flex flex-col items-center">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-2">SECURE VAULT</h2>
        <p className="text-[14px] text-text-secondary max-w-[50ch] leading-relaxed mb-1">
          Protect your most sensitive clipboard entries using strong local encryption.
        </p>
        <p className="text-[14px] text-text-secondary max-w-[50ch] leading-relaxed mb-4">
          Everything remains on your device. Nothing is uploaded. Nothing is synchronized. Nothing is shared.
        </p>
        <VaultTrustBadges />
      </div>

      <div className="h-px bg-border w-full mb-10" />

      {/* Main Dynamic Area */}
      {!isInitialized ? (
        <VaultWizard onSetup={setupVault} />
      ) : (
        <VaultControlPanel 
          isUnlocked={isUnlocked} 
          onLock={lockVault} 
          onUnlock={unlockVault} 
        />
      )}

      {/* Educational Area */}
      <div className="mt-12 p-5 bg-surface border border-border rounded-xl text-sm text-text-secondary leading-relaxed">
        <h4 className="text-[11px] uppercase font-bold text-text-tertiary tracking-widest mb-3">How it works</h4>
        <ul className="space-y-2">
          <li>• Locking the Vault does NOT delete data.</li>
          <li>• Unlocking does NOT upload data.</li>
          <li>• The Vault is always stored locally, and only encrypted data is written to disk.</li>
          <li>• Sensitive clipboard entries remain protected while locked.</li>
        </ul>
      </div>

    </section>
  );
}
