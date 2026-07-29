import { Monitor, Layout, CheckCircle, XCircle } from 'lucide-react';
import { usePlatformQuery } from '../api/queries';

export function SystemSection() {
  const { data: info, isLoading, isError } = usePlatformQuery();

  if (isLoading) {
    return <div className="text-sm text-text-tertiary">Loading system info...</div>;
  }

  if (isError || !info) {
    return <div className="text-sm text-danger">Failed to load system info.</div>;
  }

  const { operating_system, platform_version, display_server, desktop_environment, capabilities } = info;

  return (
    <div className="space-y-6 text-text-primary p-6">
      <h3 className="text-[11px] font-semibold text-text-tertiary tracking-wider uppercase mb-4">
        Platform Identity
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-lg bg-surface/40 border border-border/60 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Monitor size={14} className="text-primary" />
            <span>Operating System</span>
          </div>
          <div className="text-sm font-semibold text-text-primary capitalize">
            {operating_system} {platform_version}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-surface/40 border border-border/60 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Layout size={14} className="text-indigo-400" />
            <span>Display Server</span>
          </div>
          <div className="text-sm font-semibold text-text-primary">
            {display_server} {desktop_environment !== 'Unknown' && `(${desktop_environment})`}
          </div>
        </div>
      </div>

      <h3 className="text-[11px] font-semibold text-text-tertiary tracking-wider uppercase mb-4">
        Platform Capabilities
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CapabilityRow label="HTML Clipboard" enabled={capabilities.supports_html} />
        <CapabilityRow label="RTF Clipboard" enabled={capabilities.supports_rtf} />
        <CapabilityRow label="Image Clipboard" enabled={capabilities.supports_images} />
        <CapabilityRow label="File Paths Clipboard" enabled={capabilities.supports_files} />
        <CapabilityRow label="Primary Selection" enabled={capabilities.supports_primary_selection} />
        <CapabilityRow label="Native Monitoring" enabled={capabilities.native_monitoring} />
      </div>
    </div>
  );
}

function CapabilityRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface/30 border border-border/50">
      <span className="text-sm text-text-secondary font-medium">{label}</span>
      {enabled ? (
        <CheckCircle size={16} className="text-success" />
      ) : (
        <XCircle size={16} className="text-text-tertiary/50" />
      )}
    </div>
  );
}
