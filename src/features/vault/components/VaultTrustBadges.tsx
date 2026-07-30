import { Shield, EyeOff, ServerOff, CheckCircle2 } from 'lucide-react';

export function VaultTrustBadges() {
  return (
    <div className="grid grid-cols-2 gap-3 text-[13px] text-text-secondary mt-4">
      <div className="flex items-center gap-2">
        <ServerOff size={15} className="text-primary" />
        <span>Local-only encryption</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle2 size={15} className="text-primary" />
        <span>No cloud account</span>
      </div>
      <div className="flex items-center gap-2">
        <EyeOff size={15} className="text-primary" />
        <span>No telemetry or analytics</span>
      </div>
      <div className="flex items-center gap-2">
        <Shield size={15} className="text-primary" />
        <span>User-owned data</span>
      </div>
    </div>
  );
}

export function SecurityTransparencyPanel() {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <h4 className="text-[11px] uppercase font-bold text-text-tertiary tracking-widest mb-4">Security Transparency</h4>
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-secondary">Encryption</span>
          <span className="font-mono font-medium text-text-primary text-[13px]">XChaCha20-Poly1305</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-secondary">Key Derivation</span>
          <span className="font-mono font-medium text-text-primary text-[13px]">Argon2id</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-secondary">Storage</span>
          <span className="font-mono font-medium text-text-primary text-[13px]">Local SQLite</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-secondary">Internet Dependency</span>
          <span className="font-medium text-success text-[13px]">Never required</span>
        </div>
      </div>
    </div>
  );
}
