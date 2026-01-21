
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ObjectionModule from './components/ObjectionModule';
import Simulator from './components/Simulator';
import Leaderboard from './components/Leaderboard';
import Auth from './components/Auth';
import Profile from './components/Profile';
import QuickReplyGame from './components/QuickReplyGame';
import FixErrorGame from './components/FixErrorGame';
import SellProductGame from './components/SellProductGame';
import AdminPanel from './components/AdminPanel';
import { UserProfile, UserRole } from './types';

const INITIAL_USER: UserProfile = {
  id: 'RBT-TEMP',
  name: 'Новый Сотрудник',
  position: 'Продавец-консультант',
  store: 'Челябинск',
  level: UserRole.JUNIOR,
  xp: 0,
  modulesCompleted: 0,
  avgRating: 0,
  achievements: []
};

const ROLE_MAP = {
  [UserRole.JUNIOR]: 'Стажер (Junior)',
  [UserRole.MIDDLE]: 'Специалист (Middle)',
  [UserRole.SENIOR]: 'Мастер (Senior)',
  [UserRole.EXPERT]: 'Эксперт (Expert)'
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [avatar, setAvatar] = useState('pixel-1');

  const syncToRegistry = (userData: UserProfile, avatarSeed: string) => {
    if (userData.name === 'ADMIN') return;
    const rawRegistry = localStorage.getItem('rbt_academy_registry');
    const registry = rawRegistry ? JSON.parse(rawRegistry) : {};
    
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Используем деструктуризацию, чтобы не затирать историю сессий (lastSimulatorSession и др.)
    registry[userData.name] = {
      ...(registry[userData.name] || {}),
      name: userData.name,
      xp: userData.xp,
      level: ROLE_MAP[userData.level],
      store: userData.store,
      avatar: avatarSeed
    };
    localStorage.setItem('rbt_academy_registry', JSON.stringify(registry));
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('rbt_academy_user');
    const savedAvatar = localStorage.getItem('rbt_academy_avatar');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setAvatar(savedAvatar || 'pixel-1');
      setIsAuthenticated(true);
      if (parsed.name === 'ADMIN') setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('rbt_academy_user', JSON.stringify(user));
      localStorage.setItem('rbt_academy_avatar', avatar);
      syncToRegistry(user, avatar);
    }
  }, [user, isAuthenticated, avatar]);

  const handleLogin = (name: string, store: string, avatarSeed: string, pass: string) => {
    if (name.toUpperCase() === 'ADMIN') {
      if (pass === '4545') {
        const adminUser = { ...INITIAL_USER, name: 'ADMIN', store: 'Центральный офис', level: UserRole.EXPERT };
        setUser(adminUser);
        setAvatar('pixel-5');
        setIsAdmin(true);
        setIsAuthenticated(true);
        setCurrentView('admin');
        localStorage.setItem('rbt_academy_pass', pass);
        return;
      } else {
        alert('Неверный пароль администратора!');
        return;
      }
    }

    const newUser = { ...INITIAL_USER, name, store };
    setUser(newUser);
    setAvatar(avatarSeed);
    setIsAdmin(false);
    setIsAuthenticated(true);
    localStorage.setItem('rbt_academy_pass', pass);
  };

  const handleScoreUpdate = (xp: number) => {
    const now = new Date();
    const historyKey = 'rbt_learning_history';
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history.push({ date: now.toISOString(), xp });
    localStorage.setItem(historyKey, JSON.stringify(history));

    setUser(prev => {
      const newXp = prev.xp + xp;
      let newLevel = prev.level;
      let newAchievements = [...prev.achievements];

      if (newXp > 3000) newLevel = UserRole.EXPERT;
      else if (newXp > 2000) newLevel = UserRole.SENIOR;
      else if (newXp > 1000) newLevel = UserRole.MIDDLE;

      if (prev.modulesCompleted + 1 === 1 && !newAchievements.includes('Первый шаг')) {
        newAchievements.push('Первый шаг');
      }
      return { ...prev, xp: newXp, level: newLevel, modulesCompleted: prev.modulesCompleted + 1, achievements: newAchievements };
    });
  };

  const handleAdminNavigate = () => {
    setIsAdmin(true);
    setCurrentView('admin');
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (activeGame === 'quick') return <QuickReplyGame onScore={handleScoreUpdate} onClose={() => setActiveGame(null)} />;
    if (activeGame === 'fix') return <FixErrorGame onScore={handleScoreUpdate} onClose={() => setActiveGame(null)} />;
    if (activeGame === 'sell') return <SellProductGame onScore={handleScoreUpdate} onClose={() => setActiveGame(null)} />;
    if (currentView === 'admin' && isAdmin) return <AdminPanel onClose={() => setCurrentView('dashboard')} />;

    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={user} onShowProfile={() => setCurrentView('profile')} />;
      case 'profile':
        return <Profile user={user} avatar={avatar} onNavigateToAdmin={handleAdminNavigate} />;
      case 'objections':
        return <ObjectionModule onScore={handleScoreUpdate} />;
      case 'simulator':
        return <Simulator onScore={handleScoreUpdate} />;
      case 'leaderboard':
        return <Leaderboard user={user} />;
      case 'games':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 animate-in fade-in slide-in-from-bottom-5">
            {[
              { id: 'quick', title: 'Быстрый ответ', icon: 'fa-bolt', desc: 'Таймер 10 сек. Выбери идеальный вариант.', color: 'bg-amber-500' },
              { id: 'fix', title: 'Исправь ошибку', icon: 'fa-spell-check', desc: 'Продавец ошибся. Исправь его!', color: 'bg-blue-500' },
              { id: 'sell', title: 'Продай товар', icon: 'fa-sack-dollar', desc: 'Сложный клиент. Доведи до оплаты.', color: 'bg-emerald-500' },
            ].map(game => (
              <div 
                key={game.id}
                onClick={() => setActiveGame(game.id)}
                className="glass-card p-10 rounded-[3rem] group cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden flex flex-col h-full"
              >
                <div className={`absolute -right-4 -bottom-4 w-32 h-32 ${game.color} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
                <div className={`w-16 h-16 ${game.color} text-white rounded-3xl flex items-center justify-center text-2xl mb-8 shadow-xl group-hover:rotate-12 transition-transform`}>
                  <i className={`fas ${game.icon}`}></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 italic tracking-tight">{game.title}</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8 flex-grow">{game.desc}</p>
                <div className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                  Запустить <i className="fas fa-play text-rbt-red"></i>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return <Dashboard user={user} onShowProfile={() => setCurrentView('profile')} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 selection:bg-rbt-red selection:text-white">
      <Sidebar 
        currentView={currentView} 
        onNavigate={(view) => {
          if (view === 'admin' && !isAdmin) return;
          setCurrentView(view);
        }} 
        xp={user.xp} 
        level={ROLE_MAP[user.level]} 
      />
      
      <main className="flex-1 ml-72 p-8 min-h-screen relative">
        <div className="max-w-6xl mx-auto py-4 flex items-center justify-center min-h-[85vh]">
          {renderContent()}
        </div>
      </main>

      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
         <button 
           onClick={() => {
             setIsAuthenticated(false);
             setIsAdmin(false);
             localStorage.removeItem('rbt_academy_user');
             localStorage.removeItem('rbt_academy_pass');
           }}
           className="w-14 h-14 bg-white shadow-xl rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rbt-red transition-all hover:scale-110 group"
         >
            <i className="fas fa-power-off text-lg"></i>
         </button>
      </div>
    </div>
  );
};

export default App;
