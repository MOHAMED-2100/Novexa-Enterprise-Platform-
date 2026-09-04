import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Layers, Database, Activity } from 'lucide-react';

interface NavbarProps {
  healthStatus?: 'ok' | 'error';
}

export const Navbar: React.FC<NavbarProps> = ({ healthStatus }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <header id="novexa-navbar" className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Architecture Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg tracking-wider">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">Novexa</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                {t('app.badge')}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {t('app.tagline')}
            </p>
          </div>
        </div>

        {/* System Attributes & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Architecture Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>{t('nav.architecture')}</span>
          </div>

          {/* Database Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('nav.database')}</span>
          </div>

          {/* Real-time Health Ping status indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus === 'ok'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-500'
              }`}
            />
            <span className="text-slate-300">
              {healthStatus === 'ok' ? '200 OK' : '503 Probe'}
            </span>
          </div>

          {/* Language Switch Control (Flipping immediately between English LTR and Arabic RTL) */}
          <button
            id="language-switch-btn"
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 cursor-pointer"
            title={t('nav.language')}
          >
            <Globe className="w-4 h-4" />
            <span className="font-semibold">
              {currentLang === 'en' ? 'العربية (RTL)' : 'English (LTR)'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
