import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { validatePasswordStrength } from '../utils/rules.ts';
import { Shield, ShieldCheck, User, Lock, Mail, Phone, Sun, Moon, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface SetupWizardPageProps {
  onSetupSuccess: (companyName: string) => void;
  canCancel?: boolean;
  onCancel?: () => void;
}

export const SetupWizardPage: React.FC<SetupWizardPageProps> = ({ onSetupSuccess, canCancel, onCancel }) => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [adminName, setAdminName] = useState('');
  const [userCode, setUserCode] = useState('admin');
  const [phone, setPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live password validation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  const isFormValid =
    adminName.trim().length >= 2 &&
    userCode.trim().length >= 2 &&
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasDigit &&
    hasSpecial &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/setup/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminName: adminName.trim(),
          userCode: userCode.trim(),
          password,
          phone: phone.trim() || undefined,
          adminEmail: adminEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشلت عملية إنشاء الحساب');
      }

      // Automatically login as Super Admin
      login(data.user);
      onSetupSuccess('النظام المركزي لإدارة العهد والمخازن');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تأسيس الحساب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 dir-rtl font-sans selection:bg-indigo-500 selection:text-white transition-colors relative">
      {/* Top Header with Theme Switcher */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-600/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              نظام إدارة العهد والمخازن
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              التهيئة الأولية وتأسيس حساب الإدارة
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          title="تبديل المظهر"
          aria-label="تبديل المظهر"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
      </div>

      {/* Main Card */}
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-7 text-white text-center relative">
          <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md mb-3 border border-white/15 shadow-inner">
            <Sparkles className="w-6 h-6 text-indigo-300" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">
            تأسيس حساب مسؤول النظام الرئيسي
          </h1>
          <p className="text-xs text-indigo-200/80 mt-1 max-w-sm mx-auto leading-relaxed">
            أنشئ حسابك كمسؤول للنظام للبدء فوراً. ستتمكن لاحقاً من إضافة الشركات والمخازن والعهد بكل مرونة.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              اسم مسؤول النظام *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="مثال: أحمد عبد المنعم أو مدير النظام"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          {/* User Code / Username */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                اسم الدخول / كود المستخدم *
              </label>
              <span className="text-[11px] text-slate-400">ستستخدمه لتسجيل الدخول</span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder="admin"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono font-medium"
              />
              <ShieldCheck className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          {/* Contact (Phone & Email Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                رقم الهاتف (اختياري)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                البريد الإلكتروني (اختياري)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              كلمة المرور *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>

            {/* Live Criteria Badges */}
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
              <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                8 أحرف فأكثر
              </span>
              <span className={`flex items-center gap-1 ${hasUpper && hasLower ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hasUpper && hasLower ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                حروف كبيرة وصغيرة
              </span>
              <span className={`flex items-center gap-1 ${hasDigit ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hasDigit ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                أرقام (0-9)
              </span>
              <span className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hasSpecial ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                رموز خاصة (!@#$)
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              تأكيد كلمة المرور *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 ${
                  confirmPassword && !passwordsMatch
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                }`}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-[11px] text-rose-500 mt-1 font-semibold">كلمتا المرور غير متطابقتين</p>
            )}
          </div>

          {/* Note about multi-company */}
          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed">
            💡 <strong>ملاحظة:</strong> بعد إنشاء حسابك، ستتمكن من إنشاء الشركات المتعددة وربط كل شركة بمخازنها وعهدها بكل سهولة من لوحة التحكم.
          </div>

          {/* Submit CTA */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>جارٍ إنشاء الحساب وتجهيز النظام...</span>
              ) : (
                <>
                  <span>إنشاء حساب مسؤول النظام والدخول فوراً</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>

            {canCancel && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer text-center"
              >
                العودة إلى شاشة تسجيل الدخول
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
