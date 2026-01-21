
import React, { useState, useEffect } from 'react';
import { analyzeResponse, checkSpelling } from '../services/geminiService';
import { AIAnalysis } from '../types';

interface ObjectionModuleProps {
  onScore: (xp: number) => void;
}

const OBJECTIONS_POOL = [
  "В другом магазине на 2000 рублей дешевле!",
  "Мне нужно подумать, я вернусь позже.",
  "Зачем мне расширенная гарантия?",
  "Этот бренд мне неизвестен.",
  "Я видел плохие отзывы на эту модель.",
  "Доставка слишком дорогая.",
  "Слишком много кнопок, не разберусь.",
  "У вас в магазине всегда очереди.",
  "Я подожду скидок на Черную пятницу.",
  "Мне сказали, что эта модель часто ломается.",
  "Почему я должен платить за установку?",
  "Я поищу эту модель на маркетплейсе.",
  "Кредит — это кабала, не хочу процентов.",
  "Цвет не подходит под мою кухню.",
  "Ваш консультант в прошлый раз мне нахамил."
];

const SESSION_LIMIT = 10;
const STORAGE_KEY = 'rbt_active_objection_session';

const ObjectionModule: React.FC<ObjectionModuleProps> = ({ onScore }) => {
  const [sessionQuestions, setSessionQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [spellingLoading, setSpellingLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [spellCorrection, setSpellCorrection] = useState<{ original: string, corrected: string, explanation: string } | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEY);
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      if (parsed.isFinished) {
        initSession();
      } else {
        setSessionQuestions(parsed.questions);
        setCurrentIndex(parsed.currentIndex);
        setIsFinished(parsed.isFinished);
      }
    } else {
      initSession();
    }
  }, []);

  const saveObjectionResult = (question: string, answer: string, evalResult: AIAnalysis) => {
    const savedUser = localStorage.getItem('rbt_academy_user');
    if (!savedUser) return;
    
    const user = JSON.parse(savedUser);
    const rawRegistry = localStorage.getItem('rbt_academy_registry');
    const registry = rawRegistry ? JSON.parse(rawRegistry) : {};
    
    if (registry[user.name]) {
      const history = registry[user.name].lastObjectionSession || [];
      const entry = {
        date: new Date().toISOString(),
        question,
        answer,
        score: evalResult.score,
        metrics: evalResult
      };
      registry[user.name].lastObjectionSession = [entry, ...history].slice(0, 50);
      localStorage.setItem('rbt_academy_registry', JSON.stringify(registry));
    }
  };

  const handleSpellCheck = async () => {
    if (!userInput.trim() || spellingLoading) return;
    setSpellingLoading(true);
    try {
      const result = await checkSpelling(userInput);
      if (result.errorsFound) {
        setSpellCorrection({
          original: userInput,
          corrected: result.correctedText,
          explanation: result.explanation
        });
      } else {
        alert("Ошибок не найдено!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSpellingLoading(false);
    }
  };

  const initSession = () => {
    const shuffled = [...OBJECTIONS_POOL].sort(() => 0.5 - Math.random()).slice(0, SESSION_LIMIT);
    setSessionQuestions(shuffled);
    setCurrentIndex(0);
    setUserInput('');
    setAnalysis(null);
    setIsFinished(false);
    setSpellCorrection(null);
  };

  const handleSubmit = async () => {
    if (!userInput.trim() || !sessionQuestions[currentIndex]) return;
    setLoading(true);
    try {
      const result = await analyzeResponse(sessionQuestions[currentIndex], userInput);
      setAnalysis(result);
      saveObjectionResult(sessionQuestions[currentIndex], userInput, result);
      onScore(result.score);
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextObjection = () => {
    if (currentIndex < SESSION_LIMIT - 1) {
      setAnalysis(null);
      setUserInput('');
      setSpellCorrection(null);
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="max-w-md mx-auto bg-white p-12 rounded-[4rem] shadow-2xl text-center border border-slate-100 animate-in zoom-in-95">
        <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-xl">
          <i className="fas fa-check"></i>
        </div>
        <h2 className="text-3xl font-black mb-4 italic">Сессия завершена!</h2>
        <button onClick={initSession} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black hover:bg-rbt-red transition-all">Новый марафон</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6 animate-in fade-in slide-in-from-bottom-6 w-full">
      <div className="glass-card rounded-[4rem] p-12 relative overflow-hidden shadow-2xl border border-white/50">
        <div className="flex items-center justify-between mb-12">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Этап {currentIndex + 1} из {SESSION_LIMIT}</span>
        </div>
        
        <div className="mb-12">
          <span className="bg-slate-900 text-white px-5 py-1.5 rounded-full text-[9px] font-black uppercase mb-6 inline-block">Возражение</span>
          <h2 className="text-4xl font-black text-slate-900 leading-tight italic tracking-tight">«{sessionQuestions[currentIndex]}»</h2>
        </div>

        <div className="relative group">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={!!analysis || loading}
            placeholder="Ваш ответ..."
            className="w-full h-64 p-10 rounded-[3rem] border-2 border-slate-100 focus:border-rbt-red outline-none transition-all resize-none text-xl font-medium"
          />
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-md rounded-[3rem] flex items-center justify-center">
              <i className="fas fa-spinner fa-spin text-4xl text-rbt-red"></i>
            </div>
          )}
          
          <div className="absolute bottom-6 right-6 flex gap-3">
             {!analysis && !loading && (
               <>
                 <button onClick={handleSpellCheck} className="px-6 py-5 bg-slate-100 text-slate-500 rounded-full font-black hover:bg-blue-50 hover:text-blue-500 transition-all">
                    <i className={`fas ${spellingLoading ? 'fa-spinner fa-spin' : 'fa-spell-check'}`}></i>
                 </button>
                 <button onClick={handleSubmit} disabled={!userInput.trim()} className="px-10 py-5 bg-slate-900 text-white rounded-full font-black hover:bg-rbt-red transition-all shadow-xl">
                    Разобрать <i className="fas fa-magic ml-2"></i>
                 </button>
               </>
             )}
          </div>
        </div>

        {spellCorrection && !analysis && (
          <div className="mt-6 p-6 bg-amber-50 rounded-[2rem] border border-amber-200 flex items-center justify-between">
            <p className="text-slate-800 font-bold italic text-sm">Исправить на: "{spellCorrection.corrected}"?</p>
            <button onClick={() => { setUserInput(spellCorrection.corrected); setSpellCorrection(null); }} className="px-6 py-2 bg-amber-500 text-white rounded-full font-black text-xs uppercase">Да</button>
          </div>
        )}
      </div>

      {analysis && (
        <div className="rounded-[4rem] p-12 bg-white shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Убедительность', val: analysis.persuasiveness },
              { label: 'Вежливость', val: analysis.politeness },
              { label: 'Логика', val: analysis.logic },
              { label: 'Ориентация', val: analysis.clientOrientation }
            ].map(m => (
              <div key={m.label} className="bg-slate-50 p-6 rounded-[2rem] text-center border border-slate-100">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{m.label}</div>
                <div className="text-2xl font-black text-slate-900">{m.val}/10</div>
              </div>
            ))}
          </div>
          <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] mb-10">
            <p className="text-xl leading-relaxed italic whitespace-pre-line">{analysis.feedback}</p>
          </div>
          <button onClick={nextObjection} className="w-full bg-rbt-red text-white py-5 rounded-[2rem] font-black text-lg hover:bg-slate-900 transition-all">
            {currentIndex === SESSION_LIMIT - 1 ? 'Завершить марафон' : 'Дальше'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ObjectionModule;
