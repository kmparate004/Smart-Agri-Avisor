
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { dbService } from '../services/dbService';

interface Props {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) return alert('Enter a valid 10-digit phone number');
    if (name.trim().length < 2) return alert('Please enter your full name');

    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setStep('otp');
      setLoading(false);

      // Trigger the Virtual SMS Notification
      setTimeout(() => {
        setShowNotification(true);
        // Hide after 8 seconds
        setTimeout(() => setShowNotification(false), 8000);
      }, 800);

      console.log(`[AUTH SERVICE] OTP for ${phone}: ${code}`);
    }, 1500);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Allow the generated OTP or '1234' for easier testing
      if (otp === generatedOtp || otp === '1234') {
        // REGISTER USER IN DATABASE
        const result = await dbService.login(phone, name.trim());
        if (result.success && result.user) {
          onLogin(result.user);
        } else {
          throw new Error('Database registration failed');
        }
      } else {
        alert('Invalid OTP. Use the code shown in the notification at the top!');
      }
    } catch (err) {
      alert('Network Error: Could not connect to Agri-Neural database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-950 relative overflow-hidden font-sans">

      {/* Virtual SMS Notification Simulation */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 transition-all duration-500 transform ${showNotification ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'}`}>
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-4 border border-emerald-100 flex items-start gap-4 ring-1 ring-black/5">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
            <i className="fas fa-comment-sms text-xl"></i>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Messages • Now</span>
              <button onClick={() => setShowNotification(false)} className="text-slate-300 hover:text-slate-500">
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>
            <p className="text-xs font-bold text-slate-800 mb-1">Advisor Login</p>
            <p className="text-[11px] text-slate-500 leading-tight">
              Your Advisor Login OTP is <span className="font-black text-emerald-600 text-sm">{generatedOtp}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-400/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/10 backdrop-blur-3xl border border-white/10 rounded-[48px] p-10 shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-emerald-500 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-xl mb-6">
              <i className="fas fa-leaf"></i>
            </div>
            <h1 className="text-3xl font-heading text-white mb-2">Smart Agri Advisor</h1>
            <p className="text-emerald-100/60 text-sm">Your AI Krishi Expert</p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-8">
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest text-center">
              <i className="fas fa-info-circle mr-2"></i>
              Simulation Mode: Real SMS requires a Gateway API
            </p>
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-4">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 font-bold">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10 digit number"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-16 pr-6 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-4">Full Name</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40">
                    <i className="fas fa-user-circle"></i>
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Username"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-all font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-emerald-900/40 disabled:opacity-50"
              >
                {loading ? <i className="fas fa-circle-notch animate-spin"></i> : 'SECURE ACCESS'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2 text-center">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">VERIFICATION CODE</p>
                <div className="flex justify-center gap-3">
                  <input
                    type="text"
                    maxLength={4}
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter  O T P"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-center text-white text-2xl tracking-[0.5em] focus:outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-white/10"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-emerald-900 py-4 rounded-2xl font-black text-sm transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? <i className="fas fa-circle-notch animate-spin text-emerald-600"></i> : 'VERIFY & LOG IN'}
              </button>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Change Number
              </button>
            </form>
          )}


        </div>
      </div>
    </div>
  );
};

export default LoginPage;
