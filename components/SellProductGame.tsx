
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface SellProductGameProps {
  onScore: (xp: number) => void;
  onClose: () => void;
}

interface Step {
  client: string;
  options: { text: string; score: number; feedback: string }[];
}

const SellProductGame: React.FC<SellProductGameProps> = ({ onScore, onClose }) => {
  const [step, setStep] = useState(0);
  const [scenario, setScenario] = useState<{ product: string; steps: Step[] } | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<{ score: number }[]>([]);

  const generateScenario = async () => {
    setLoading(true);
    setHistory([]);
    setTotalScore(0);
    setStep(0);
    setFinished(false);
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Сгенерируй случайный сценарий продажи в магазине RBT.RU. Выбери товар (бытовая техника или электроника). Создай 3 шага диалога. На каждом шаге клиент задает вопрос или возражает, и дай 3 варианта ответа: идеальный (+30 XP), средний (+10 XP) и провальный (-20 XP).",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              product: { type: Type.STRING },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    client: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          text: { type: Type.STRING },
                          score: { type: Type.NUMBER },
                          feedback: { type: Type.STRING }
                        },
                        required: ["text", "score", "feedback"]
                      }
                    }
                  },
                  required: ["client", "options"]
                }
              }
            },
            required: ["product", "steps"]
          }
        }
      });
      setScenario(JSON.parse(result.text));
    } catch (e) {
      console.error("Failed to generate scenario", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateScenario();
  }, []);

  const handleOption = (score: number) => {
    setHistory(prev => [...prev, { score }]);
    const newTotal = totalScore + score;
    setTotalScore(newTotal);
    
    if (scenario && step < scenario.steps.length - 1) {
      setStep(step + 1);
    } else {
      setFinished(true);
      onScore(newTotal);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      const lastAction = history[history.length - 1];
      setTotalScore(totalScore - lastAction.score);
      setHistory(history.slice(0, -1));
      setStep(step - 1);
    } else {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-xl animate-pulse">
        <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <i className="fas fa-robot text-slate-300 text-3xl"></i>
        </div>
        <h2 className="text-xl font-black text-slate-400 italic">Бот генерирует ситуацию...</h2>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-xl animate-in zoom-in">
        <div className={`w-24 h-24 ${totalScore >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center mx-auto mb-6 text-4xl`}>
          <i className={`fas ${totalScore >= 0 ? 'fa-cash-register' : 'fa-face-frown'}`}></i>
        </div>
        <h2 className="text-3xl font-black mb-2 italic">{totalScore >= 30 ? 'Сделка закрыта!' : 'Клиент ушел...'}</h2>
        <p className="text-slate-500 mb-8 font-medium">Итоговый результат: <span className={totalScore >= 0 ? 'text-emerald-600' : 'text-red-600'}>{totalScore} XP</span></p>
        <button onClick={onClose} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black">В меню игр</button>
      </div>
    );
  }

  return (
    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-2xl animate-in slide-in-from-right-10 relative">
      <button 
        onClick={handleBack}
        className="absolute top-12 left-8 w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all active:scale-90"
        title="Назад"
      >
        <i className="fas fa-arrow-left"></i>
      </button>

      <div className="flex items-center gap-4 mb-10 pl-8">
        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
          <i className="fas fa-box-open"></i>
        </div>
        <div>
          <h3 className="font-black text-slate-900 italic uppercase tracking-tighter">Сценарий продажи</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">{scenario?.product}</p>
        </div>
        <div className="ml-auto flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-400 uppercase">Прогресс</span>
          <div className="flex gap-1 mt-1">
            {scenario?.steps.map((_, i) => (
              <div key={i} className={`w-4 h-1.5 rounded-full ${i <= step ? 'bg-rbt-red' : 'bg-slate-100'}`}></div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 mb-10 relative">
        <div className="absolute -top-3 -left-3 w-8 h-8 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 shadow-sm">
           <i className="fas fa-comment-dots text-xs"></i>
        </div>
        <p className="text-xl font-bold italic text-slate-700">"{scenario?.steps[step].client}"</p>
      </div>

      <div className="space-y-4">
        {scenario?.steps[step].options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleOption(opt.score)}
            className="w-full text-left p-6 rounded-[2rem] border-2 border-slate-50 hover:border-rbt-red hover:bg-slate-50 transition-all font-bold text-slate-800 flex justify-between items-center group active:scale-95"
          >
            <span className="flex-1 text-sm md:text-base">{opt.text}</span>
            <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 shrink-0">
               <span className="text-[10px] uppercase font-black text-slate-400">Выбрать</span>
               <i className="fas fa-chevron-right text-rbt-red"></i>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-slate-50 flex justify-between items-center">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Текущий счет: <span className={totalScore >= 0 ? 'text-emerald-500' : 'text-red-500'}>{totalScore} XP</span>
        </div>
        <button 
          onClick={generateScenario}
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rbt-red transition-colors flex items-center gap-2"
        >
          <i className="fas fa-sync-alt"></i> Другая ситуация
        </button>
      </div>
    </div>
  );
};

export default SellProductGame;
