
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface LeaderboardEntry {
  name: string;
  xp: number;
  level: string;
  store: string;
  avatar: string;
}

const getAvatarUrl = (avatarData: string) => {
  if (avatarData === 'admin-core') {
     return `https://api.dicebear.com/9.x/shapes/svg?seed=admin&backgroundColor=0f172a&shape1Color=e30613`;
  }
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${avatarData}&backgroundColor=f1f5f9&shape1Color=e30613&shape2Color=020617&shape3Color=94a3b8`;
};

const Leaderboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [allLeaders, setAllLeaders] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const rawRegistry = localStorage.getItem('rbt_academy_registry');
    if (rawRegistry) {
      const sorted = (Object.values(JSON.parse(rawRegistry)) as LeaderboardEntry[]).sort((a, b) => b.xp - a.xp);
      setAllLeaders(sorted);
    }
  }, [user.xp]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 w-full text-left">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight italic flex items-center gap-4">
            <i className="fas fa-trophy text-yellow-500"></i> Топ Мастеров RBT
          </h2>
          <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-widest">Общий рейтинг сотрудников всей сети</p>
        </div>
        <div className="bg-slate-900 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
          Ваш ранг: {allLeaders.findIndex(l => l.name === user.name) + 1}
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] overflow-hidden border border-slate-100 shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
              <th className="px-10 py-8 text-center">№</th>
              <th className="px-10 py-8">Сотрудник</th>
              <th className="px-10 py-8">Город</th>
              <th className="px-10 py-8 text-right">Очки XP</th>
            </tr>
          </thead>
          <tbody>
            {allLeaders.map((leader, i) => (
              <tr key={i} className={`border-b border-slate-50 last:border-0 transition-colors ${leader.name === user.name ? 'bg-rbt-red/5' : 'hover:bg-slate-50/50'}`}>
                <td className="px-10 py-8 text-center font-black">{i + 1}</td>
                <td className="px-10 py-8">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 p-2 flex items-center justify-center border border-slate-200 shadow-inner">
                      <img src={getAvatarUrl(leader.avatar)} alt="av" className="w-full h-full" />
                    </div>
                    <div>
                       <span className={`font-black text-sm block italic ${leader.name === user.name ? 'text-rbt-red' : 'text-slate-900'}`}>{leader.name}</span>
                       <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{leader.level}</span>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-8 text-sm font-bold text-slate-500 italic">{leader.store}</td>
                <td className="px-10 py-8 text-right font-black text-lg">{leader.xp.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
