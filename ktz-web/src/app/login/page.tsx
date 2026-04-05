'use client';

import { useState } from 'react';
import { Activity, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { saveSession } from '@/shared/lib/auth-store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? 'Неверный логин или пароль');
      }
      const data = await res.json();
      saveSession({
        token: data.token,
        refreshToken: data.refreshToken ?? '',
        role: data.role ?? 'ROLE_USER',
        userId: data.userId ?? null,
        username: data.username ?? username,
        name: data.name ?? '',
        surname: data.surname ?? '',
        photoUrl: data.photoUrl ?? null,
        age: data.age ?? 0,
        locomotiveNumber: data.locomotiveNumber ?? null,
        locomotiveName: data.locomotiveName ?? null,
      });
      window.location.href = data.role === 'ROLE_ADMIN' ? '/admin' : '/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0a0a' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-xl font-bold text-white tracking-widest">KINETIC OBSERVER</span>
          </div>
          <p className="text-slate-500 text-xs text-center">
            Система мониторинга локомотивов КТЖ
          </p>
        </div>

        <div className="rounded-2xl p-7" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
          {error && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-red-300 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Логин</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="nurlan"
                className="w-full rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none text-sm transition-colors"
                style={{ background: '#1e1e1e', border: '1px solid #333', outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = '#06b6d4')}
                onBlur={e => (e.target.style.borderColor = '#333')}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-600 focus:outline-none text-sm transition-colors"
                  style={{ background: '#1e1e1e', border: '1px solid #333' }}
                  onFocus={e => (e.target.style.borderColor = '#06b6d4')}
                  onBlur={e => (e.target.style.borderColor = '#333')}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 font-bold text-sm uppercase tracking-wider text-white rounded-xl transition-colors mt-2"
              style={{ background: loading ? '#1e1e1e' : '#0891b2', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-700 text-xs mt-5">
          © 2026 KTZ Kinetic Observer · v2.1
        </p>
      </div>
    </div>
  );
}
