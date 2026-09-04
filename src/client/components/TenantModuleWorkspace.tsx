import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Play,
  ArrowRight,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { ModuleItem } from '../types.js';

interface TenantModuleStatus extends ModuleItem {
  isEnabled: boolean;
}

export const TenantModuleWorkspace: React.FC = () => {
  const { t } = useTranslation();
  const { user, enabledModules, refreshModules, accessToken } = useAuthStore();
  const [allModules, setAllModules] = useState<ModuleItem[]>([]);
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const canManageModules = user?.permissions.includes('admin.modules.manage') ?? false;

  const fetchModulesRegistry = useCallback(async () => {
    try {
      const res = await fetch('/api/modules');
      if (res.ok) {
        const json = await res.json();
        setAllModules(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load modules registry', err);
    }
  }, []);

  useEffect(() => {
    fetchModulesRegistry();
  }, [fetchModulesRegistry]);

  const handleToggle = async (moduleCode: string, currentlyEnabled: boolean) => {
    if (!user) return;
    setLoadingCode(moduleCode);
    setActionError(null);
    setActionSuccess(null);

    const action = currentlyEnabled ? 'disable' : 'enable';
    const endpoint = `/admin/tenants/${user.tenant_id}/modules/${moduleCode}/${action}`;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.message || `Failed to ${action} module ${moduleCode}`);
      } else {
        setActionSuccess(data.message || `Module ${moduleCode} updated successfully`);
        await refreshModules();
      }
    } catch (err: any) {
      setActionError(err?.message || 'Network error executing module operation');
    } finally {
      setLoadingCode(null);
    }
  };

  const handleTestModuleAccess = async (moduleCode: string) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Test endpoint: finance/records for finance, or me/enabled-modules
      const path = moduleCode === 'finance' ? '/finance/records' : `/api/modules/${moduleCode}`;
      const res = await fetch(path, {
        headers,
        credentials: 'include',
      });

      const status = res.status;
      const data = await res.json();
      setTestResult({
        status,
        url: path,
        ok: res.ok,
        data,
      });
    } catch (err: any) {
      setTestResult({
        status: 500,
        ok: false,
        data: { error: err.message },
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t('adminModules.title')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('adminModules.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => refreshModules()}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync State</span>
        </button>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Operation Rejected</p>
            <p className="mt-0.5 text-[11px]">{actionError}</p>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Operation Successful</p>
            <p className="mt-0.5 text-[11px]">{actionSuccess}</p>
          </div>
        </div>
      )}

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allModules.map((m) => {
          const isEnabled = enabledModules.includes(m.code);
          const isLoading = loadingCode === m.code;

          return (
            <div
              key={m.code}
              className={`rounded-xl border p-5 transition-all flex flex-col justify-between ${
                isEnabled
                  ? 'bg-slate-50/50 dark:bg-slate-850/50 border-slate-200 dark:border-slate-750 shadow-xs'
                  : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
              }`}
            >
              <div>
                {/* Module Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {m.code}
                      </span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {m.group}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-1">
                      {m.name}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  {isEnabled ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t('adminModules.enabled')}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 shrink-0">
                      <XCircle className="w-3 h-3" />
                      <span>{t('adminModules.disabled')}</span>
                    </span>
                  )}
                </div>

                {/* Dependencies */}
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {t('adminModules.dependencyNotice')}{' '}
                  </span>
                  {m.depends_on && m.depends_on.length > 0 ? (
                    <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {m.depends_on.join(', ')}
                    </span>
                  ) : (
                    <span className="italic">{t('adminModules.none')}</span>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                {/* Test access action */}
                <button
                  type="button"
                  onClick={() => handleTestModuleAccess(m.code)}
                  disabled={isTesting}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>{t('adminModules.testAction')}</span>
                </button>

                {/* Enable/Disable toggle (Super Admin only) */}
                {canManageModules ? (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleToggle(m.code, isEnabled)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                      isEnabled
                        ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                    }`}
                  >
                    {isEnabled ? (
                      <>
                        <ToggleRight className="w-3.5 h-3.5" />
                        <span>{isLoading ? t('adminModules.disabling') : t('adminModules.disableBtn')}</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-3.5 h-3.5" />
                        <span>{isLoading ? t('adminModules.enabling') : t('adminModules.enableBtn')}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400" title={t('adminModules.superAdminOnly')}>
                    <Lock className="w-3 h-3" />
                    <span>Protected</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Guard Verification Result Drawer */}
      {testResult && (
        <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-bold">
              Guard Probe Response: {testResult.url}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                testResult.ok ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
              }`}
            >
              HTTP {testResult.status} {testResult.ok ? 'OK' : 'FORBIDDEN'}
            </span>
          </div>
          <pre className="overflow-x-auto p-2 bg-slate-950 rounded text-slate-300 text-[11px]">
            {JSON.stringify(testResult.data, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
};
