import React, { useEffect, useState } from 'react';
import { Stethoscope, UserPlus, Users } from 'lucide-react';
import { api } from '../../services/api';

const emptyForm = { full_name: '', email: '', department: '', username: '', password: '' };

export const DoctorManagementPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const doctors = users.filter((user) => user.role_name === 'doctor');
  const staff = users.filter((user) => user.role_name !== 'doctor');

  const loadUsers = async () => {
    try { setUsers(await api.getAdminUsers()); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load staff accounts.'); }
  };
  useEffect(() => { loadUsers(); }, []);
  const updateField = (field: keyof typeof emptyForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice(''); setSaving(true);
    try {
      const doctor = await api.createDoctor(form);
      setUsers((current) => [...current, doctor].sort((left, right) => left.full_name.localeCompare(right.full_name)));
      setNotice(`Account created for ${doctor.full_name}. Login: ${form.username} / ${form.password}`);
      setForm(emptyForm);
    } catch (createError) { setError(createError instanceof Error ? createError.message : 'Unable to create doctor account.'); }
    finally { setSaving(false); }
  };

  const AccountList = ({ title, items, icon: Icon, empty }: any) => <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between"><div className="flex items-center gap-2"><Icon size={17} className="text-teal-700" /><h2 className="text-base font-bold text-slate-800">{title}</h2></div><span className="text-xs font-bold text-violet-700">{items.length} active</span></div><div className="divide-y divide-slate-100">{items.map((user: any) => <div key={user.id} className="flex items-center gap-3 px-5 py-3"><div className="rounded-xl bg-teal-50 p-2 text-teal-700"><Icon size={16} /></div><div className="min-w-0"><p className="text-sm font-bold text-slate-900">{user.full_name}</p><p className="text-xs text-slate-500">{user.department || 'No department'} · {user.username}</p></div><span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold capitalize text-slate-600">{user.role_name}</span></div>)}{items.length === 0 && <p className="px-5 py-6 text-sm text-slate-500">{empty}</p>}</div></div>;

  return <div className="space-y-5"><div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-5"><form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"><div className="flex items-center gap-2"><UserPlus size={18} className="text-violet-600" /><div><h2 className="text-base font-bold text-slate-800">Add Doctor</h2><p className="text-xs text-slate-500">New doctors appear immediately in OPD Triage assignment.</p></div></div><input required value={form.full_name} onChange={(event) => updateField('full_name', event.target.value)} placeholder="Doctor full name" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /><input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="Email (optional)" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /><input required value={form.department} onChange={(event) => updateField('department', event.target.value)} placeholder="Specialization, e.g. Cardiology" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /><div className="grid grid-cols-2 gap-3"><input required minLength={3} value={form.username} onChange={(event) => updateField('username', event.target.value)} placeholder="Username" className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /><input required minLength={8} type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Temporary password" className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /></div>{error && <p className="text-xs font-semibold text-rose-600">{error}</p>}{notice && <p className="text-xs font-semibold text-emerald-700">{notice}</p>}<button disabled={saving} className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">{saving ? 'Creating account...' : 'Create Doctor Account'}</button></form><AccountList title="Active Doctors" items={doctors} icon={Stethoscope} empty="No doctor accounts found." /></div><AccountList title="Existing Staff & Administrators" items={staff} icon={Users} empty="No staff accounts found." /></div>;
};
