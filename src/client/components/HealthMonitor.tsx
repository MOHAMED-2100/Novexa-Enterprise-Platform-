import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Server,
  Database,
  Terminal,
  AlertTriangle,
} from 'lucide-react';
import { HealthResponse } from '../types.js';

interface HealthMonitorProps {
  health: HealthResponse | null;
  isLoading: boolean;
  httpStatus: number | null;
  onRefresh: () => void;
  lastChecked: Date | null;
}

export const HealthMonitor: React.FC<HealthMonitorProps> = ({
  health,
  isLoading,
  httpStatus,
  onRefresh,
  lastChecked,
}) => {
  const { t } = useTranslation();
  const [showRawJson, setShowRawJson] = useState(false);

  const isConnected = health?.status === 'ok' && health.database.connected;

  return (
    <section id="health-telemetry-card" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {t('health.sectionTitle')}
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('health.sectionSubtitle')}
          </p>
        </div>

        {/* Refresh Action Button */}
        <button
          id="refresh-health-btn"
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 text-sm font-semibold transition-all border border-slate-300 dark:border-slate-700 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          <span>{isLoading ? t('health.refreshing') : t('health.refreshButton')}</span>
        </button>
      </div>

      {/* Primary Status Banner */}
      <div className="mt-6">
        <div
          className={`p-4 sm:p-5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
            isConnected
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            {isConnected ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-base">
                  {isConnected ? t('health.dbConnected') : t('health.dbDisconnected')}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-white/80 dark:bg-slate-900/80 border border-current">
                  HTTP {httpStatus || (isConnected ? 200 : 503)}
                </span>
              </div>
              <p className="text-xs sm:text-sm mt-0.5 opacity-90">
                {health?.localizedMessage ||
                  (isConnected
                    ? 'PostgreSQL socket reachable and responsive.'
                    : t('health.errorNotice'))}
              </p>
            </div>
          </div>

          <div className="text-xs font-mono opacity-80 shrink-0 sm:text-end">
            <div>
              {t('health.timestamp')}: {lastChecked ? lastChecked.toLocaleTimeString() : '--:--:--'}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Metric 1: HTTP Status */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>{t('health.httpStatus')}</span>
            <Server className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                httpStatus === 200 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {httpStatus || 503}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {httpStatus === 200 ? 'OK' : 'Service Unavailable'}
            </span>
          </div>
        </div>

        {/* Metric 2: Database Connectivity */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>{t('health.dbStatus')}</span>
            <Database className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {health?.database.latencyMs ? `${health.database.latencyMs}ms` : '--'}
            </span>
          </div>
        </div>

        {/* Metric 3: Modules Table Schema */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>{t('health.modulesTableStatus')}</span>
            <Terminal className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {health?.modules.tableExists ? t('health.tableFound') : t('health.tableNotFound')}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {health?.modules.tableExists
              ? `${health.modules.totalRegistered} registered modules`
              : 'Table definition initialized in Drizzle'}
          </div>
        </div>

        {/* Metric 4: Server Uptime */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>{t('health.uptime')}</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-200">
              {health ? `${health.uptimeSeconds}s` : '--'}
            </span>
            <span className="text-xs text-slate-500">
              {health?.environment || 'development'}
            </span>
          </div>
        </div>
      </div>

      {/* Target & Error Details */}
      <div className="mt-6 p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Target:</span>
            <span className="text-emerald-400 font-semibold">
              {health?.database.connectionTarget || 'postgres://novexa:****@localhost:5432/novexa_db'}
            </span>
          </div>
          <div className="text-slate-500">
            Engine: {health?.database.serverVersion || 'PostgreSQL 16 (Configured)'}
          </div>
        </div>

        {health?.database.error && (
          <div className="mt-3 text-rose-400">
            <span className="text-slate-500">Connection Diagnostic:</span> {health.database.error}
          </div>
        )}
      </div>

      {/* Raw JSON Accordion */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowRawJson(!showRawJson)}
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2 cursor-pointer"
        >
          <span>{showRawJson ? '▼ Hide' : '▶ Show'} {t('health.rawPayload')}</span>
        </button>

        {showRawJson && (
          <pre className="mt-3 p-4 rounded-lg bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto border border-slate-800">
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
      </div>
    </section>
  );
};
