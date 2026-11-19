import React, { useEffect, useState } from 'react';
import { BadgeCheck, ContactRound, IdCard, Mail, Phone, Printer, Save, ShieldCheck, UserRound, X } from 'lucide-react';
import { api } from '../services/api';
import { LoginResponse } from '../types';

const loadAdmin = (): LoginResponse => {
  try {
    const saved = JSON.parse(localStorage.getItem('chromaguard_user') || '{}') as LoginResponse;
    if (saved.role === 'ROLE_ADMIN') return saved;
  } catch { /* use the empty profile below */ }
  return { token: null, username: null, role: 'ROLE_ADMIN', fullName: null, associatedWorkerId: null, message: '' };
};

export const AdminDetailsPage: React.FC = () => {
  const [admin, setAdmin] = useState<LoginResponse>(loadAdmin);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(admin.fullName || '');
  const [adminId, setAdminId] = useState(admin.username || '');
  const [email, setEmail] = useState(admin.email || '');
  const [phoneNumber, setPhoneNumber] = useState(admin.phoneNumber || '');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const exportProfilePdf = () => {
    document.body.classList.add('dashboard-print-mode');
    const cleanup = () => document.body.classList.remove('dashboard-print-mode');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(() => { window.print(); window.setTimeout(cleanup, 1000); }, 100);
  };

  useEffect(() => {
    let active = true;
    api.getCurrentUser()
      .then((profile) => {
        if (!active) return;
        if (profile.role !== 'ROLE_ADMIN') {
          setError('This page is available to Admin accounts only.');
          return;
        }
        let savedContact: Partial<LoginResponse> = {};
        try { savedContact = JSON.parse(localStorage.getItem('chromaguard_admin_profile_extra') || '{}'); } catch { /* use server profile */ }
        const latest: LoginResponse = {
          ...profile,
          email: profile.email || savedContact.email || null,
          phoneNumber: profile.phoneNumber || savedContact.phoneNumber || null,
          token: admin.token,
          associatedWorkerId: admin.associatedWorkerId,
        };
        localStorage.setItem('chromaguard_user', JSON.stringify(latest));
        setAdmin(latest);
        setName(latest.fullName || '');
        setAdminId(latest.username || '');
        setEmail(latest.email || '');
        setPhoneNumber(latest.phoneNumber || '');
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load Admin details.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // Load the authenticated profile once when this page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEditing = () => {
    setName(admin.fullName || '');
    setAdminId(admin.username || '');
    setEmail(admin.email || '');
    setPhoneNumber(admin.phoneNumber || '');
    setError('');
    setSaved(false);
    setEditing(true);
  };

  const saveDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await api.updateAdminProfile({ fullName: name.trim(), username: adminId.trim(), email, phoneNumber });
      const contactDetails = { email: email.trim(), phoneNumber: phoneNumber.trim() };
      localStorage.setItem('chromaguard_admin_profile_extra', JSON.stringify(contactDetails));
      const nextAdmin: LoginResponse = {
        ...admin,
        ...updated,
        ...contactDetails,
        token: admin.token,
        associatedWorkerId: admin.associatedWorkerId,
      };
      localStorage.setItem('chromaguard_user', JSON.stringify(nextAdmin));
      setAdmin(nextAdmin);
      setName(nextAdmin.fullName || '');
      setAdminId(nextAdmin.username || '');
      setEmail(nextAdmin.email || '');
      setPhoneNumber(nextAdmin.phoneNumber || '');
      setEditing(false);
      setSaved(true);
      window.dispatchEvent(new CustomEvent('chromaguard:user-changed', { detail: nextAdmin }));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save Admin details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-details-page dashboard-print-root space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-800"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />Admin account</div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Admin Details</h2>
          <p className="mt-2 text-sm text-slate-500">View and update the details for your Admin account.</p>
        </div>
        {!editing && <div className="dashboard-export-controls flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm"><button type="button" disabled={loading} onClick={exportProfilePdf} className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-100 disabled:opacity-50"><Printer className="h-4 w-4"/>Save profile PDF</button><button type="button" disabled={loading} onClick={startEditing} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-700 to-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/15 transition hover:-translate-y-0.5 hover:from-cyan-800 hover:to-teal-800 disabled:cursor-wait disabled:opacity-60"><ContactRound className="h-4 w-4" />{loading ? 'Loading details…' : 'Edit details'}</button></div>}
      </header>

      {saved && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm">Admin details saved successfully.</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{error}</p>}

      <div className="admin-profile-hero relative isolate overflow-hidden rounded-[1.75rem] p-5 sm:p-7">
        <div className="admin-profile-orbit admin-profile-orbit-one" />
        <div className="admin-profile-orbit admin-profile-orbit-two" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="admin-profile-avatar"><UserRound className="h-8 w-8 sm:h-10 sm:w-10" /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-800">Administrator profile</p>
              <h3 className="mt-1 truncate text-xl font-bold text-slate-900 sm:text-2xl">{admin.fullName || 'Admin name'}</h3>
              <div className="admin-profile-id"><IdCard className="h-3.5 w-3.5 shrink-0" /><span className="truncate">Admin ID · {admin.username || 'Not set'}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:pl-5">
            <div className="admin-profile-role">
              <p>ACCOUNT ROLE</p>
              <strong><ShieldCheck/>Administrator</strong>
              <span><i/>Signed in</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)]">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_-28px_rgba(15,23,42,.35)] transition-shadow hover:shadow-[0_18px_45px_-30px_rgba(15,23,42,.4)] sm:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-teal-50 text-cyan-700"><UserRound className="h-5 w-5" /></div>
            <div><h3 className="font-semibold text-slate-900">Personal details</h3><p className="mt-0.5 text-xs text-slate-500">Your saved Admin profile information</p></div>
          </div>

          {loading ? <p className="py-5 text-sm text-slate-500">Loading Admin details…</p> : editing ? (
            <form onSubmit={saveDetails} className="admin-personal-edit-form common-editor-form space-y-4">
              <label className="common-editor-field block text-sm font-medium text-slate-700">Full name
                <input required maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100" />
              </label>
              <label className="common-editor-field block text-sm font-medium text-slate-700">Admin ID
                <input required minLength={3} maxLength={32} pattern="[a-zA-Z0-9._-]+" autoComplete="username" value={adminId} onChange={(event) => setAdminId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100" />
                <span className="mt-1 block text-xs font-normal text-slate-500">3–32 letters, numbers, dots, underscores, or hyphens.</span>
              </label>
              <label className="common-editor-field block text-sm font-medium text-slate-700">Email address<input type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100" placeholder="name@company.com" /></label>
              <label className="common-editor-field block text-sm font-medium text-slate-700">Phone number<input type="tel" maxLength={32} autoComplete="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100" placeholder="Optional contact number" /></label>
              <div className="common-editor-actions flex flex-wrap gap-2 pt-1">
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-wait disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save details'}</button>
                <button type="button" disabled={saving} onClick={() => { setEditing(false); setError(''); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"><X className="h-4 w-4" />Cancel</button>
              </div>
            </form>
          ) : (
            <dl className="admin-personal-detail-grid grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"><dt className="flex items-center gap-2 text-xs font-medium text-slate-500"><UserRound className="h-4 w-4 text-cyan-700" />Full name</dt><dd className="mt-2 break-words text-sm font-semibold text-slate-900">{admin.fullName || 'Not set'}</dd></div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"><dt className="flex items-center gap-2 text-xs font-medium text-slate-500"><IdCard className="h-4 w-4 text-cyan-700" />Admin ID</dt><dd className="mt-2 break-words text-sm font-semibold text-slate-900">{admin.username || 'Not set'}</dd></div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"><dt className="flex items-center gap-2 text-xs font-medium text-slate-500"><Mail className="h-4 w-4 text-cyan-700" />Email address</dt><dd className="mt-2 break-words text-sm font-semibold text-slate-900">{admin.email || 'Not added'}</dd></div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"><dt className="flex items-center gap-2 text-xs font-medium text-slate-500"><Phone className="h-4 w-4 text-cyan-700" />Phone number</dt><dd className="mt-2 break-words text-sm font-semibold text-slate-900">{admin.phoneNumber || 'Not added'}</dd></div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:col-span-2"><dt className="flex items-center gap-2 text-xs font-medium text-slate-500"><ShieldCheck className="h-4 w-4 text-teal-700" />Account type</dt><dd className="mt-2 text-sm font-semibold text-slate-900">Administrator</dd></div>
            </dl>
          )}
        </article>

        <aside className="admin-profile-note">
          <div className="admin-access-heading"><span><BadgeCheck className="h-5 w-5"/></span><div><p>PROFILE NOTES</p><h3>About these details</h3></div></div>
          <ul>
            <li>Your name and Admin ID identify your account in the profile menu.</li>
            <li>Email and phone are optional contact details.</li>
            <li>Select <strong>Edit details</strong>, update your information, then save.</li>
          </ul>
          <div className="admin-profile-note-status"><ShieldCheck/><span><strong>Administrator account</strong><small>Profile changes save to the account you are signed in to.</small></span></div>
        </aside>
      </div>
    </section>
  );
};
