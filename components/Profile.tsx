
import React, { useMemo } from 'react';
import { UserProfile } from '../types';

interface ProfileProps {
  user: UserProfile;
  avatar: string;
  onNavigateToAdmin?: () => void;
}

const getAvatarUrl = (avatarData: string, isAdm: boolean) => {
  if (isAdm || avatarData === 'admin-core') {
     return `https://api.dicebear.com/7.x/shapes/svg?seed=admin&backgroundColor=020617&shape1Color=e30613`;
  }
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${avatarData}&backgroundColor=f1f5f9&shape1Color=e30613&shape2Color=0f172a&shape3Color=94a3b8`;
};

const Profile: React.FC<ProfileProps> = ({ user, avatar }) => {
  const isAdm = user.name === 'ADMIN';
  
  const allAchievements = [
    { name: 'Первый шаг', desc: 'Завершите свой первый учебный модуль', icon: 'fa-shoe-prints', color: 'bg-blue-500' },
    { name: 'Марафонец', desc: 'Наберите суммарно более 1000 XP', icon: 'fa-running', color: 'bg-amber-500' },
    { name: 'Мастер возражений', desc: 'Пройдите тренажер на 100% лояльности', icon: 'fa-shield-heart', color: 'bg-red-500' },
    { name: 'Сервис-гуру', desc: 'Получите оценку 10/10 за вежливость', icon: 'fa-hands-clapping', color: 'bg-emerald-500' },
  ];

  const stats = [
    { label: 'Всего XP', val: user.xp, icon: 'fa-fire' },
    { label: 'Модулей', val: user.modulesCompleted, icon: 'fa-book' },
    { label: 'Ср. Рейтинг', val: user.avgRating || 0, icon: 'fa-star' },
    { label: 'Достижения', val: user.achievements.length, icon: 'fa-trophy' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6 animate-in fade-in slide-in-from-right-4 duration-1000 w-full pb-20 text-left">
      <div className="glass-card rounded-[4rem] p-12 relative overflow-hidden border border-white/60 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center gap-14 relative z-10">
          <div className="w-48 h-48 bg-white rounded-[3.5rem] border-8 border-white shadow-2xl overflow-hidden flex items-center justify-center shrink-0 p-8">
            <img src={getAvatarUrl(avatar, isAdm)} alt="Avatar" className="w-full h-full" />
          </div>
          <div className="text-center lg:text-left flex-1">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic mb-4 leading-none">{user.name}</h2>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start items-center">
               <span className="bg-rbt-red text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">{user.level}</span>
               <span className="bg-slate-100 text-slate-500 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{user.store}</span>
            </div>
            <p className="text-slate-400 font-bold italic mt-6 text-lg max-w-md mx-auto lg:mx-0">«Системный подход и постоянное развитие — ключ к мастерству.»</p>
          </div>
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-white p-8 rounded-[3rem] text-center border border-slate-100 shadow-xl min-w-[160px]">
               <div className="text-4xl font-black text-slate-900 tracking-tighter">{user.xp}</div>
               <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">XP Очки</div>
            </div>
            <div className="bg-slate-900 p-8 rounded-[3rem] text-center shadow-2xl min-w-[160px]">
               <div className="text-4xl font-black text-white tracking-tighter">{user.modulesCompleted}</div>
               <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Кейсы</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-sm">
          <h3 className="text-3xl font-black text-slate-900 italic mb-10 tracking-tight">Ваши достижения</h3>
          <div className="grid grid-cols-2 gap-6">
            {allAchievements.map((ach) => {
              const isUnlocked = user.achievements.includes(ach.name);
              return (
                <div key={ach.name} className={`p-6 rounded-[2.5rem] border-2 flex flex-col items-center text-center transition-all ${isUnlocked ? 'bg-white border-slate-100 shadow-lg' : 'bg-slate-50 border-dashed border-slate-200 opacity-30 grayscale'}`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4 ${isUnlocked ? `${ach.color} text-white shadow-xl` : 'bg-slate-200 text-slate-400'}`}>
                    <i className={`fas ${ach.icon}`}></i>
                  </div>
                  <h4 className="font-black text-slate-900 text-[10px] uppercase mb-1">{ach.name}</h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight">{ach.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white border border-white/5">
          <h3 className="text-3xl font-black italic mb-10 tracking-tight">Статистика</h3>
          <div className="space-y-6">
            {stats.map(s => (
              <div key={s.label} className="flex justify-between items-center p-6 rounded-[2rem] bg-white/5 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-rbt-red">
                    <i className={`fas ${s.icon}`}></i>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
                </div>
                <span className="text-2xl font-black italic">{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
