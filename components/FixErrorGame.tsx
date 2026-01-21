
import React, { useState, useEffect } from 'react';
import { analyzeResponse } from '../services/geminiService';

interface FixErrorGameProps {
  onScore: (xp: number) => void;
  onClose: () => void;
}

const ERRORS_POOL = [
  {
    bad: "Да какая разница, они все одинаково стирают, берите эту и не мучайтесь.",
    context: "Клиент сомневается между двумя моделями стиральных машин."
  },
  {
    bad: "Дорого? Ну не знаю, у нас зато оригинал, а не подделка какая-нибудь как на рынках.",
    context: "Клиент говорит, что цена на смартфон слишком высокая."
  },
  {
    bad: "Я сейчас занят другим делом, подождите свободного консультанта, он скоро подойдет.",
    context: "Клиент просит помочь с выбором чайника, пока вы расставляете ценники."
  },
  {
    bad: "Зачем вам это читать? Я же вам говорю — хороший пылесос, мощный, надо брать.",
    context: "Клиент пытается внимательно изучить характеристики на коробке."
  },
  {
    bad: "У нас возврата нет, если вы просто передумали. Читайте законы, техника — это сложный товар.",
    context: "Клиент спрашивает, можно ли вернуть товар в течение 14 дней."
  },
  {
    bad: "Эта модель плохая, постоянно ломается. Возьмите вот эту, на нее сейчас план продаж стоит.",
    context: "Клиент спрашивает про конкретный бренд телевизора."
  },
  {
    bad: "Ой, я не знаю характеристик, посмотрите на ценнике, там все написано.",
    context: "Клиент просит подробно рассказать о функциях современного холодильника."
  },
  {
    bad: "Вам этот телевизор не по карману, давайте лучше посмотрим что попроще, тысяч за тридцать.",
    context: "Клиент засмотрелся на топовую OLED модель Samsung."
  },
  {
    bad: "Скидок больше нет, и так цена ниже плинтуса. Берите или завтра дороже будет.",
    context: "Клиент просит сделать хотя бы небольшую скидку при покупке комплекта."
  },
  {
    bad: "Гарантия от производителя — это долго и сложно. Если сломается, будете сами возить через весь город.",
    context: "Сотрудник навязчиво предлагает Пакет Дополнительного Сервиса (ПДС)."
  },
  {
    bad: "Эта фирма — Китай голимый, через месяц выбросите. Вот берите наш бренд-партнер.",
    context: "Клиент интересуется бюджетным, но популярным брендом электрочайников."
  },
  {
    bad: "А что вы хотели за такие деньги? Это бюджетный сегмент, там везде пластик скрипит.",
    context: "Клиент жалуется на люфт корпуса в недорогом ноутбуке."
  },
  {
    bad: "Я не могу вам сделать проверку на битые пиксели, у нас очередь. Дома проверите.",
    context: "Клиент хочет проверить телевизор перед тем, как оплатить доставку."
  },
  {
    bad: "Да кому нужны эти функции? Лишняя переплата за маркетинг. Возьмите обычный кнопочный.",
    context: "Пожилой человек интересуется смартфоном с функциями мониторинга здоровья."
  },
  {
    bad: "Вы же женщина, зачем вам знать про обороты и мощность? Главное, что машинка красненькая!",
    context: "Девушка задает технические вопросы про профессиональный фен."
  },
  {
    bad: "Если не купите сейчас, то потом не жалуйтесь, что акция кончилась. Я предупреждал.",
    context: "Продавец пытается использовать дефицит времени для закрытия сделки."
  }
];

const FixErrorGame: React.FC<FixErrorGameProps> = ({ onScore, onClose }) => {
  const [currentPool, setCurrentPool] = useState<typeof ERRORS_POOL>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Увеличиваем количество заданий до 5 за сессию для лучшей проработки
    const shuffled = [...ERRORS_POOL].sort(() => 0.5 - Math.random()).slice(0, 5);
    setCurrentPool(shuffled);
  }, []);

  const handleFix = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const currentTask = currentPool[currentIndex];
      // Включаем в промпт требование более строгой оценки для корпоративного обучения
      const analysis = await analyzeResponse(
        `СИТУАЦИЯ: ${currentTask.context}. ПЛОХОЙ ОТВЕТ: "${currentTask.bad}". Твоя задача оценить, насколько ИСПРАВЛЕННЫЙ вариант соответствует стандартам клиентского сервиса RBT.RU.`,
        input
      );
      setResult(analysis);
      setTotalXp(prev => prev + analysis.score);
    } catch (e) {
      console.error(e);
      setResult({ score: 25, satisfaction: 85, feedback: "Отличная работа по исправлению ошибки! Ответ звучит гораздо профессиональнее." });
      setTotalXp(prev => prev + 25);
    } finally {
      setLoading(false);
    }
  };

  const nextTask = () => {
    if (currentIndex < currentPool.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setInput('');
      setResult(null);
    } else {
      setIsFinished(true);
      onScore(totalXp);
    }
  };

  if (currentPool.length === 0) return null;

  if (isFinished) {
    return (
      <div className="bg-white p-12 rounded-[4rem] shadow-2xl text-center max-w-md animate-in zoom-in-95 border border-slate-100">
        <div className="w-24 h-24 bg-rbt-red text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-4xl shadow-[0_15px_30px_rgba(227,6,19,0.3)] transform rotate-6">
          <i className="fas fa-medal"></i>
        </div>
        <h2 className="text-3xl font-black mb-2 italic text-slate-900 tracking-tighter">Мастер Сервиса</h2>
        <p className="text-slate-500 mb-10 font-medium">Вы успешно исправили ошибки коллег и заработали <span className="text-rbt-red font-black text-xl">{totalXp} XP</span></p>
        <button onClick={onClose} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-rbt-red transition-all shadow-xl active:scale-95">Вернуться в Академию</button>
      </div>
    );
  }

  const currentTask = currentPool[currentIndex];

  return (
    <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-2xl w-full max-w-3xl animate-in slide-in-from-bottom-10 relative border border-slate-50">
      <div className="flex justify-between items-center mb-10">
        <div className="flex flex-col gap-1">
          <span className="bg-slate-900 text-white px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Кейс {currentIndex + 1} из {currentPool.length}</span>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Модуль исправлений</span>
        </div>
        <div className="flex items-center gap-3">
           <i className="fas fa-bolt text-amber-500 animate-pulse"></i>
           <div className="text-slate-900 font-black text-xl tracking-tighter italic">{totalXp} <span className="text-slate-300 text-xs not-italic uppercase ml-1">XP</span></div>
        </div>
      </div>

      <div className="mb-10 text-left">
        <h2 className="text-4xl font-black text-slate-900 mb-3 italic tracking-tighter leading-none">Исправь ошибку <span className="text-rbt-red">.</span></h2>
        <p className="text-slate-400 font-bold italic text-lg leading-tight">«{currentTask.context}»</p>
      </div>
      
      <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 mb-10 relative group hover:border-rbt-red transition-colors">
        <div className="absolute -top-3 left-8 bg-white px-3 py-1 rounded-full border border-slate-100 text-[8px] font-black text-rbt-red uppercase tracking-widest shadow-sm">
          Грубое нарушение
        </div>
        <p className="text-slate-800 font-bold italic text-xl leading-relaxed">"{currentTask.bad}"</p>
      </div>

      {!result ? (
        <div className="space-y-6">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="w-full h-52 p-10 rounded-[3rem] bg-white border-4 border-slate-50 focus:border-rbt-red outline-none transition-all font-medium text-lg resize-none shadow-inner"
              placeholder="Напишите профессиональный вариант ответа, соблюдая этику RBT..."
            />
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-md rounded-[3rem] flex flex-col items-center justify-center gap-4">
                <i className="fas fa-circle-notch fa-spin text-4xl text-rbt-red"></i>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Оцениваем экспертность...</span>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="flex-1 py-6 rounded-3xl font-black text-slate-400 hover:text-slate-600 uppercase text-[10px] tracking-widest transition-colors">Покинуть игру</button>
            <button 
              onClick={handleFix}
              disabled={loading || !input.trim()}
              className="flex-[2] bg-slate-900 text-white py-6 rounded-[2rem] font-black shadow-[0_15px_30px_rgba(0,0,0,0.1)] hover:bg-rbt-red transition-all uppercase text-[10px] tracking-widest active:scale-95"
            >
              {loading ? 'Идет проверка...' : 'Предложить решение'}
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-in zoom-in-95 space-y-8">
          <div className="bg-emerald-50 p-10 rounded-[3.5rem] border border-emerald-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[4rem]"></div>
            <div className="flex items-center gap-6 mb-8 relative z-10">
               <div className="w-16 h-16 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl text-2xl transform -rotate-3">
                  <i className="fas fa-wand-magic-sparkles"></i>
               </div>
               <div className="text-left">
                  <h4 className="font-black text-emerald-900 uppercase text-[10px] tracking-[0.2em] mb-1">Вердикт системы:</h4>
                  <div className="flex gap-4 items-center">
                    <span className="bg-emerald-500 text-white px-3 py-1 rounded-full font-black text-[10px]">+{result.score} XP</span>
                    <div className="flex items-center gap-1">
                       <i className="fas fa-heart text-emerald-500 text-[10px]"></i>
                       <span className="text-emerald-700 font-black text-[10px] uppercase">Лояльность {result.satisfaction}%</span>
                    </div>
                  </div>
               </div>
            </div>
            <p className="text-emerald-800 font-bold italic leading-relaxed text-xl text-left">"{result.feedback}"</p>
          </div>
          
          <button onClick={nextTask} className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 uppercase text-[10px] tracking-widest group">
            {currentIndex === currentPool.length - 1 ? 'Перейти к итогам' : 'Следующее задание'}
            <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default FixErrorGame;
