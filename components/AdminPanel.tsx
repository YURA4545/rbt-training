
import React, { useState, useEffect } from 'react';

const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [registry, setRegistry] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'responses'>('users');
  const [customResponses, setCustomResponses] = useState<any[]>([]);

  const loadData = () => {
    const rawRegistry = localStorage.getItem('rbt_academy_registry');
    if (rawRegistry) {
      const data = JSON.parse(rawRegistry);
      const userList = Object.values(data);
      setRegistry(userList);
      if (selectedUser) {
        const updated = userList.find((u: any) => u.name === selectedUser.name);
        if (updated) setSelectedUser(updated);
      }
    }
    const rawResponses = localStorage.getItem('rbt_custom_responses');
    if (rawResponses) setCustomResponses(JSON.parse(rawResponses).reverse());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [selectedUser?.name]);

  const resetUserProgress = (userName: string) => {
    if (!confirm(`Вы уверены, что хотите сбросить прогресс пользователя ${userName}? Это удалит все XP и историю обучения.`)) return;
    const rawRegistry = localStorage.getItem('rbt_academy_registry');
    if (rawRegistry) {
      const registryMap = JSON.parse(rawRegistry);
      if (registryMap[userName]) {
        registryMap[userName].xp = 0;
        registryMap[userName].level = 'Стажер (Junior)';
        registryMap[userName].lastSimulatorSession = [];
        registryMap[userName].lastObjectionSession = [];
        localStorage.setItem('rbt_academy_registry', JSON.stringify(registryMap));
        loadData();
      }
    }
  };

  const getAvatarUrl = (seed: string) => {
    if (seed === 'admin-core') {
       return `https://api.dicebear.com/7.x/shapes/svg?seed=admin&backgroundColor=020617&shape1Color=e30613`;
    }
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=f1f5f9&shape1Color=e30613&shape2Color=0f172a&shape3Color=94a3b8`;
  };

  const calculateShopStats = () => {
    if (registry.length === 0) return { totalXP: 0, avgXP: 0, topPerformer: 'Нет данных' };
    const totalXP = registry.reduce((acc, u) => acc + (u.xp || 0), 0);
    const sorted = [...registry].sort((a, b) => b.xp - a.xp);
    return {
      totalXP,
      avgXP: Math.round(totalXP / registry.length),
      topPerformer: sorted[0]?.name || 'Нет данных'
    };
  };

  const stats = calculateShopStats();

  return (
    <div className="w-full max-w-6xl animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div className="glass-card rounded-[4rem] p-12 overflow-hidden relative shadow-2xl border border-white/40">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl p-2 flex items-center justify-center">
               <img src={getAvatarUrl('admin-core')} alt="Admin" className="w-full h-full" />
            </div>
            <div className="text-left text-slate-900">
              <h2 className="text-4xl font-black tracking-tighter italic">RBT Admin Dashboard</h2>
              <div className="flex gap-4 mt-3">
                 {['users', 'analytics', 'responses'].map((t) => (
                   <button 
                    key={t} onClick={() => setActiveTab(t as any)}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                   >
                     {t === 'users' ? 'Сотрудники' : t === 'analytics' ? 'Аналитика' : 'Логи ответов'}
                   </button>
                 ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-rbt-red transition-all shadow-xl">
            <i className="fas fa-times"></i>
          </button>
        </header>

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-4 text-left">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 italic">Команда RBT</h3>
               <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {registry.map((user, i) => (
                    <div 
                      key={i} onClick={() => setSelectedUser(user)}
                      className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all ${selectedUser?.name === user.name ? 'border-rbt-red bg-white shadow-xl scale-[1.02]' : 'border-transparent bg-slate-50 hover:bg-white hover:border-slate-200'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden p-2 shadow-inner border border-slate-100">
                          <img src={getAvatarUrl(user.avatar)} alt="avatar" className="w-full h-full" />
                        </div>
                        <div className="overflow-hidden">
                           <div className="font-bold text-slate-900 text-sm italic truncate">{user.name}</div>
                           <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{user.store} • {user.xp} XP</div>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-2 h-full">
               {selectedUser ? (
                 <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm animate-in slide-in-from-right-4 h-full flex flex-col max-h-[700px] relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10 pb-10 border-b border-slate-100 shrink-0">
                       <div className="flex gap-6 items-center">
                          <div className="w-24 h-24 bg-white rounded-[2.5rem] p-4 shadow-2xl border border-slate-100 flex items-center justify-center">
                            <img src={getAvatarUrl(selectedUser.avatar)} alt="avatar" className="w-full h-full" />
                          </div>
                          <div className="text-left">
                             <h4 className="text-3xl font-black italic text-slate-900 leading-none mb-2">{selectedUser.name}</h4>
                             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{selectedUser.level} • {selectedUser.store}</p>
                             <div className="mt-4 flex gap-2">
                               <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter">Online</span>
                             </div>
                          </div>
                       </div>
                       <button onClick={() => resetUserProgress(selectedUser.name)} className="bg-red-50 text-rbt-red px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rbt-red hover:text-white transition-all shadow-sm">
                         Сбросить прогресс
                       </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar text-left space-y-12">
                      <section>
                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3 italic">
                           <i className="fas fa-comment-dots text-rbt-red"></i> История чатов с AI
                        </h5>
                        <div className="space-y-4">
                           {selectedUser.lastSimulatorSession && selectedUser.lastSimulatorSession.length > 0 ? (
                             selectedUser.lastSimulatorSession.map((session: any) => (
                               <div key={session.id} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 transition-transform hover:scale-[1.01]">
                                 <div className="flex justify-between items-center mb-4">
                                    <span className="font-black text-slate-900 text-xs italic">{session.product}</span>
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${session.score >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{session.score} XP</span>
                                 </div>
                                 <div className="space-y-3 opacity-80 border-t border-slate-200 pt-4">
                                    {session.messages.slice(-3).map((m: any, idx: number) => (
                                      <div key={idx} className="flex gap-2 items-start">
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-rbt-red text-white'}`}>{m.role === 'user' ? 'STF' : 'CLI'}</span>
                                        <p className="text-[10px] font-medium leading-tight italic">"{m.text}"</p>
                                      </div>
                                    ))}
                                 </div>
                               </div>
                             ))
                           ) : (
                             <p className="text-slate-300 italic text-xs ml-4">Сессии в тренажере пока отсутствуют</p>
                           )}
                        </div>
                      </section>

                      <section>
                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3 italic">
                           <i className="fas fa-shield-halved text-blue-500"></i> Тренажер возражений
                        </h5>
                        <div className="space-y-4">
                           {selectedUser.lastObjectionSession && selectedUser.lastObjectionSession.length > 0 ? (
                             selectedUser.lastObjectionSession.map((obj: any, idx: number) => (
                               <div key={idx} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                                 <div className="flex justify-between items-center mb-3">
                                   <p className="text-[10px] font-black text-slate-400 uppercase italic">Кейс: {obj.question}</p>
                                   <span className="text-[9px] font-black text-slate-400">{new Date(obj.date).toLocaleDateString()}</span>
                                 </div>
                                 <p className="text-slate-900 font-bold italic text-sm mb-4 bg-white p-4 rounded-2xl shadow-inner">"{obj.answer}"</p>
                                 <div className="p-4 rounded-2xl text-[10px] italic text-slate-500 border border-slate-100 bg-white/50">
                                    {obj.metrics?.feedback}
                                 </div>
                               </div>
                             ))
                           ) : (
                             <p className="text-slate-300 italic text-xs ml-4">Задания модуля «Отработка возражений» не пройдены</p>
                           )}
                        </div>
                      </section>
                    </div>
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3.5rem] p-10 text-slate-300">
                    <i className="fas fa-user-gear text-6xl mb-6 opacity-10"></i>
                    <p className="font-black uppercase text-xs tracking-[0.4em] italic">Выберите сотрудника из списка</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left animate-in fade-in h-full">
             <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col justify-between group hover:border-rbt-red transition-all">
                <div>
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-slate-400 group-hover:bg-rbt-red group-hover:text-white transition-all">
                    <i className="fas fa-fire-flame-curved"></i>
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Общий XP магазина</div>
                  <div className="text-5xl font-black text-slate-900 tracking-tighter italic">{stats.totalXP.toLocaleString()}</div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 italic mt-6 uppercase">Суммарная активность за весь период</p>
             </div>
             
             <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full"></div>
                <div>
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white">
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Средний балл / KPI</div>
                  <div className="text-5xl font-black tracking-tighter italic">{stats.avgXP}</div>
                </div>
                <p className="text-[10px] font-bold text-slate-500 italic mt-6 uppercase">Продуктивность каждого сотрудника</p>
             </div>
             
             <div className="bg-rbt-red p-10 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 text-white">
                    <i className="fas fa-crown"></i>
                  </div>
                  <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Лидер обучения</div>
                  <div className="text-3xl font-black italic tracking-tight">{stats.topPerformer}</div>
                </div>
                <p className="text-[10px] font-bold text-white/60 italic mt-6 uppercase">Сотрудник с максимальным прогрессом</p>
             </div>
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="space-y-6 text-left animate-in fade-in max-h-[700px] overflow-y-auto pr-4 custom-scrollbar">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 italic mb-8">Лог игровых ответов (Быстрый ответ)</h3>
            {customResponses.length > 0 ? (
              customResponses.map((res, i) => (
                <div key={i} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all border-l-8 border-l-rbt-red mb-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-[10px] uppercase">R</div>
                       <div className="font-black text-slate-900 italic text-lg">{res.userName}</div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">{new Date(res.date).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-6 rounded-2xl italic text-slate-600 border border-slate-100 relative">
                       <span className="absolute -top-3 left-4 bg-white px-2 text-[8px] font-black uppercase text-slate-400">СИТУАЦИЯ</span>
                       "{res.question}"
                    </div>
                    <div className="bg-rbt-red/5 p-6 rounded-2xl italic font-black text-rbt-red border border-rbt-red/10 relative">
                       <span className="absolute -top-3 left-4 bg-white px-2 text-[8px] font-black uppercase text-rbt-red">АВТОРСКИЙ ОТВЕТ</span>
                       "{res.response}"
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 opacity-20 italic font-black text-slate-400 uppercase tracking-[0.5em]">Лог пуст</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
