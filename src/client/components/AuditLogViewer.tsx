import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, RefreshCw, ShieldAlert, CheckCircle, Database } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';

interface AuditLogEntry {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: string;
  entity_name: string;
  entity_id: string | null;
  before_state: any;
  after_state: any;
  ip_address: string | null;
  created_at: string;
}

export const AuditLogViewer: React.FC = () => {
  const { t } = useTranslation();
  const { user, accessToken } = useAuthStore();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canViewAudit = user?.permissions.includes('admin.audit.view') ?? false;

  const fetchAuditLogs = useCallback(async () => {
    if (!canViewAudit) return;
    setIsLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch('/admin/audit-logs?limit=25', {
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to retrieve compliance audit logs');
      } else {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err: any) {
      setError(err.message || 'Network error querying audit trail');
    } finally {
      setIsLoading(false);
    }
  }, [canViewAudit, accessToken]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  if (!canViewAudit) return null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t('audit.title')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('audit.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAuditLogs}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{t('audit.refresh')}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">{t('audit.timestamp')}</th>
              <th className="px-4 py-3">{t('audit.action')}</th>
              <th className="px-4 py-3">{t('audit.user')}</th>
              <th className="px-4 py-3">{t('audit.entity')}</th>
              <th className="px-4 py-3">State Mutation</th>
              <th className="px-4 py-3">{t('audit.ip')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  {t('audit.empty')}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {log.user_id || 'anonymous'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {log.entity_name} {log.entity_id ? `(${log.entity_id})` : ''}
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                    {log.after_state ? JSON.stringify(log.after_state) : 'none'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {log.ip_address || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
