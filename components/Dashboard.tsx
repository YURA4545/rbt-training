
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  user: UserProfile;
  onShowProfile: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onShowProfile }) => {
  const [weeklyData, setWeeklyData] = useState([
    { name: 'Пн', val: 0 }, { name: 'Вт', val: 0 }, { name: 'Ср', val: 0 },
    { name: 'Чт', val: 0 }, { name: 'Пт', val: 0 }, { name: 'Сб', val: 0 }, { name: 'Вс', val: 0 }
  ]);
  const [activeUsersCount, setActiveUsersCount] = useState(1);

  useEffect(() => {
    const rawHistory = localStorage.getItem('rbt_learning_history');
    const history = rawHistory ? JSON.parse(rawHistory) : [];
    const dayMap = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const counts: Record<string, number> = { 'Пн': 0, 'Вт': 0, 'Ср': 0, 'Чт': 0, 'Пт': 0, 'Сб': 0, 'Вс': 0 };
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    history.forEach((entry: any) => {
      const entryDate = new Date(entry.date);
      if (entryDate >= sevenDaysAgo) {
        const dayName = dayMap[entryDate.getDay()];
        counts[dayName] = (counts[dayName] || 0) + (entry.xp || 0);
      }
    });

    setWeeklyData([
      { name: 'Пн', val: counts['Пн'] }, { name: 'Вт', val: counts['Вт'] },
      { name: 'Ср', val: counts['Ср'] }, { name: 'Чт', val: counts['Чт'] },
      { name: 'Пт', val: counts['Пт'] }, { name: 'Сб', val: counts['Сб'] },
      { name: 'Вс', val: counts['Вс'] }
    ]);

    const rawRegistry = localStorage.getItem('rbt_academy_registry');
    if (rawRegistry) {
      const registry = JSON.parse(rawRegistry);
      const count = Object.keys(registry).length;
      setActiveUsersCount(Math.max(1, Math.floor(count * 0.4) + 1));
    }
  }, [user.xp]);

  const stats = [
    { label: 'Модули', val: user.modulesCompleted, icon: 'fa-book-quran', color: 'from-blue-500 to-indigo-600' },
    { label: 'XP Очки', val: user.xp, icon: 'fa-fire-flame-curved', color: 'from-orange-500 to-red-600' },
    { label: 'Скилл', val: user.modulesCompleted > 0 ? (user.xp / (user.modulesCompleted * 50) * 10).toFixed(1) : '0', icon: 'fa-brain', color: 'from-purple-500 to-pink-600' },
    { label: 'Награды', val: user.achievements.length, icon: 'fa-award', color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 w-full pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic leading-none">
            Элита RBT <span className="text-rbt-red">.</span>
          </h1>
          <p className="text-slate-500 mt-4 font-medium text-xl italic max-w-lg">Добро пожаловать в центр подготовки мастеров продаж.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white px-8 py-5 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center gap-5 transition-transform hover:scale-105">
            <div className="relative">
               <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full"></div>
               <div className="absolute inset-0 w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping"></div>
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Live</div>
              <div className="text-sm font-black text-slate-900 uppercase">В сети: {activeUsersCount}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="group relative overflow-hidden glass-card p-10 rounded-[3.5rem] hover:shadow-2xl transition-all duration-500 border border-white/60">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-[0.05] rounded-bl-[4rem] group-hover:scale-110 transition-transform`}></div>
            <div className="flex items-center gap-5 mb-8">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} text-white flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all`}>
                <i className={`fas ${stat.icon} text-xl`}></i>
              </div>
            </div>
            <p className="text-5xl font-black text-slate-900 tracking-tighter mb-2">{stat.val}</p>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 glass-card p-12 rounded-[4rem] border border-white/60">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight italic">Тренд обучения</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Эффективность за неделю</p>
            </div>
            <div className="bg-slate-50 px-5 py-2 rounded-full text-[10px] font-black uppercase text-slate-400">Weekly View</div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 800}} />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.02)'}}
                  contentStyle={{borderRadius: '32px', border: 'none', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.15)', padding: '24px'}}
                />
                <Bar dataKey="val" radius={[16, 16, 16, 16]} barSize={48}>
                  {weeklyData.map((entry, index) => {
                    const today = new Date().getDay();
                    const dayIdx = today === 0 ? 6 : today - 1;
                    return <Cell key={`cell-${index}`} fill={index === dayIdx ? '#E30613' : '#cbd5e1'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-12 rounded-[4rem] border border-white/60 flex flex-col">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-10 italic">Награды</h3>
          <div className="space-y-8 flex-1">
            {user.achievements.length > 0 ? (
              user.achievements.slice(-4).reverse().map((ach, i) => (
                <div key={i} className="flex items-center gap-6 group cursor-pointer">
                  <div className="w-16 h-16 bg-white shadow-lg rounded-3xl flex items-center justify-center text-rbt-red group-hover:scale-110 transition-all border border-slate-50">
                    <i className="fas fa-certificate text-2xl"></i>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-800 text-base italic">{ach}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Badge</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                <i className="fas fa-lock text-5xl mb-6 text-slate-200"></i>
                <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Нет достижений</p>
              </div>
            )}
          </div>
          <button 
            onClick={onShowProfile}
            className="w-full mt-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-rbt-red transition-all shadow-2xl active:scale-95"
          >
            Все награды
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
