
import React, { useState, useRef, useEffect } from 'react';
import { simulateClientStep, analyzeResponse, checkSpelling } from '../services/geminiService';
import { AIAnalysis } from '../types';

interface SimulatorProps {
  onScore: (xp: number) => void;
}

const PRODUCTS = [
  { name: 'OLED Телевизор Samsung 55"', basePrice: 129990 },
  { name: 'Холодильник Haier Side-by-Side', basePrice: 84990 },
  { name: 'Смартфон iPhone 15 Pro 256GB', basePrice: 115990 },
  { name: 'Стиральная машина LG Steam', basePrice: 45990 },
  { name: 'Игровая консоль PS5 Slim', basePrice: 59990 }
];

const checkProfanity = (text: string) => {
  const badWords = ['хуй', 'пизд', 'еба', 'бля', 'сука', 'гондо', 'муда', 'залуп', 'уеб', 'охуе', 'хуе'];
  const lowerText = text.toLowerCase();
  return badWords.some(word => lowerText.includes(word));
};

const Simulator: React.FC<SimulatorProps> = ({ onScore }) => {
  const [product, setProduct] = useState(PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [spellingLoading, setSpellingLoading] = useState(false);
  const [spellCorrection, setSpellCorrection] = useState<{ original: string, corrected: string, explanation: string } | null>(null);
  const [mood, setMood] = useState('Нейтральный');
  const [stressLevel, setStressLevel] = useState(30);
  const [sessionAnalysis, setSessionAnalysis] = useState<AIAnalysis | null>(null);
  const [clientLeft, setClientLeft] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false); 
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      { role: 'model', text: `Добрый день. Смотрю на этот ${product.name}, но цена ${product.basePrice.toLocaleString()} руб. кажется мне завышенной...` }
    ]);
    setSessionSaved(false);
    setSpellCorrection(null);
  }, [product]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const saveSimulatorSession = (evaluation?: AIAnalysis, left: boolean = false) => {
    const savedUser = localStorage.getItem('rbt_academy_user');
    if (!savedUser) return;
    const user = JSON.parse(savedUser);
    const rawRegistry = localStorage.getItem('rbt_academy_registry');
    const registry = rawRegistry ? JSON.parse(rawRegistry) : {};
    
    if (registry[user.name]) {
      const sessionData = {
        id: Date.now().toString(),
        type: 'simulator',
        date: new Date().toISOString(),
        product: product.name,
        price: product.basePrice,
        mood: mood,
        messages: [...messages],
        left: left,
        score: evaluation ? evaluation.score : (left ? -50 : 0),
        metrics: evaluation || null
      };
      const history = registry[user.name].lastSimulatorSession || [];
      registry[user.name].lastSimulatorSession = [sessionData, ...history].slice(0, 50);
      localStorage.setItem('rbt_academy_registry', JSON.stringify(registry));
      setSessionSaved(true);
    }
  };

  const handleSpellCheck = async () => {
    if (!input.trim() || spellingLoading) return;
    setSpellingLoading(true);
    setSpellCorrection(null);
    try {
      const result = await checkSpelling(input);
      if (result.errorsFound) {
        setSpellCorrection({
          original: input,
          corrected: result.correctedText,
          explanation: result.explanation
        });
      } else {
        // Если ошибок нет, можно вывести уведомление или просто не показывать подсказку
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSpellingLoading(false);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || loading || sessionAnalysis || clientLeft) return;
    
    setInput('');
    setSpellCorrection(null);

    if (checkProfanity(textToSend)) {
      const updatedMessages = [...messages, { role: 'user' as const, text: textToSend }, { role: 'model' as const, text: "Я не намерен слушать брань! Я ухожу!" }];
      setMessages(updatedMessages);
      setClientLeft(true);
      onScore(-100);
      saveSimulatorSession(undefined, true);
      return;
    }

    const newMessages = [...messages, { role: 'user' as const, text: textToSend }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const clientResponse = await simulateClientStep(history, mood, { name: product.name, price: product.basePrice.toString() });
      
      let nextStress = stressLevel;
      if (textToSend.length < 15) nextStress = Math.min(nextStress + 30, 100);
      else nextStress = Math.max(nextStress - 15, 0);
      setStressLevel(nextStress);

      if (nextStress >= 100) {
        const finalMessages = [...newMessages, { role: 'model' as const, text: "Вы меня утомили. Я лучше посмотрю в другом месте." }];
        setMessages(finalMessages);
        setClientLeft(true);
        onScore(-50);
        saveSimulatorSession(undefined, true);
        setLoading(false);
        return;
      }

      const updatedMessages = [...newMessages, { role: 'model' as const, text: clientResponse }];
      setMessages(updatedMessages);

      // После 4-го ответа сотрудника проводим финальный анализ
      if (updatedMessages.filter(m => m.role === 'user').length >= 4) { 
        const evaluation = await analyzeResponse(`Диалог о ${product.name} за ${product.basePrice} руб.`, updatedMessages.map(m => `${m.role === 'user' ? 'Продавец' : 'Клиент'}: ${m.text}`).join('\n'));
        setSessionAnalysis(evaluation);
        saveSimulatorSession(evaluation, false);
        onScore(evaluation.score);
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const currentUserAvatar = localStorage.getItem('rbt_academy_avatar') || 'Pulse';
  const isAdmin = localStorage.getItem('rbt_academy_user')?.includes('ADMIN');

  const getStaffAvatar = () => {
    if (isAdmin || currentUserAvatar === 'admin-core') {
       return `https://api.dicebear.com/7.x/shapes/svg?seed=admin&backgroundColor=020617&shape1Color=e30613`;
    }
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${currentUserAvatar}&backgroundColor=f1f5f9&shape1Color=e30613&shape2Color=0f172a&shape3Color=94a3b8`;
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500 w-full text-left">
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center border-4 ${stressLevel > 60 ? 'border-red-400' : 'border-emerald-400'} overflow-hidden shadow-2xl transition-all duration-500 bg-slate-100 p-0`}>
              <img src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${mood}${stressLevel}`} alt="Customer" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-tighter shadow-lg">CLIENT AI</div>
          </div>
          <div className="text-left">
            <h3 className="font-black text-xl text-slate-900 italic tracking-tight mb-1">{product.name}</h3>
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-black text-rbt-red bg-red-50 px-3 py-1 rounded-full shadow-sm">{product.basePrice.toLocaleString()} ₽</span>
               <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div className={`h-full transition-all duration-700 ${stressLevel > 70 ? 'bg-rbt-red' : 'bg-emerald-400'}`} style={{ width: `${stressLevel}%` }}></div>
               </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 bg-slate-50 p-2 rounded-[1.5rem] border border-slate-100">
          {['Нейтральный', 'Раздраженный', 'Сомневающийся'].map(m => (
            <button 
              key={m}
              onClick={() => { setMood(m); setStressLevel(m === 'Раздраженный' ? 80 : 30); }}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mood === m ? 'bg-white text-rbt-red shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 bg-white/70 backdrop-blur-md rounded-[3.5rem] shadow-inner border border-white overflow-y-auto p-10 space-y-8 scroll-smooth custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2`}>
            <div className={`w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-lg border-2 ${m.role === 'user' ? 'border-slate-800 bg-slate-900 p-2' : 'border-white bg-slate-100 p-2'}`}>
              <img src={m.role === 'user' ? getStaffAvatar() : `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${mood}${stressLevel}&backgroundColor=transparent`} alt="Avatar" />
            </div>
            <div className={`max-w-[80%] p-6 rounded-[2.5rem] shadow-sm text-left ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-sm'}`}>
              <p className="leading-relaxed font-bold text-lg italic">"{m.text}"</p>
            </div>
          </div>
        ))}
        {loading && <div className="text-center italic text-slate-400 text-sm animate-pulse">Клиент печатает ответ...</div>}
        {clientLeft && <div className="p-10 bg-red-50 rounded-[3rem] text-center font-black text-rbt-red italic border-2 border-red-100 shadow-xl animate-in zoom-in">КЛИЕНТ ПОКИНУЛ МАГАЗИН!</div>}
        
        {sessionAnalysis && (
          <div className="p-10 bg-emerald-50 rounded-[3.5rem] border-2 border-emerald-100 shadow-xl animate-in zoom-in text-left">
            <h4 className="text-2xl font-black text-emerald-900 mb-6 italic tracking-tight">Анализ диалога завершен</h4>
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50">
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">XP Начислено</div>
                  <div className="text-3xl font-black text-emerald-600">+{sessionAnalysis.score}</div>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50">
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Удовлетворенность</div>
                  <div className="text-3xl font-black text-emerald-600">{sessionAnalysis.satisfaction}%</div>
               </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm italic text-emerald-800 leading-relaxed font-medium">
               {sessionAnalysis.feedback}
            </div>
          </div>
        )}
      </div>

      {!sessionAnalysis && !clientLeft && (
        <div className="relative">
          {spellCorrection && (
            <div className="absolute bottom-[calc(100%+16px)] left-0 right-0 bg-amber-50 p-6 rounded-[2.5rem] border-2 border-amber-200 shadow-2xl animate-in slide-in-from-bottom-4 flex items-center justify-between gap-6 z-10">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0">
                   <i className="fas fa-magic"></i>
                </div>
                <div>
                   <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Корректор RBT</p>
                   <p className="text-slate-800 font-bold italic leading-tight">Возможно, вы имели в виду: <span className="text-rbt-red">"{spellCorrection.corrected}"</span></p>
                </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setSpellCorrection(null)} className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Игнорировать</button>
                 <button onClick={() => { setInput(spellCorrection.corrected); setSpellCorrection(null); }} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-amber-600">Исправить</button>
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-[3rem] shadow-2xl border border-gray-100 flex gap-4 items-center relative overflow-hidden">
            <input 
              type="text" value={input} disabled={loading} 
              onChange={(e) => { setInput(e.target.value); if (spellCorrection) setSpellCorrection(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Введите профессиональный ответ..."
              className="flex-1 px-10 py-6 rounded-[2.5rem] bg-slate-50 border-none outline-none text-slate-800 font-bold text-lg placeholder:text-slate-300"
            />
            <div className="flex gap-3">
              <button 
                onClick={handleSpellCheck} 
                disabled={!input.trim() || loading || spellingLoading}
                className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all shadow-lg ${spellingLoading ? 'bg-slate-100 text-slate-300' : 'bg-slate-100 text-slate-500 hover:bg-amber-500 hover:text-white'}`}
                title="Проверить ошибки"
              >
                <i className={`fas ${spellingLoading ? 'fa-spinner fa-spin' : 'fa-spell-check'} text-xl`}></i>
              </button>
              <button onClick={() => handleSend()} disabled={!input.trim() || loading} className="w-16 h-16 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center hover:bg-rbt-red transition-all shadow-xl active:scale-90 disabled:opacity-50">
                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-paper-plane'} text-xl`}></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Simulator;
