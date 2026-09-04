import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Terminal, Copy, Check, ExternalLink, Play } from 'lucide-react';

export const DockerRunGuide: React.FC = () => {
  const { t } = useTranslation();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: t('docker.step1Title'),
      desc: t('docker.step1Desc'),
      command: 'cp .env.example .env',
    },
    {
      title: t('docker.step2Title'),
      desc: t('docker.step2Desc'),
      command: 'docker compose up --build -d',
    },
    {
      title: t('docker.step3Title'),
      desc: t('docker.step3Desc'),
      command: 'curl -i http://localhost:3000/health',
    },
    {
      title: t('docker.step4Title'),
      desc: t('docker.step4Desc'),
      command: 'docker compose exec postgres psql -U novexa -d novexa_db -c "SELECT * FROM modules;"',
    },
  ];

  return (
    <section id="docker-instructions-card" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-2 pb-6 border-b border-slate-100 dark:border-slate-800">
        <Terminal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('docker.sectionTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('docker.sectionSubtitle')}
          </p>
        </div>
      </div>

      {/* Steps List */}
      <div className="mt-6 space-y-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {step.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(step.command, idx)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors self-start sm:self-auto cursor-pointer"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>{t('docker.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>{t('docker.copyCommand')}</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-2.5 p-2.5 rounded bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 flex items-center justify-between">
              <code>{step.command}</code>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
