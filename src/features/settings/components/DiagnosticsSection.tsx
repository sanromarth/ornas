import { Activity, Database, AlertCircle, RefreshCw, Box } from 'lucide-react';
import { useDiagnosticsQuery } from '../api/queries';

export function DiagnosticsSection() {
  const { data: info, isLoading, isError, refetch, isFetching } = useDiagnosticsQuery();

  if (isLoading) {
    return <div className="text-sm text-text-tertiary p-6">Loading diagnostics info...</div>;
  }

  if (isError || !info) {
    return <div className="text-sm text-danger p-6">Failed to load diagnostics info.</div>;
  }

  return (
    <div className="space-y-6 text-text-primary p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-semibold text-text-tertiary tracking-wider uppercase m-0">
          Runtime Status
        </h3>
        <button 
          onClick={() => refetch()} 
          className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary hover:text-primary transition-colors"
          disabled={isFetching}
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <DiagnosticCard 
          icon={<Activity size={14} className="text-emerald-500" />}
          label="Clipboard Monitor"
          value={info.clipboard_monitor_status}
          isHealthy={info.clipboard_monitor_status.includes('Active')}
        />
        <DiagnosticCard 
          icon={<Database size={14} className="text-primary" />}
          label="Database Health"
          value={info.database_health}
          isHealthy={info.database_health.includes('Healthy')}
        />
        <DiagnosticCard 
          icon={<RefreshCw size={14} className="text-indigo-400" />}
          label="WAL Status"
          value={info.wal_status}
          isHealthy={info.wal_status.includes('Active')}
        />
        <DiagnosticCard 
          icon={<Box size={14} className="text-amber-500" />}
          label="Queue Status"
          value={info.queue_status}
          isHealthy={info.queue_status.includes('Idle')}
        />
      </div>

      <h3 className="text-[11px] font-semibold text-text-tertiary tracking-wider uppercase mb-4">
        System Components
      </h3>
      
      <div className="space-y-3">
        <ComponentRow label="Storage Engine" value={info.storage_engine} />
        <ComponentRow label="Clipboard Backend" value={info.clipboard_backend} />
        <ComponentRow label="Recovery Status" value={info.recovery_status} />
      </div>

      {info.recent_errors.length > 0 && (
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={16} />
            <h3 className="text-[11px] font-semibold tracking-wider uppercase m-0">
              Recent Errors
            </h3>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
            <ul className="list-disc list-inside space-y-1">
              {info.recent_errors.map((error, idx) => (
                <li key={idx} className="text-xs text-red-400 font-mono">{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function DiagnosticCard({ icon, label, value, isHealthy }: { icon: React.ReactNode, label: string, value: string, isHealthy: boolean }) {
  return (
    <div className="p-4 rounded-lg bg-surface/40 border border-border/60 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          {icon}
          <span>{label}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500'}`} />
      </div>
      <div className="text-sm font-semibold text-text-primary mt-1">
        {value}
      </div>
    </div>
  );
}

function ComponentRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface/30 border border-border/50">
      <span className="text-sm text-text-secondary font-medium">{label}</span>
      <span className="text-sm font-mono text-text-primary bg-surface border border-border px-2 py-0.5 rounded-md">
        {value}
      </span>
    </div>
  );
}
