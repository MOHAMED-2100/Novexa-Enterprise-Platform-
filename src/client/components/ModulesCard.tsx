import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Database, ShieldCheck, ArrowRight } from 'lucide-react';
import { ModuleItem } from '../types.js';

interface ModulesCardProps {
  modules: ModuleItem[];
  source: 'database' | 'fallback';
}

export const ModulesCard: React.FC<ModulesCardProps> = ({ modules, source }) => {
  const { t } = useTranslation();

  return (
    <section id="modules-registry-card" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {t('modules.sectionTitle')}
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('modules.sectionSubtitle')}
          </p>
        </div>

        {/* Source Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
          <Database className="w-3.5 h-3.5 text-blue-500" />
          <span>
            {t('modules.dataSource')}:{' '}
            <strong className="text-slate-900 dark:text-slate-100">
              {source === 'database' ? t('modules.dbSource') : t('modules.fallbackSource')}
            </strong>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm text-start border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <th className="py-3 px-4 text-start">{t('modules.code')}</th>
              <th className="py-3 px-4 text-start">{t('modules.name')}</th>
              <th className="py-3 px-4 text-start">{t('modules.group')}</th>
              <th className="py-3 px-4 text-start">{t('modules.dependencies')}</th>
              <th className="py-3 px-4 text-start">{t('modules.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {modules.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  {t('modules.emptyList')}
                </td>
              </tr>
            ) : (
              modules.map((mod) => (
                <tr
                  key={mod.code}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {mod.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {mod.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 capitalize">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300">
                      {mod.group}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                    {mod.depends_on && mod.depends_on.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {mod.depends_on.map((dep) => (
                          <span
                            key={dep}
                            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          >
                            {dep}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">
                        {t('modules.noDependencies')}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300">
                      <ShieldCheck className="w-3 h-3" />
                      {mod.status}
                    </span>
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
