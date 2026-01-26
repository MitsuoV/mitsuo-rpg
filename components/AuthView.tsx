import React, { useState } from 'react';
import { RetroButton, RetroCard } from './Layout';
import { supabase } from '../supabaseClient';

export const AuthView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState(''); // Email or Username
  const [username, setUsername] = useState('');     // Only for Sign Up
  const [email, setEmail] = useState('');           // Only for Sign Up
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // --- Sign Up Flow ---
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email: email.trim(), 
          password,
          options: {
            data: { username: username.trim() },
            emailRedirectTo: window.location.origin
          }
        });
        
        if (signUpError) throw signUpError;
        
        // Create the profile entry immediately for username lookups
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            username: username.trim().toLowerCase(),
            email: email.trim().toLowerCase(),
            updated_at: new Date().toISOString(),
          });
          
          if (profileError) {
            console.error("Profile creation error:", profileError);
            throw new Error(`Profile creation failed: ${profileError.message}. Check SQL policies!`);
          }
        }

        if (!data.session) {
          setError("Check your email for a confirmation link!");
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        // --- Login Flow ---
        let targetEmail = identifier.trim();

        // If not an email, lookup the email associated with this username
        if (!isEmail(targetEmail)) {
          console.log(`Searching for username: ${targetEmail.toLowerCase()}`);
          
          // Case-insensitive lookup using ilike
          const { data: profile, error: lookupError } = await supabase
            .from('profiles')
            .select('email, username')
            .ilike('username', targetEmail) 
            .maybeSingle();
          
          if (lookupError) {
            console.error("Username lookup failed:", lookupError);
            throw new Error(`Database Error: ${lookupError.message}. Ensure the 'profiles' table has 'username' and 'email' columns and RLS is public for select.`);
          }
          
          if (!profile) {
            console.warn("No profile found for:", targetEmail);
            throw new Error(`Username '${targetEmail}' not found. Are you sure you registered?`);
          }
          
          targetEmail = profile.email;
        }

        const { error: loginError } = await supabase.auth.signInWithPassword({ 
          email: targetEmail.toLowerCase(), 
          password 
        });
        if (loginError) throw loginError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isPasswordMismatch = isSignUp && confirmPassword !== '' && password !== confirmPassword;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <RetroCard title={isSignUp ? "Registration" : "Authentication"} className="w-full">
        <form onSubmit={handleAuth} className="space-y-4 p-2">
          
          {isSignUp ? (
            <>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-bold">New Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-900 border-2 border-gray-700 p-2 text-xs text-white focus:border-yellow-500 outline-none font-mono"
                  required
                  placeholder="HeroName"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-bold">Valid Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900 border-2 border-gray-700 p-2 text-xs text-white focus:border-yellow-500 outline-none font-mono"
                  required
                  placeholder="hero@realm.com"
                />
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-bold">Username or Email</label>
              <input 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-gray-900 border-2 border-gray-700 p-2 text-xs text-white focus:border-yellow-500 outline-none font-mono"
                required
                placeholder="Enter Identity"
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase font-bold">Secret Key (Password)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border-2 border-gray-700 p-2 text-xs text-white focus:border-yellow-500 outline-none font-mono"
              required
              placeholder="••••••••"
            />
          </div>

          {isSignUp && (
            <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
              <label className="text-[10px] text-gray-400 uppercase font-bold">Verify Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-gray-900 border-2 ${isPasswordMismatch ? 'border-red-500' : 'border-gray-700'} p-2 text-xs text-white focus:border-yellow-500 outline-none font-mono`}
                required
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <div className={`text-[8px] p-2 border uppercase leading-tight font-bold break-words ${error.includes('Check your email') ? 'text-green-500 bg-green-900/10 border-green-900/40' : 'text-red-500 bg-red-900/10 border-red-900/40'}`}>
              <div className="flex gap-2 items-start">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
              {error.includes('found') && (
                <div className="mt-2 text-[7px] text-gray-500 font-normal normal-case border-t border-red-900/20 pt-1">
                  If this is an old account, ensure you updated the 'username' column in your profiles table.
                </div>
              )}
            </div>
          )}

          <RetroButton 
            disabled={loading || (isSignUp && (password !== confirmPassword || !username || !email))} 
            className="w-full"
            variant={isSignUp ? 'success' : 'primary'}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Initialize Hero' : 'Engage Portal')}
          </RetroButton>
        </form>
      </RetroCard>

      <button 
        onClick={() => {
          setIsSignUp(!isSignUp);
          setError(null);
          setPassword('');
          setConfirmPassword('');
          setIdentifier('');
        }}
        className="text-[10px] text-gray-500 hover:text-yellow-600 uppercase tracking-widest transition-colors"
      >
        {isSignUp ? "[ Returning Hero ]" : "[ New Character ]"}
      </button>
    </div>
  );
};