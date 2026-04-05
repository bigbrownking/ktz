'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Train, Plus, Trash2, Edit2, Check, Upload,
  MapPin, User, Mail, Calendar, Shield, X, RefreshCw,
} from 'lucide-react';
import {
  routesApi, locomotivesApi, driversApi,
  ApiRoute, ApiLocomotive, ApiDriver,
} from '@/shared/lib/api-client';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Активен', MAINTENANCE: 'Обслуживание', STOPPED: 'Остановлен', off: 'Выходной',
  ROLE_USER: 'Машинист', ROLE_ADMIN: 'Диспетчер',
};

const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600';
const saveBtn = 'flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-lg text-sm text-white font-semibold transition-colors';
const cancelBtn = 'px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors';

function Field({ label, children, className, icon }: { label: string; children: React.ReactNode; className?: string; icon?: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="flex items-center gap-1 text-xs text-slate-400 mb-1 font-medium">{icon}{label}</label>
      {children}
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<'locos' | 'routes' | 'drivers' | 'users'>('locos');
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Диспетчерский центр</h1>
          <p className="text-slate-400 text-sm mt-1">Управление локомотивами, маршрутами и машинистами</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 text-sm font-semibold">Роль: Диспетчер</span>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800">
        {([['locos', 'Локомотивы', Train], ['routes', 'Маршруты', MapPin], ['drivers', 'Машинисты', User], ['users', 'Учётные записи', Shield]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${tab === id ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'locos'   && <LocomotivesTab />}
      {tab === 'routes'  && <RoutesTab />}
      {tab === 'drivers' && <DriversTab />}
      {tab === 'users'   && <UsersTab />}
    </div>
  );
}

function LocomotivesTab() {
  const [locos, setLocos] = useState<ApiLocomotive[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ number: '', type: 'TE33A', name: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { setLocos(await locomotivesApi.getAll()); } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.number.trim()) return;
    try {
      const created = await locomotivesApi.create(form);
      setLocos(p => [...p, created]);
      setForm({ number: '', type: 'TE33A', name: '' });
      setAdding(false);
    } catch { }
  };

  const remove = async (id: number) => {
    try { await locomotivesApi.delete(id); setLocos(p => p.filter(l => l.id !== id)); } catch { }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{loading ? '…' : `${locos.length} локомотивов`}</h2>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setAdding(true)} className={saveBtn}><Plus className="w-4 h-4" /> Добавить</button>
        </div>
      </div>

      {adding && (
        <div className="bg-[#0f1629] border border-cyan-500/30 rounded-xl p-5 space-y-4">
          <h3 className="text-cyan-400 font-semibold">Новый локомотив</h3>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Номер (напр. TE33A-003)">
              <input value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} className={inputCls} placeholder="TE33A-003" />
            </Field>
            <Field label="Тип">
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                <option value="TE33A">TE33A (дизель)</option>
                <option value="KZ8A">KZ8A (электро)</option>
              </select>
            </Field>
            <Field label="Название маршрута">
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Астана-Кокшетау" />
            </Field>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className={cancelBtn}>Отмена</button>
            <button onClick={save} className={saveBtn}><Check className="w-4 h-4" /> Сохранить</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {locos.map(loco => (
          <div key={loco.id} className="bg-[#0f1629] border border-[#1e2a45] rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center">
              <Train className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{loco.number}</span>
                <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded">{loco.type}</span>
              </div>
              <div className="text-sm text-slate-400 mt-0.5">{loco.name}</div>
            </div>
            <button onClick={() => remove(loco.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoutesTab() {
  const [routes, setRoutes] = useState<ApiRoute[]>([]);
  const [locos, setLocos] = useState<ApiLocomotive[]>([]);
  const [drivers, setDrivers] = useState<ApiDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const emptyForm = { origin: '', destination: '', stations: '', distanceKm: '', estimatedMinutes: '', locomotiveId: '', userId: '', startLat: '', startLon: '', endLat: '', endLon: '', status: 'ACTIVE' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, l, d] = await Promise.all([routesApi.getAll(), locomotivesApi.getAll(), driversApi.getAll()]);
      setRoutes(r); setLocos(l); setDrivers(d.filter(u => u.role === 'ROLE_USER'));
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (r: ApiRoute) => {
    setEditId(r.id);
    setForm({
      origin: r.origin, destination: r.destination, stations: r.stations ?? '',
      distanceKm: String(r.distanceKm ?? ''), estimatedMinutes: String(r.estimatedMinutes ?? ''),
      locomotiveId: String(r.locomotiveId ?? ''), userId: String(r.userId ?? ''),
      startLat: String(r.startLat ?? ''), startLon: String(r.startLon ?? ''),
      endLat: String(r.endLat ?? ''), endLon: String(r.endLon ?? ''), status: r.status ?? 'ACTIVE',
    });
    setAdding(true);
  };

  const save = async () => {
    if (!form.origin.trim() || !form.destination.trim()) return;
    const body = {
      origin: form.origin, destination: form.destination, stations: form.stations,
      status: form.status,
      distanceKm: form.distanceKm ? Number(form.distanceKm) : null,
      estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null,
      locomotiveId: form.locomotiveId ? Number(form.locomotiveId) : null,
      userId: form.userId ? Number(form.userId) : null,
      startLat: form.startLat ? Number(form.startLat) : null,
      startLon: form.startLon ? Number(form.startLon) : null,
      endLat: form.endLat ? Number(form.endLat) : null,
      endLon: form.endLon ? Number(form.endLon) : null,
    };
    try {
      if (editId) {
        const updated = await routesApi.update(editId, body);
        setRoutes(p => p.map(r => r.id === editId ? updated : r));
      } else {
        const created = await routesApi.create(body);
        setRoutes(p => [...p, created]);
      }
      setForm(emptyForm); setAdding(false); setEditId(null);
    } catch { }
  };

  const remove = async (id: number) => {
    try { await routesApi.delete(id); setRoutes(p => p.filter(r => r.id !== id)); } catch { }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{loading ? '…' : `${routes.length} маршрутов`}</h2>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { setEditId(null); setForm(emptyForm); setAdding(true); }} className={saveBtn}><Plus className="w-4 h-4" /> Добавить</button>
        </div>
      </div>

      {adding && (
        <div className="bg-[#0f1629] border border-cyan-500/30 rounded-xl p-5 space-y-4">
          <h3 className="text-cyan-400 font-semibold">{editId ? 'Редактировать маршрут' : 'Новый маршрут'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Откуда"><input value={form.origin} onChange={e => setForm(p => ({ ...p, origin: e.target.value }))} className={inputCls} placeholder="Астана" /></Field>
            <Field label="Куда"><input value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} className={inputCls} placeholder="Кокшетау" /></Field>
            <Field label="Промежуточные станции (через запятую)" className="col-span-2">
              <input value={form.stations} onChange={e => setForm(p => ({ ...p, stations: e.target.value }))} className={inputCls} placeholder="Астана,Акколь,Степногорск,Кокшетау" />
            </Field>
            <Field label="Расстояние (км)"><input type="number" value={form.distanceKm} onChange={e => setForm(p => ({ ...p, distanceKm: e.target.value }))} className={inputCls} placeholder="280" /></Field>
            <Field label="Время в пути (мин)"><input type="number" value={form.estimatedMinutes} onChange={e => setForm(p => ({ ...p, estimatedMinutes: e.target.value }))} className={inputCls} placeholder="195" /></Field>
            <Field label="Локомотив">
              <select value={form.locomotiveId} onChange={e => setForm(p => ({ ...p, locomotiveId: e.target.value }))} className={inputCls}>
                <option value="">— Не назначен —</option>
                {locos.map(l => <option key={l.id} value={l.id}>{l.number} ({l.type})</option>)}
              </select>
            </Field>
            <Field label="Машинист">
              <select value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))} className={inputCls}>
                <option value="">— Не назначен —</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name} {d.surname}</option>)}
              </select>
            </Field>
            <Field label="Широта старта (lat)"><input type="number" step="0.0001" value={form.startLat} onChange={e => setForm(p => ({ ...p, startLat: e.target.value }))} className={inputCls} placeholder="51.1800" /></Field>
            <Field label="Долгота старта (lon)"><input type="number" step="0.0001" value={form.startLon} onChange={e => setForm(p => ({ ...p, startLon: e.target.value }))} className={inputCls} placeholder="71.4500" /></Field>
            <Field label="Широта финиша (lat)"><input type="number" step="0.0001" value={form.endLat} onChange={e => setForm(p => ({ ...p, endLat: e.target.value }))} className={inputCls} placeholder="53.2800" /></Field>
            <Field label="Долгота финиша (lon)"><input type="number" step="0.0001" value={form.endLon} onChange={e => setForm(p => ({ ...p, endLon: e.target.value }))} className={inputCls} placeholder="69.4000" /></Field>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); setEditId(null); }} className={cancelBtn}>Отмена</button>
            <button onClick={save} className={saveBtn}><Check className="w-4 h-4" /> Сохранить</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {routes.map(r => {
          const stations = r.stations ? r.stations.split(',').map(s => s.trim()) : [];
          const etaH = r.estimatedMinutes ? Math.floor(r.estimatedMinutes / 60) : null;
          const etaM = r.estimatedMinutes ? r.estimatedMinutes % 60 : null;
          return (
            <div key={r.id} className="bg-[#0f1629] border border-[#1e2a45] rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="font-bold text-white">{r.origin} → {r.destination}</div>
                    {r.locomotiveNumber && <div className="text-xs text-cyan-400 font-mono mt-0.5">{r.locomotiveNumber}</div>}
                    {r.driverName && <div className="text-xs text-slate-400">{r.driverName} {r.driverSurname}</div>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(r)} className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => remove(r.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {stations.length > 0 && (
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {stations.map((st, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${i === 0 || i === stations.length - 1 ? 'bg-cyan-500/20 text-cyan-400 font-semibold' : 'bg-slate-800 text-slate-400'}`}>{st}</span>
                      {i < stations.length - 1 && <span className="text-slate-600 text-xs">→</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {r.distanceKm && <div className="bg-slate-900 rounded-lg p-2"><div className="text-slate-500 text-xs mb-0.5">Расстояние</div><div className="text-white text-sm font-bold">{r.distanceKm} км</div></div>}
                {etaH !== null && <div className="bg-slate-900 rounded-lg p-2"><div className="text-slate-500 text-xs mb-0.5">Время</div><div className="text-white text-sm font-bold">{etaH}ч {etaM}м</div></div>}
                {r.distanceKm && r.estimatedMinutes && <div className="bg-slate-900 rounded-lg p-2"><div className="text-slate-500 text-xs mb-0.5">Ср. скорость</div><div className="text-white text-sm font-bold">{Math.round(r.distanceKm / (r.estimatedMinutes / 60))} км/ч</div></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DriversTab() {
  const [drivers, setDrivers] = useState<ApiDriver[]>([]);
  const [locos, setLocos] = useState<ApiLocomotive[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', surname: '', username: '', age: '', locomotiveId: '', password: '', photoUrl: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, l] = await Promise.all([driversApi.getAll(), locomotivesApi.getAll()]);
      setDrivers(d); setLocos(l);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setForm(p => ({ ...p, photoUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.name.trim() || !form.username.trim()) return;
    setSaving(true);
    try {
      const created = await driversApi.create({
        name: form.name, surname: form.surname, username: form.username,
        age: Number(form.age) || 25, password: form.password || 'Ktz@2026',
        role: 'ROLE_USER',
        locomotiveId: form.locomotiveId ? Number(form.locomotiveId) : undefined,
      }, photoFile ?? undefined);
      setDrivers(p => [...p, created]);
      setForm({ name: '', surname: '', username: '', age: '', locomotiveId: '', password: '', photoUrl: '' });
      setPhotoFile(null);
      setAdding(false);
    } catch { }
    setSaving(false);
  };

  const remove = async (id: number) => {
    try { await driversApi.delete(id); setDrivers(p => p.filter(d => d.id !== id)); } catch { }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{loading ? '…' : `${drivers.length} машинистов`}</h2>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setAdding(true)} className={saveBtn}><Plus className="w-4 h-4" /> Добавить</button>
        </div>
      </div>

      {adding && (
        <div className="bg-[#0f1629] border border-cyan-500/30 rounded-xl p-5 space-y-4">
          <h3 className="text-cyan-400 font-semibold">Новый машинист</h3>
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-full border-2 border-dashed border-slate-600 hover:border-cyan-500 flex items-center justify-center cursor-pointer overflow-hidden transition-colors">
                {form.photoUrl
                  ? <img src={form.photoUrl} alt="preview" className="w-full h-full object-cover" />
                  : <div className="flex flex-col items-center gap-1 text-slate-500"><Upload className="w-6 h-6" /><span className="text-xs">Фото</span></div>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <Field label="Имя" icon={<User className="w-3.5 h-3.5" />}><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Нұрлан" /></Field>
              <Field label="Фамилия" icon={<User className="w-3.5 h-3.5" />}><input value={form.surname} onChange={e => setForm(p => ({ ...p, surname: e.target.value }))} className={inputCls} placeholder="Бекжанов" /></Field>
              <Field label="Логин" icon={<Mail className="w-3.5 h-3.5" />}><input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} className={inputCls} placeholder="bekzhanov" /></Field>
              <Field label="Возраст" icon={<Calendar className="w-3.5 h-3.5" />}><input type="number" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} className={inputCls} placeholder="30" min="18" max="65" /></Field>
              <Field label="Локомотив">
                <select value={form.locomotiveId} onChange={e => setForm(p => ({ ...p, locomotiveId: e.target.value }))} className={inputCls}>
                  <option value="">— Не назначен —</option>
                  {locos.map(l => <option key={l.id} value={l.id}>{l.number}</option>)}
                </select>
              </Field>
              <Field label="Пароль (авто если пусто)"><input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className={inputCls} placeholder="••••••••" /></Field>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className={cancelBtn}>Отмена</button>
            <button onClick={save} disabled={saving} className={saveBtn}>
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              Сохранить
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {drivers.map(d => {
          const loco = locos.find(l => l.id === d.locomotiveId);
          return (
            <div key={d.id} className="bg-[#0f1629] border border-[#1e2a45] rounded-xl p-4 flex items-center gap-3">
              <img
                src={d.photoUrl || `https://i.pravatar.cc/150?u=${d.username}`}
                alt={d.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-cyan-500/40 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{d.name} {d.surname}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3" />{d.username}
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{d.age} лет</span>
                  {loco && <span className="flex items-center gap-1 text-cyan-400"><Train className="w-3 h-3" />{loco.number}</span>}
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] ${d.role === 'ROLE_ADMIN' ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' : 'text-green-400 bg-green-500/15 border-green-500/30'}`}>
                    {STATUS_LABEL[d.role] ?? d.role}
                  </span>
                </div>
              </div>
              <button onClick={() => remove(d.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<ApiDriver[]>([]);
  const [locos, setLocos] = useState<ApiLocomotive[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: '', name: '', surname: '', age: '', password: '', role: 'ROLE_USER', locomotiveId: '' });
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, l] = await Promise.all([driversApi.getAll(), locomotivesApi.getAll()]);
      setUsers(u);
      setLocos(l);
    } catch { setErr('Ошибка загрузки'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.username || !form.password || !form.name) { setErr('Заполните обязательные поля'); return; }
    setSaving(true); setErr('');
    try {
      await driversApi.create({
        name: form.name, surname: form.surname, username: form.username,
        age: parseInt(form.age) || 0, password: form.password, role: form.role,
        locomotiveId: form.locomotiveId ? parseInt(form.locomotiveId) : null,
      });
      setForm({ username: '', name: '', surname: '', age: '', password: '', role: 'ROLE_USER', locomotiveId: '' });
      setAdding(false);
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    try { await driversApi.delete(id); setUsers(u => u.filter(x => x.id !== id)); }
    catch { setErr('Ошибка удаления'); }
  };

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">Учётные записи создаются только администратором. Самостоятельная регистрация отключена.</p>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setAdding(a => !a)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm text-white font-semibold transition-colors">
            {adding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {adding ? 'Отмена' : 'Создать аккаунт'}
          </button>
        </div>
      </div>

      {err && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{err}</div>}

      {adding && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-white text-sm">Новая учётная запись</h3>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Логин *"><input className={inputCls} value={form.username} onChange={f('username')} placeholder="nurlan" /></Field>
            <Field label="Имя *"><input className={inputCls} value={form.name} onChange={f('name')} placeholder="Нұрлан" /></Field>
            <Field label="Фамилия"><input className={inputCls} value={form.surname} onChange={f('surname')} placeholder="Бекжанов" /></Field>
            <Field label="Возраст"><input className={inputCls} type="number" value={form.age} onChange={f('age')} placeholder="35" /></Field>
            <Field label="Пароль *"><input className={inputCls} type="password" value={form.password} onChange={f('password')} placeholder="••••••••" /></Field>
            <Field label="Роль">
              <select className={inputCls} value={form.role} onChange={f('role')}>
                <option value="ROLE_USER">Машинист</option>
                <option value="ROLE_ADMIN">Диспетчер</option>
              </select>
            </Field>
            <Field label="Локомотив" className="col-span-3">
              <select className={inputCls} value={form.locomotiveId} onChange={f('locomotiveId')}>
                <option value="">— Не назначен —</option>
                {locos.map(l => <option key={l.id} value={l.id}>{l.number} — {l.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className={saveBtn}>
              <Check className="w-4 h-4" />{saving ? 'Создание...' : 'Создать'}
            </button>
            <button onClick={() => setAdding(false)} className={cancelBtn}>Отмена</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />Загрузка...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {users.map(u => {
            const loco = locos.find(l => l.id === u.locomotiveId);
            return (
              <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                {u.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.photoUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-slate-700 flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-sm truncate">{u.name} {u.surname}</div>
                      <div className="text-xs text-slate-500 font-mono">@{u.username}</div>
                    </div>
                    <button onClick={() => remove(u.id)} className="p-1 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors ml-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${u.role === 'ROLE_ADMIN' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-green-400 bg-green-500/10 border-green-500/30'}`}>
                      {STATUS_LABEL[u.role] ?? u.role}
                    </span>
                    {u.age > 0 && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{u.age} лет</span>}
                    {loco && <span className="text-[10px] text-cyan-400 flex items-center gap-1"><Train className="w-2.5 h-2.5" />{loco.number}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

