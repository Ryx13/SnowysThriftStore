import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Lock, Mail, User, Phone, LogIn, UserPlus } from 'lucide-react';

export default function AuthForm() {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (mode === 'signup') {
      const { error } = await signUp(email, password, fullName, phone);
      if (error) {
        setError(error);
      } else {
        setSuccessMsg('Account created! Check your email to confirm, then sign in.');
        setMode('signin');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-sm mx-auto mt-12 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      <div className="flex items-center gap-2 mb-4 border-b pb-3">
        {mode === 'signin' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
        <h3 className="font-bold text-base">{mode === 'signin' ? 'Sign In' : 'Create Account'}</h3>
      </div>

      {error && <div className="p-2 mb-3 bg-red-50 text-red-800 text-xs rounded-lg border border-red-200">{error}</div>}
      {successMsg && <div className="p-2 mb-3 bg-green-50 text-green-800 text-xs rounded-lg border border-green-200">{successMsg}</div>}

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'signup' && (
          <>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text" placeholder="Full Name" value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
                required
              />
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="tel" placeholder="Phone Number (e.g. 0821234567)" value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
                required
              />
            </div>
          </>
        )}
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
            required
          />
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full bg-black text-white py-2.5 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <p className="text-xs text-gray-500 text-center mt-4">
        {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
          className="text-black font-semibold underline"
        >
          {mode === 'signin' ? 'Sign Up' : 'Sign In'}
        </button>
      </p>
    </div>
  );
}