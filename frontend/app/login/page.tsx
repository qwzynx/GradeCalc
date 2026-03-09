"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Loader2, Sparkles, ShieldCheck, Lock, UserPlus, LogIn, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [view, setView] = useState<'login' | 'signup' | 'success'>('login');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials") || error.message.includes("Email not confirmed")) {
          setMessage({ 
            type: 'error', 
            text: error.message.includes("Email not confirmed") 
              ? "Please verify your email address before logging in." 
              : "Invalid credentials. Please check your email and password." 
          });
        } else {
          throw error;
        }
      } else if (data.user) {
        router.push('/');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Login failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: "Passwords do not match." });
      setLoading(false);
      return;
    }

    try {
      // Supabase's signUp won't always reveal if a user exists for security reasons (if email confirmation is on).
      // However, we can handle the error if it does return one, or proactively try to check if it's a common requirement.
      // For standard Supabase setups, signUp returns an identity in data.user even if they exist, but won't send a new email if "Allow multiple identities per user" is off.
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setMessage({ type: 'error', text: "An account with this email already exists. Please login instead." });
          setLoading(false);
          return;
        }
        throw error;
      }

      // Proactive check: If data.user exists but identities is empty, it usually means the user already exists 
      // when 'Allow multiple identities per user' is disabled in Supabase.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setMessage({ type: 'error', text: "An account with this email already exists. Please login instead." });
        setLoading(false);
        return;
      }

      if (data.user) {
        setView('success');
        setMessage({ 
          type: 'success', 
          text: 'Registration successful! A verification link has been sent to your email.' 
        });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Signup failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary relative overflow-hidden p-4">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-alt-color/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md z-10"
      >
        <div className="backdrop-blur-xl bg-white/3 border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden text-center">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-secondary via-alt-color to-secondary"></div>
          
          <div className="mb-10">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-secondary/20 to-alt-color/20 border border-secondary/30 mb-6"
            >
              {view === 'success' ? (
                <CheckCircle2 className="w-8 h-8 text-secondary" />
              ) : view === 'signup' ? (
                <UserPlus className="w-8 h-8 text-secondary" />
              ) : (
                <LogIn className="w-8 h-8 text-secondary" />
              )}
            </motion.div>
            <h1 className="text-4xl font-bold font-orbitron tracking-tight text-white mb-2">
              GradeMatrix
            </h1>
            <p className="text-alt-color/70 text-sm uppercase tracking-[0.2em]">
              {view === 'success' ? 'Verification Sent' : view === 'signup' ? 'New Personnel Entry' : 'Authorized Access'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {view === 'login' || view === 'signup' ? (
              <motion.form 
                key={view}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={view === 'login' ? handleLogin : handleSignup} 
                className="space-y-4"
              >
                <div className="space-y-2 text-left">
                  <label htmlFor="email" className="block text-xs font-medium text-alt-color/50 uppercase tracking-widest ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-alt-color/40 group-focus-within:text-secondary transition-colors" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all outline-none text-white placeholder-white/20"
                      placeholder="Input email"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label htmlFor="password" className="block text-xs font-medium text-alt-color/50 uppercase tracking-widest ml-1">
                    Security Key
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-alt-color/40 group-focus-within:text-secondary transition-colors" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all outline-none text-white placeholder-white/20"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {view === 'signup' && (
                  <div className="space-y-2 text-left">
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-alt-color/50 uppercase tracking-widest ml-1">
                      Confirm Security Key
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <ShieldCheck className="h-5 w-5 text-alt-color/40 group-focus-within:text-secondary transition-colors" />
                      </div>
                      <input
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all outline-none text-white placeholder-white/20"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-primary font-bold rounded-2xl transition-all shadow-lg hover:shadow-secondary/20 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>{view === 'login' ? 'Validate Credentials' : 'Initialize Account'}</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setView(view === 'login' ? 'signup' : 'login');
                      setMessage(null);
                    }}
                    className="text-xs text-alt-color/50 hover:text-secondary transition-colors uppercase tracking-widest"
                  >
                    {view === 'login' ? "Don't have an uplink? Register" : "Already registered? Login"}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 py-4"
              >
                <p className="text-secondary text-base leading-relaxed">
                  A magic uplink has been dispatched to <span className="text-white font-bold">{email}</span>. 
                  Click the link in your email to authenticate your access.
                </p>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-[10px] text-alt-color/40 uppercase tracking-widest">
                  Authentication pending confirmation...
                </div>
                <button
                  onClick={() => setView('login')}
                  className="text-xs text-secondary hover:underline uppercase tracking-widest"
                >
                  Return to Login
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {message && view !== 'success' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`mt-6 p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
            >
              {message.text}
            </motion.div>
          )}

          <div className="mt-10 pt-6 border-t border-white/5">
            <p className="text-alt-color/40 text-[10px] uppercase tracking-[0.3em] font-medium">
              GradeMatrix Intelligence Systems © 2026
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
