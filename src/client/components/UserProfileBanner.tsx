import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Shield, Key, LogOut, Building, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';

export const UserProfileBanner: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* User Identity Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {user.email}
                </h2>
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Authenticated</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{t('auth.tenantId')}</span>
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                  {user.tenant_id}
                </code>
              </div>
            </div>
          </div>

          {/* Roles & Live DB Permissions */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Roles */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {t('auth.roles')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-medium text-xs"
                  >
                    <Shield className="w-3 h-3 text-blue-500" />
                    <span>{role}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {t('auth.permissions')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px]"
                  >
                    <Key className="w-3 h-3 text-amber-500" />
                    <span>{perm}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Security Notice */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
          <button
            id="auth-logout-btn"
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>{t('auth.logoutButton')}</span>
          </button>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs text-start lg:text-end">
            {t('auth.sessionSecureNotice')}
          </p>
        </div>
      </div>
    </section>
  );
};
