
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface QuickReplyGameProps {
  onScore: (xp: number) => void;
  onClose: () => void;
}

interface Question {
  q: string;
  options: { text: string; score: number; feedback: string }[];
}

const QuickReplyGame: React.FC<QuickReplyGameProps> = ({ onScore, onClose }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [finished, setFinished] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [customInput, setCustomInput] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Сгенерируй 3 случайных вопроса от клиентов RBT.RU. Вопросы должны быть короткими и четкими (макс 10 слов). Для каждого дай 3 варианта ответа: 1. Идеальный (+30 XP, четкий и по делу), 2. Сомнительный (-15 XP, с риском), 3. Провальный (-40 XP). Темы: цена, наличие, гарантия, скидки. Все тексты должны быть максимально лаконичными.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                q: { type: Type.STRING },
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
              required: ["q", "options"]
            }
          }
        }
      });
      setQuestions(JSON.parse(result.text));
    } catch (e) {
      console.error("Failed to fetch questions", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !finished && !lastFeedback && !loading && !isCustomMode) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !finished && !lastFeedback && !isCustomMode) {
      handleOptionSelect(-25, "Время вышло! В продажах скорость реакции критична."); 
    }
  }, [timeLeft, finished, lastFeedback, loading, isCustomMode]);

  const saveCustomResponse = (question: string, response: string) => {
    const rawLogs = localStorage.getItem('rbt_custom_responses') || '[]';
    const logs = JSON.parse(rawLogs);
    const user = JSON.parse(localStorage.getItem('rbt_academy_user') || '{}');
    logs.push({
      userName: user.name || 'Anonymous',
      question,
      response,
      date: new Date().toISOString()
    });
    localStorage.setItem('rbt_custom_responses', JSON.stringify(logs));
  };

  const handleOptionSelect = (xp: number, feedback: string) => {
    setTotalScore(prev => prev + xp);
    setLastFeedback(feedback);
  };

  const handleCustomSubmit = async () => {
    if (!customInput.trim()) return;
    setLoading(true);
    saveCustomResponse(questions[step].q, customInput);
    
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Оцени ответ продавца на вопрос клиента: "${questions[step].q}". Ответ продавца: "${customInput}". Дай оценку XP (от -50 до +50) и очень короткий фидбек (макс 1 предложение).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING }
            },
            required: ["score", "feedback"]
          }
        }
      });
      const evalData = JSON.parse(result.text);
      handleOptionSelect(evalData.score, evalData.feedback);
    } catch (e) {
      handleOptionSelect(10, "Ответ принят и отправлен на проверку администратору.");
    } finally {
      setLoading(false);
      setIsCustomMode(false);
      setCustomInput('');
    }
  };

  const nextStep = () => {
    setLastFeedback(null);
    if (step < questions.length - 1) {
      setStep(step + 1);
      setTimeLeft(15);
    } else {
      setFinished(true);
      onScore(totalScore);
    }
  };

  if (loading && questions.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md animate-pulse">
        <i className="fas fa-spinner fa-spin text-4xl text-rbt-red mb-4"></i>
        <p className="font-black italic text-slate-400">Генерируем испытания...</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center animate-in zoom-in-95 max-w-md">
        <div className={`w-24 h-24 ${totalScore >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center mx-auto mb-6 text-4xl`}>
          <i className={`fas ${totalScore >= 0 ? 'fa-check-double' : 'fa-skull-crossbones'}`}></i>
        </div>
        <h2 className="text-3xl font-black mb-2 italic">Итог забега</h2>
        <p className={`text-2xl font-black mb-8 ${totalScore >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {totalScore > 0 ? '+' : ''}{totalScore} XP
        </p>
        <button onClick={onClose} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black">Вернуться</button>
      </div>
    );
  }

  return (
    <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl w-full max-w-2xl animate-in slide-in-from-bottom-10 relative">
      <div className="flex justify-between items-center mb-10">
        <div className="flex flex-col">
          <span className="bg-rbt-red text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit">Вопрос {step + 1}/{questions.length}</span>
          {isCustomMode && <span className="text-[9px] font-black text-amber-500 uppercase mt-2 tracking-widest">Таймер остановлен</span>}
        </div>
        {!isCustomMode && (
          <div className={`text-2xl font-black ${timeLeft < 6 ? 'text-rbt-red animate-pulse' : 'text-slate-400'}`}>
            <i className="fas fa-bolt mr-2"></i>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </div>
        )}
      </div>

      <h3 className="text-2xl font-black text-slate-900 mb-10 italic leading-tight">"{questions[step].q}"</h3>

      {!lastFeedback ? (
        <div className="space-y-4">
          {!isCustomMode ? (
            <>
              {questions[step].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionSelect(opt.score, opt.feedback)}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-bold text-slate-700 active:scale-95 flex justify-between items-center group ${
                    opt.score < 0 ? 'border-slate-100 hover:border-amber-200 hover:bg-amber-50/30' : 'border-slate-100 hover:border-rbt-red hover:bg-slate-50'
                  }`}
                >
                  <span className="pr-4">{opt.text}</span>
                  <i className="fas fa-chevron-right opacity-0 group-hover:opacity-100 text-rbt-red transition-opacity"></i>
                </button>
              ))}
              <div className="pt-4">
                <button 
                  onClick={() => setIsCustomMode(true)}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-black text-xs uppercase tracking-widest hover:border-slate-400 hover:text-slate-600 transition-all"
                >
                  <i className="fas fa-pen-nib mr-2"></i> Ответить по-своему
                </button>
              </div>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-2">
              <textarea 
                autoFocus
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Ваш четкий ответ..."
                className="w-full h-32 p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-rbt-red outline-none font-bold text-slate-700 transition-all mb-4"
              />
              <div className="flex gap-4">
                <button onClick={() => setIsCustomMode(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs">Отмена</button>
                <button 
                  onClick={handleCustomSubmit}
                  disabled={!customInput.trim() || loading}
                  className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg"
                >
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Отправить'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in-95 text-center">
          <div className={`p-10 rounded-[2.5rem] mb-8 border-2 ${totalScore >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
            <div className="text-4xl mb-4">
               <i className={`fas ${totalScore >= 0 ? 'fa-face-smile' : 'fa-face-frown-open'}`}></i>
            </div>
            <p className="text-lg font-black italic mb-2">"{lastFeedback}"</p>
          </div>
          <button onClick={nextStep} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-rbt-red transition-colors">
            Дальше <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickReplyGame;
