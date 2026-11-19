import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, Shield, UserRound, UserCog, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import { LoginResponse } from '../types';
import { IndustrialZone, Shift } from '../types';
import { LoginHeroVisual } from '../components/LoginHeroVisual';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'worker' | 'admin'>('admin');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [zones, setZones] = useState<IndustrialZone[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workerOptionsLoading, setWorkerOptionsLoading] = useState(false);
  const [zoneId, setZoneId] = useState('');
  const [shiftId, setShiftId] = useState('');
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);
  useEffect(() => {
    if (mode !== 'register' || selectedRole !== 'worker') return;
    let active = true;
    setWorkerOptionsLoading(true);
    setError('');
    Promise.all([api.getZones(), api.getShifts()]).then(([availableZones, availableShifts]) => {
      if (!active) return;
      setZones(availableZones.filter((zone) => zone.active !== false));
      setShifts(availableShifts);
      setZoneId((current) => availableZones.some((zone) => zone.id === current) ? current : availableZones[0]?.id || '');
      setShiftId((current) => availableShifts.some((shift) => shift.id === current) ? current : availableShifts[0]?.id || '');
    }).catch((loadError) => {
      if (active) setError(loadError instanceof Error ? `Could not load zone and shift options: ${loadError.message}` : 'Could not load worker zone and shift options. Please try again.');
    }).finally(() => { if (active) setWorkerOptionsLoading(false); });
    return () => { active = false; };
  }, [mode, selectedRole]);
  let savedUser: LoginResponse | null = null;
  try {
    savedUser = JSON.parse(localStorage.getItem('chromaguard_user') || 'null');
  } catch {
    localStorage.removeItem('chromaguard_user');
  }

  if (savedUser?.token && ['ROLE_ADMIN', 'ROLE_WORKER'].includes(savedUser.role || '')) {
    return <Navigate to="/dashboard" replace />;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'register') {
        if (password !== confirmPassword) throw new Error('Passwords do not match. Please check and try again.');
        if (selectedRole === 'worker' && (!zoneId || !shiftId)) throw new Error('Choose a work zone and shift before creating a worker account.');
        const registered = await api.register(fullName.trim(), username.trim(), password, selectedRole === 'admin' ? 'ROLE_ADMIN' : 'ROLE_WORKER', selectedRole === 'worker' ? zoneId : undefined, selectedRole === 'worker' ? shiftId : undefined);
        localStorage.setItem('chromaguard_user', JSON.stringify(registered));
        window.dispatchEvent(new CustomEvent('chromaguard:user-changed', { detail: registered }));
        navigate('/dashboard', { replace: true });
        return;
      }
      const user = await api.login(username.trim(), password);
      if (!user.token || !['ROLE_ADMIN', 'ROLE_WORKER'].includes(user.role || '')) {
        throw new Error('Only worker and admin accounts can sign in.');
      }
      if (user.role !== (selectedRole === 'admin' ? 'ROLE_ADMIN' : 'ROLE_WORKER')) {
        throw new Error(`These credentials are not for an ${selectedRole} account.`);
      }
      localStorage.setItem('chromaguard_user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('chromaguard:user-changed', { detail: user }));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`login-stage ${selectedRole === 'worker' ? 'login-role-worker' : 'login-role-admin'} min-h-screen text-slate-800 flex items-center justify-center p-4 sm:p-7 relative overflow-hidden`}>
            <div className="absolute inset-0 login-contours pointer-events-none" />
      <div className={`absolute -top-48 -left-40 w-[36rem] h-[36rem] rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${selectedRole === 'worker' ? 'bg-emerald-200/70' : 'bg-orange-200/70'}`} />
      <div className={`absolute -bottom-56 -right-32 w-[38rem] h-[38rem] rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${selectedRole === 'worker' ? 'bg-teal-100' : 'bg-sky-100'}`} />
      <div className="login-card relative w-full max-w-6xl grid lg:grid-cols-[1.08fr_0.92fr] rounded-[2rem] overflow-hidden border border-white/70 bg-white/75 shadow-[0_35px_100px_-45px_rgba(22,41,61,0.38)] backdrop-blur-2xl">
        <section className="login-hero-panel hidden lg:flex flex-col justify-between p-10 xl:p-12 bg-[#e9e3d8] border-r border-[#d9d4ca] relative overflow-hidden">
          <div>
            <div className="flex items-center gap-3">
              <div className="login-brand-icon w-11 h-11 rounded-2xl bg-[#f47a35] flex items-center justify-center shadow-lg shadow-orange-900/15"><Shield className="w-6 h-6 text-white" /></div>
              <div><p className="text-xl font-bold text-[#16293d]">Chroma<span className="login-brand-accent text-[#e66f30]">Guard</span></p><p className="text-[10px] text-[#647486] font-mono tracking-[0.2em]">{selectedRole === 'worker' ? 'WORKER SAFETY PORTAL' : 'ADMIN SAFETY CONTROL'}</p></div>
            </div>
            <div className="mt-12"><div className="login-role-pill inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d8c7b3] bg-white/65 text-[#8b5d3f] text-xs"><Activity className="w-3.5 h-3.5" />{selectedRole === 'worker' ? 'Personal worker safety portal' : 'Secure admin operations portal'}</div><h1 className="mt-6 text-4xl xl:text-[3.25rem] font-bold leading-[1.08] tracking-tight text-[#16293d]">{selectedRole === 'worker' ? 'Your safety, through every shift.' : 'Safety insights for every shift.'}</h1><p className="mt-4 max-w-md text-sm leading-6 text-[#718093]">{selectedRole === 'worker' ? 'Access your own worker details, shift exposure and safety alerts.' : 'Monitor worker exposure, zone activity and safety alerts across your operation.'}</p></div>
          </div>
          <div className="login-hero-stage -mx-8 xl:-mx-10 -mb-9 h-[290px] relative"><LoginHeroVisual variant={selectedRole} /></div>
          <p className="text-xs text-[#687789]">Authorized personnel only · Activity is protected by role based access.</p>
        </section>

        <section className="login-form-panel p-7 sm:p-11 lg:p-12 flex flex-col justify-center bg-white/75">
          <div className="lg:hidden flex items-center gap-3 mb-10"><div className="login-brand-icon w-10 h-10 rounded-2xl bg-[#f47a35] flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div><p className="text-lg font-bold text-[#16293d]">Chroma<span className="login-brand-accent text-[#e66f30]">Guard</span></p></div>
          <div className="login-form-icon w-12 h-12 rounded-2xl bg-[#fff0e6] flex items-center justify-center text-[#df6d31]"><KeyRound className="w-6 h-6" /></div>
          <h2 className="mt-6 text-2xl font-bold text-[#16293d]">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-2 text-sm text-[#718093]">{mode === 'login' ? 'Sign in to your worker or admin workspace.' : 'Register your details to get started.'}</p>

          {error && <div role="alert" className="mt-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[#a43d37] flex items-start gap-2.5"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span className="text-sm">{error}</span></div>}

          <div className="mt-6 grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-[#f2f3f4] border border-[#e5e8eb]" role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => { setMode('login'); setError(''); }} className={`rounded-xl py-2.5 text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-[#21354c] border border-[#e4e8ec] shadow-sm' : 'text-[#7b8795] hover:text-[#26384e]'}`}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => { setMode('register'); setError(''); }} className={`rounded-xl py-2.5 text-sm font-semibold transition ${mode === 'register' ? 'bg-white text-[#21354c] border border-[#e4e8ec] shadow-sm' : 'text-[#7b8795] hover:text-[#26384e]'}`}>Create account</button>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#f2f3f4] border border-[#e5e8eb]" role="group" aria-label="Choose account type">
              <button type="button" onClick={() => { setSelectedRole('worker'); setError(''); }} aria-pressed={selectedRole === 'worker'} className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition ${selectedRole === 'worker' ? 'bg-white text-[#21354c] border border-[#e4e8ec] shadow-sm' : 'text-[#7b8795] hover:text-[#26384e] border border-transparent'}`}><UserRound className="w-4 h-4" />Worker</button>
              <button type="button" onClick={() => { setSelectedRole('admin'); setError(''); }} aria-pressed={selectedRole === 'admin'} className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition ${selectedRole === 'admin' ? 'bg-white text-[#21354c] border border-[#e4e8ec] shadow-sm' : 'text-[#7b8795] hover:text-[#26384e] border border-transparent'}`}><UserCog className="w-4 h-4" />Admin</button>
            </div>
            {mode === 'register' && <label className="block"><span className="block mb-2 text-xs font-semibold text-[#46566a]">Full name</span><input required maxLength={100} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full px-3.5 py-3.5 rounded-xl bg-white border border-[#dfe4e8] text-sm text-[#20334a] placeholder:text-[#a3adb7] focus:outline-none focus:border-[#e68248] focus:ring-4 focus:ring-orange-100" placeholder="Enter your full name" /></label>}
            {mode === 'register' && selectedRole === 'worker' && <div className="space-y-2"><p className="text-xs font-semibold text-[#46566a]">Work assignment</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="block"><span className="block mb-2 text-xs font-semibold text-[#46566a]">Work zone</span><select required disabled={workerOptionsLoading || zones.length === 0} value={zoneId} onChange={(event) => setZoneId(event.target.value)} className="w-full px-3 py-3.5 rounded-xl bg-white border border-[#dfe4e8] text-sm text-[#20334a] disabled:bg-slate-100 disabled:text-slate-500"><option value="">{workerOptionsLoading ? 'Loading zones…' : zones.length ? 'Choose your work zone' : 'No zones available'}</option>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.zoneCode} · {zone.zoneName}</option>)}</select></label><label className="block"><span className="block mb-2 text-xs font-semibold text-[#46566a]">Shift</span><select required disabled={workerOptionsLoading || shifts.length === 0} value={shiftId} onChange={(event) => setShiftId(event.target.value)} className="w-full px-3 py-3.5 rounded-xl bg-white border border-[#dfe4e8] text-sm text-[#20334a] disabled:bg-slate-100 disabled:text-slate-500"><option value="">{workerOptionsLoading ? 'Loading shifts…' : shifts.length ? 'Choose your shift' : 'No shifts available'}</option>{shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.shiftName} ({shift.startTime}–{shift.endTime})</option>)}</select></label></div>{!workerOptionsLoading && (zones.length === 0 || shifts.length === 0) && <p className="text-xs text-rose-700">Zone or shift options are unavailable. Contact your administrator before registering.</p>}</div>}
            <label className="block"><span className="block mb-2 text-xs font-semibold text-[#46566a]">{selectedRole === 'admin' ? 'Admin username' : 'Worker username'}</span><span className="relative block"><UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#97a1ad]" /><input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="w-full pl-10 pr-3.5 py-3.5 rounded-xl bg-white border border-[#dfe4e8] text-sm text-[#20334a] placeholder:text-[#a3adb7] focus:outline-none focus:border-[#e68248] focus:ring-4 focus:ring-orange-100" placeholder={`Enter ${selectedRole} username`} /></span></label>
            <label className="block"><span className="block mb-2 text-xs font-semibold text-[#46566a]">Password</span><span className="relative block"><input required minLength={mode === 'register' ? 10 : undefined} maxLength={72} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full px-3.5 pr-11 py-3.5 rounded-xl bg-white border border-[#dfe4e8] text-sm text-[#20334a] placeholder:text-[#a3adb7] focus:outline-none focus:border-[#e68248] focus:ring-4 focus:ring-orange-100" placeholder={mode === 'register' ? 'At least 10 characters' : 'Enter your password'} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#97a1ad] hover:text-[#e66f30]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></span></label>
            {mode === 'register' && <label className="block"><span className="block mb-2 text-xs font-semibold text-[#46566a]">Confirm password</span><input required minLength={10} maxLength={72} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full px-3.5 py-3.5 rounded-xl bg-white border border-[#dfe4e8] text-sm text-[#20334a] placeholder:text-[#a3adb7] focus:outline-none focus:border-[#e68248] focus:ring-4 focus:ring-orange-100" placeholder="Re-enter your password" /></label>}
            {mode === 'register' && <p className="text-[11px] text-[#82909d]">Use 10–72 characters. Your password is securely encrypted before it is stored.</p>}
            <button type="submit" disabled={loading || (mode === 'register' && selectedRole === 'worker' && (workerOptionsLoading || !zoneId || !shiftId))} className="login-submit-button w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#ed7a38] hover:bg-[#d9662a] disabled:opacity-60 text-white font-bold text-sm transition shadow-lg shadow-orange-900/15">{loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{mode === 'login' ? 'Verifying account…' : 'Creating account…'}</> : <>{mode === 'login' ? `Continue as ${selectedRole === 'admin' ? 'Admin' : 'Worker'}` : 'Create account'}{mode === 'register' ? <UserPlus className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}</>}</button>
          </form>
          <div className="mt-5 p-3.5 rounded-xl border border-[#e7e9eb] bg-[#f7f8f8]"><p className="text-xs font-semibold text-[#526173]">Account protection</p><p className="mt-1 text-[11px] leading-5 text-[#97a1ad]">{mode === 'login' ? 'Four incorrect attempts lock your account for 30 minutes.' : 'New accounts are secured with encrypted passwords and role-based access.'}</p></div>
        </section>
      </div>
    </main>
  );
};






