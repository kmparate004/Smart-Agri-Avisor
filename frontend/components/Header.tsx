
import React from 'react';
import { AppTab, User } from '../types';

interface Props {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenProfile: () => void;
  user: User;
}

const Header: React.FC<Props> = ({ activeTab, onTabChange, onOpenProfile, user }) => {
  const getTabClass = (tab: AppTab) => {
    const isActive = activeTab === tab || (activeTab === 'history_view' && tab === 'dashboard');
    return `relative text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer px-4 py-2 group ${isActive ? 'text-emerald-900' : 'text-slate-400 hover:text-emerald-700'
      }`;
  };

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl animate-in slide-in-from-top-4 duration-700">
      <div className="bg-white/40 backdrop-blur-3xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] px-8 h-14 flex items-center justify-between">
        {/* Logo Section */}
        <div
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          onClick={() => onTabChange('dashboard')}
        >
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xs shadow-lg shadow-emerald-500/20 group-hover:rotate-12 transition-transform">
            <i className="fas fa-leaf"></i>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-heading text-base text-emerald-950 leading-none tracking-tight">Smart Agri Advisor</h1>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex items-center gap-1 md:gap-4">
          {['dashboard', 'chat', 'history', 'resources'].map((tab) => (
            <div key={tab} className="relative">
              <span
                onClick={() => onTabChange(tab as AppTab)}
                className={getTabClass(tab as AppTab)}
              >
                {tab === 'dashboard' ? 'Advisor' : tab === 'history' ? 'Reports' : tab === 'chat' ? 'Chat' : 'Knowledge'}
              </span>
              {(activeTab === tab || (activeTab === 'history_view' && tab === 'dashboard')) && (
                <div className="absolute bottom-1 left-4 right-4 h-0.5 bg-emerald-600 rounded-full shadow-[0_0_8px_#10b981]"></div>
              )}
            </div>
          ))}
          
        </nav>

        {/* User Account Section */}
        <div className="flex items-center gap-4 shrink-0">
          <div
            className="flex items-center gap-2 bg-white/60 backdrop-blur-md border border-white/60 p-1 rounded-full shadow-sm hover:border-emerald-200 transition-all cursor-pointer group pr-3"
            onClick={onOpenProfile}
          >
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shadow-md group-hover:scale-110 transition-transform">
              <i className="fas fa-user-check"></i>
            </div>
            <p className="hidden md:block text-[11px] font-bold text-slate-700 tracking-tight">{user.name}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
