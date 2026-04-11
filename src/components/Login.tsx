import React, { useState } from 'react';
import { db, User } from '../db';
import { Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;

    setLoading(true);
    try {
      const user = await db.users.where('pin').equals(pin).first();
      if (user) {
        onLogin(user);
        toast.success(`Welcome back, ${user.name}!`);
      } else {
        toast.error('Invalid PIN. Please try again.');
        setPin('');
      }
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const addDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
    }
  };

  const removeDigit = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        <div className="p-8 lg:p-12">
          <div className="flex justify-center mb-8">
            <Logo className="w-20 h-20" color="var(--primary-color)" />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">YusraPOS</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Enter your staff PIN to continue</p>
          </div>

          <div className="flex justify-center gap-4 mb-10">
            {[...Array(pin.length)].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary-light animate-pulse" />
            ))}
            {[...Array(Math.max(0, 4 - pin.length))].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
              <button
                key={digit}
                onClick={() => addDigit(digit)}
                className="h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-2xl font-black text-zinc-900 dark:text-zinc-100 hover:bg-primary hover:text-white transition-all active:scale-95"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={removeDigit}
              className="h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-lg font-bold text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all active:scale-95"
            >
              Clear
            </button>
            <button
              onClick={() => addDigit('0')}
              className="h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-2xl font-black text-zinc-900 dark:text-zinc-100 hover:bg-primary hover:text-white transition-all active:scale-95"
            >
              0
            </button>
            <button
              onClick={handleLogin}
              disabled={pin.length < 4 || loading}
              className="h-16 rounded-2xl bg-primary text-white flex items-center justify-center hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              <ArrowRight size={28} />
            </button>
          </div>

          <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-widest">
            Default Admin PIN: 1234
          </p>
        </div>
      </motion.div>
    </div>
  );
}
