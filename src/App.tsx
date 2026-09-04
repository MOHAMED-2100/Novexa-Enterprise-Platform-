import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from './client/components/Navbar.js';
import { HealthMonitor } from './client/components/HealthMonitor.js';
import { ModulesCard } from './client/components/ModulesCard.js';
import { DockerRunGuide } from './client/components/DockerRunGuide.js';
import { HealthResponse, ModuleItem, ModulesResponse } from './client/types.js';

export default function App() {
  const { t, i18n } = useTranslation();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [modulesSource, setModulesSource] = useState<'database' | 'fallback'>('fallback');

  const fetchHealth = useCallback(async () => {
    setIsLoadingHealth(true);
    try {
      const res = await fetch('/health', {
        headers: {
          'Accept-Language': i18n.language || 'en',
        },
      });

      setHttpStatus(res.status);
      const data: HealthResponse = await res.json();
      setHealth({ ...data, httpStatus: res.status });
      setLastChecked(new Date());
    } catch (err: any) {
      // Network failure or offline
      setHttpStatus(503);
      setHealth({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptimeSeconds: 0,
        environment: 'local',
        language: i18n.language || 'en',
        localizedMessage: t('health.errorNotice'),
        database: {
          connected: false,
          status: 'disconnected',
          latencyMs: 0,
          error: err?.message || 'Network request failed to /health',
          connectionTarget: 'localhost:5432/novexa_db',
        },
        modules: {
          tableExists: false,
          totalRegistered: 0,
        },
        httpStatus: 503,
      });
      setLastChecked(new Date());
    } finally {
      setIsLoadingHealth(false);
    }
  }, [i18n.language, t]);

  const fetchModules = useCallback(async () => {
    try {
      const res = await fetch('/api/modules');
      if (res.ok) {
        const json: ModulesResponse = await res.json();
        setModules(json.data || []);
        setModulesSource(json.source || 'fallback');
      }
    } catch {
      // Keep baseline fallback modules
      setModulesSource('fallback');
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchModules();
  }, [fetchHealth, fetchModules]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation */}
      <Navbar healthStatus={health?.status} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Hero Header */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {t('app.title')}
            </h1>
            <p className="mt-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('app.subtitle')}
            </p>
          </div>
        </section>

        {/* 1. Real /health telemetry status card */}
        <HealthMonitor
          health={health}
          isLoading={isLoadingHealth}
          httpStatus={httpStatus}
          onRefresh={fetchHealth}
          lastChecked={lastChecked}
        />

        {/* 2. Database 'modules' table representation */}
        <ModulesCard modules={modules} source={modulesSource} />

        {/* 3. Docker Compose & Local Run instructions */}
        <DockerRunGuide />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
          <p>{t('footer.copyright')}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {t('footer.rules')}
          </p>
        </div>
      </footer>
    </div>
  );
}
