
import React, { useState } from 'react';

interface AuthProps {
  onLogin: (name: string, store: string, avatarSeed: string, pass: string) => void;
}

const CITIES = [
  'Челябинск', 
  'Шумиха', 
  'Мишкино', 
  'Юргамыш', 
  'Куртамыш'
];

const SHAPE_SEEDS = ['Pulse', 'Core', 'Logic', 'Flow', 'Grid', 'Orbit', 'Vortex', 'Nexus'];

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [store, setStore] = useState(CITIES[0]);
  const [selectedAvatar, setSelectedAvatar] = useState(SHAPE_SEEDS[0]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pass) return;
    const avatarToSave = name.toUpperCase() === 'ADMIN' ? 'admin-core' : selectedAvatar;
    onLogin(name, store, avatarToSave, pass);
  };

  const getAvatarUrl = (seed: string) => {
    if (seed === 'admin-core') {
       return `https://api.dicebear.com/7.x/shapes/svg?seed=admin&backgroundColor=020617&shape1Color=e30613`;
    }
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=f1f5f9&shape1Color=e30613&shape2Color=0f172a&shape3Color=94a3b8`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden px-6 py-12 selection:bg-rbt-red selection:text-white">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute -top-[20rem] -left-[10rem] w-[60rem] h-[60rem] bg-rbt-red/20 rounded-full blur-[180px] animate-pulse"></div>
         <div className="absolute bottom-[0%] -right-[15rem] w-[50rem] h-[50rem] bg-indigo-900/20 rounded-full blur-[150px]"></div>
      </div>

      <div className="bg-white/10 backdrop-blur-[100px] w-full max-w-2xl p-12 md:p-16 rounded-[5rem] border border-white/10 relative z-10 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.8)] text-center">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-rbt-red rounded-[2rem] flex items-center justify-center text-white text-4xl font-black mb-6 shadow-[0_0_50px_rgba(227,6,19,0.4)] transform hover:rotate-6 transition-transform">R</div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">RBT ACADEMY</h1>
          <p className="text-slate-400 mt-2 font-bold uppercase tracking-[0.4em] text-[9px] opacity-60">System Access Node</p>
        </div>

        <div className="mb-10">
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Визуальный ключ доступа</label>
          <div className="grid grid-cols-4 gap-4 p-2">
            {SHAPE_SEEDS.map(seed => (
              <button
                key={seed}
                type="button"
                onClick={() => setSelectedAvatar(seed)}
                className={`flex flex-col items-center justify-center aspect-square rounded-[2rem] transition-all border-4 group relative overflow-hidden ${
                  selectedAvatar === seed 
                  ? 'border-rbt-red bg-white scale-105 shadow-[0_0_30px_rgba(227,6,19,0.4)]' 
                  : 'border-white/5 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="w-full h-full p-4 transition-transform duration-500 group-hover:scale-110">
                  <img src={getAvatarUrl(seed)} alt="shape" className="w-full h-full rounded-xl" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-left">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Локация</label>
              <div className="relative">
                <select 
                  value={store}
                  onChange={(e) => setStore(e.target.value)}
                  className="w-full px-8 py-4 rounded-[1.8rem] bg-white/5 border border-white/10 focus:border-rbt-red text-white transition-all outline-none font-bold appearance-none cursor-pointer"
                >
                  {CITIES.map(city => (
                    <option key={city} value={city} className="bg-slate-900 text-white font-bold">{city}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"></i>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Сотрудник</label>
              <input 
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-8 py-4 rounded-[1.8rem] bg-white/5 border border-white/10 focus:border-rbt-red text-white transition-all outline-none font-bold placeholder:text-slate-600"
                placeholder="ФИО"
              />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Пароль</label>
            <input 
              type="password" required value={pass} onChange={(e) => setPass(e.target.value)}
              className="w-full px-8 py-4 rounded-[1.8rem] bg-white/5 border border-white/10 focus:border-rbt-red text-white transition-all outline-none font-bold placeholder:text-slate-600"
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="w-full bg-rbt-red text-white py-6 rounded-[2rem] font-black text-lg shadow-[0_25px_50px_rgba(227,6,19,0.4)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] mt-4">
            Авторизоваться
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
