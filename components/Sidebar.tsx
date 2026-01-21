
import React, { useEffect, useState } from 'react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  xp: number;
  level: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, xp, level }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('rbt_academy_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setIsAdmin(user.name === 'ADMIN');
    }
  }, [currentView]);

  const menuItems = [
    { id: 'dashboard', icon: 'fa-chart-pie', label: 'Обзор' },
    { id: 'profile', icon: 'fa-user-ninja', label: 'Профиль' },
    { id: 'objections', icon: 'fa-shield-halved', label: 'Тренажер' },
    { id: 'simulator', icon: 'fa-comment-dots', label: 'AI Клиент' },
    { id: 'leaderboard', icon: 'fa-crown', label: 'Рейтинг' },
    { id: 'games', icon: 'fa-puzzle-piece', label: 'Игры' },
    // Теперь пункт Админ всегда виден администратору в общем списке
    ...(isAdmin ? [{ id: 'admin', icon: 'fa-user-shield', label: 'АДМИН' }] : [])
  ];

  const nextLevelXp = 1000;
  const progress = Math.min((xp / nextLevelXp) * 100, 100);

  return (
    <aside className="w-72 bg-[#020617] text-white h-screen fixed left-0 top-0 flex flex-col z-20 border-r border-white/5 shadow-2xl">
      <div className="p-10 flex items-center gap-4">
        <div className="w-12 h-12 bg-rbt-red rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl shadow-[0_0_25px_rgba(227,6,19,0.4)] transform hover:rotate-6 transition-transform">R</div>
        <div className="flex flex-col">
          <span className="font-extrabold text-2xl tracking-tighter">ACADEMY</span>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] -mt-1">By RBT.RU</span>
        </div>
      </div>
      
      <nav className="flex-1 px-6 py-4">
        <ul className="space-y-3">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 relative group ${
                    isActive 
                    ? 'bg-gradient-to-r from-rbt-red/20 to-transparent text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <i className={`fas ${item.icon} w-6 text-center text-lg transition-colors ${isActive ? 'text-rbt-red' : 'group-hover:text-slate-200'}`}></i>
                  <span className={`font-bold text-sm tracking-wide italic ${item.id === 'admin' ? 'text-rbt-red' : ''}`}>{item.label}</span>
                  
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-rbt-red rounded-l-full shadow-[0_0_15px_rgba(227,6,19,0.8)]"></div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-8">
        <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden">
          <div className="flex flex-col mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Статус</span>
            <span className="text-sm font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent italic">{level}</span>
          </div>
          
          <div className="relative">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
              <div 
                className="bg-rbt-red h-full transition-all duration-1000 shadow-[0_0_10px_rgba(227,6,19,0.5)]" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 italic">
              <span>{xp} XP</span>
              <span>{nextLevelXp} XP</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
