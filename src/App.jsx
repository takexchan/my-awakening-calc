import React, { useState, useMemo } from 'react';
import { Star, Info, AlertTriangle, ArrowRight, ShieldCheck, Zap, Sparkles, Database, BookOpen, Target, Heart, TrendingUp, MessageSquareQuote, Loader2, User } from 'lucide-react';

const AWAKENING_COSTS = [
  { from: 0, to: 1, cost: 50, label: "★1解放" },
  { from: 1, to: 2, cost: 70, label: "★2強化" },
  { from: 2, to: 3, cost: 100, label: "★3必殺技強化" },
  { from: 3, to: 4, cost: 140, label: "★4強化" },
  { from: 4, to: 5, cost: 200, label: "★5完凸" },
];

const App = () => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [targetLevel, setTargetLevel] = useState(3);
  const [charStones, setCharStones] = useState(90);
  const [universalStones, setUniversalStones] = useState(0);
  const [priorityMode, setPriorityMode] = useState('optimal'); // 'optimal' or 'uni_priority'
  
  // AI related states
  const [charName, setCharName] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const simulation = useMemo(() => {
    const relevantCosts = AWAKENING_COSTS.filter(
      (c) => c.from >= currentLevel && c.to <= targetLevel
    );

    if (relevantCosts.length === 0) return null;

    let bestResult = null;
    const n = relevantCosts.length;

    // 2^nパターンの全探索で最適解を導出
    for (let i = 0; i < (1 << n); i++) {
      let usedChar = 0;
      let usedUni = 0;
      const currentSteps = [];

      for (let j = 0; j < n; j++) {
        const cost = relevantCosts[j].cost;
        const useChar = (i >> j) & 1;

        if (useChar) {
          usedChar += cost;
          currentSteps.push({ ...relevantCosts[j], method: 'char' });
        } else {
          usedUni += cost;
          currentSteps.push({ ...relevantCosts[j], method: 'uni' });
        }
      }

      const isCharPossible = usedChar <= charStones;
      const actualUniFromStock = Math.min(usedUni, universalStones);
      const currentShortage = Math.max(0, usedUni - universalStones);

      if (isCharPossible) {
        const getScore = () => {
          if (priorityMode === 'optimal') {
            // 最適化: 不足最小 > 万能消費最小 > 固有余り最小
            return (currentShortage * 10000000) + (actualUniFromStock * 10000) + (charStones - usedChar);
          } else {
            // 温存: 不足最小 > 固有消費最小 > 万能消費最大
            return (currentShortage * 10000000) + (usedChar * 10000) + (universalStones - actualUniFromStock);
          }
        };

        const currentScore = getScore();

        if (!bestResult || currentScore < bestResult.scoreValue) {
          bestResult = {
            steps: currentSteps,
            totalCharUsed: usedChar,
            totalUniNeeded: usedUni,
            actualUniFromStock: actualUniFromStock,
            shortage: currentShortage,
            remainingChar: charStones - usedChar,
            remainingUni: Math.max(0, universalStones - usedUni),
            scoreValue: currentScore
          };
        }
      }
    }

    return bestResult;
  }, [currentLevel, targetLevel, charStones, universalStones, priorityMode]);

  // Gemini APIを使用したAI相談機能
  const askAI = async () => {
    if (!charName) return;
    setIsAiLoading(true);
    const apiKey = ""; // 実行環境から提供される
    
    const systemPrompt = `あなたは『キン肉マン 極・タッグ乱舞』のトップランカー軍師「たけぷり」です。分析的、論理的、かつ情熱的な口調で、ユーザーの覚醒計画にアドバイスしてください。
    口癖は「この編成の肝は…」「リソースを集中すべきは…」「環境的に見て…」です。
    ユーザーの現在の計画：超人「${charName}」を★${currentLevel}から★${targetLevel}へ覚醒させようとしています。
    計算上の不足：万能石が${simulation?.shortage}個不足しています。
    現在の上位メタを考慮した「たけぷりAI軍師」としてのアドバイスを150文字程度で簡潔に返してください。`;

    const userQuery = `軍師、私の「${charName}」の覚醒計画を診断してください。`;

    const fetchWithRetry = async (retries = 5, delay = 1000) => {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      } catch (error) {
        if (retries > 0) {
          await new Promise(res => setTimeout(res, delay));
          return fetchWithRetry(retries - 1, delay * 2);
        }
        throw error;
      }
    };

    try {
      const result = await fetchWithRetry();
      setAiAnalysis(result);
    } catch (error) {
      setAiAnalysis("エラーが発生した。通信環境を確認するか、後でもう一度相談に来い。");
    } finally {
      setIsAiLoading(false);
    }
  };

  const getProTip = () => {
    if (!simulation) return "まずは目標を設定してくれ。";
    if (simulation.shortage > 0) {
      return `あと ${simulation.shortage} 個の万能石があれば目標達成だ。今すぐ交換所へ向かえ！`;
    }
    return "完璧なリソース管理だ。お前の超人はリングで最強の輝きを放つだろう！";
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 pb-12">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-red-600 text-white px-4 py-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Sparkles className="text-yellow-300" size={20} />
          </div>
          <h1 className="text-lg font-bold italic leading-none">たけぷりAI軍師の相談所</h1>
        </div>
        <div className="text-[10px] font-black bg-black/20 px-2 py-1 rounded border border-white/20 uppercase tracking-widest">AI Strategist v4.2</div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6 mt-2">
        
        {/* Quick Guide Panel */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-zinc-400" />
            <span className="text-xs font-black text-zinc-400 tracking-widest uppercase italic">Strategy Flow</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 px-2">
            <div className="flex flex-col items-center gap-1"><div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">1</div>★設定</div>
            <ArrowRight size={14} className="text-zinc-300" />
            <div className="flex flex-col items-center gap-1"><div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">2</div>石入力</div>
            <ArrowRight size={14} className="text-zinc-300" />
            <div className="flex flex-col items-center gap-1"><div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">3</div>軍師相談</div>
          </div>
        </section>

        {/* Level Configuration */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
            <Star size={18} className="text-orange-400" fill="currentColor" />
            <span>覚醒段階を設定</span>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 5].map(lv => (
                <button 
                  key={lv} 
                  onClick={() => {
                    setCurrentLevel(lv);
                    if (targetLevel <= lv) setTargetLevel(Math.min(5, lv + 1));
                  }} 
                  className={`py-3 rounded-xl text-sm font-black transition-all ${currentLevel === lv ? 'bg-red-600 text-white shadow-md scale-105' : 'bg-zinc-100 text-zinc-400'}`}
                >
                  {lv}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[1, 2, 3, 4, 5].filter(lv => lv > currentLevel).map(lv => (
                <button 
                  key={lv} 
                  onClick={() => setTargetLevel(lv)}
                  className={`flex-1 min-w-[70px] py-2 rounded-xl text-xs font-bold transition-all border-2 ${targetLevel === lv ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' : 'bg-white border-zinc-200 text-zinc-400'}`}
                >
                  ★{lv}目標
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Stone Inputs */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 ml-1">
              <Database size={12} /> 所持：固有石
            </label>
            <input 
              type="number" 
              inputMode="numeric"
              value={charStones === 0 ? '' : charStones} 
              placeholder="0"
              onChange={(e) => setCharStones(parseInt(e.target.value, 10) || 0)} 
              className="w-full p-4 bg-red-50 rounded-2xl text-2xl font-black text-red-700 outline-none border-2 border-transparent focus:border-red-300 text-center transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1 ml-1">
              <Database size={12} /> 所持：万能石
            </label>
            <input 
              type="number" 
              inputMode="numeric"
              value={universalStones === 0 ? '' : universalStones} 
              placeholder="0"
              onChange={(e) => setUniversalStones(parseInt(e.target.value, 10) || 0)} 
              className="w-full p-4 bg-blue-50 rounded-2xl text-2xl font-black text-blue-700 outline-none border-2 border-transparent focus:border-blue-300 text-center transition-all"
            />
          </div>
        </section>

        {/* Strategy Plan Switch */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">
            <Target size={14} /> 適用する作戦
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setPriorityMode('optimal')} 
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${priorityMode === 'optimal' ? 'border-red-600 bg-white shadow-md ring-4 ring-red-50' : 'border-zinc-200 bg-white'}`}
            >
              <TrendingUp size={24} className={priorityMode === 'optimal' ? 'text-red-600' : 'text-zinc-300'} />
              <span className={`text-xs font-black ${priorityMode === 'optimal' ? 'text-red-600' : 'text-zinc-400'}`}>節約：固有優先</span>
            </button>
            <button 
              onClick={() => setPriorityMode('uni_priority')} 
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${priorityMode === 'uni_priority' ? 'border-blue-600 bg-white shadow-md ring-4 ring-blue-50' : 'border-zinc-200 bg-white'}`}
            >
              <Heart size={24} className={priorityMode === 'uni_priority' ? 'text-blue-600' : 'text-zinc-300'} />
              <span className={`text-xs font-black ${priorityMode === 'uni_priority' ? 'text-blue-600' : 'text-zinc-400'}`}>温存：万能優先</span>
            </button>
          </div>
        </section>

        {/* Shortage Panel */}
        {simulation && (
          <section className="bg-zinc-900 rounded-3xl p-6 text-white shadow-xl border-b-8 border-orange-600 flex justify-between items-center relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-orange-500 tracking-[0.4em] uppercase opacity-80 mb-1">Shortage</p>
              <h3 className="text-lg font-black leading-none italic uppercase">不足している万能石</h3>
            </div>
            <div className="relative z-10 text-right">
              <p className="text-6xl font-black text-orange-500 leading-none">{simulation.shortage}</p>
            </div>
            <AlertTriangle className="absolute -left-6 -bottom-6 text-white/5 rotate-12" size={120} />
          </section>
        )}

        {/* Route Breakdown */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-zinc-400 flex items-center gap-2 uppercase tracking-widest"><Zap size={14} className="text-yellow-500" /> ルート内訳</h3>
            <span className="text-[9px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded font-bold italic">Generated Logic</span>
          </div>
          <div className="space-y-2">
            {simulation?.steps.map((step, idx) => (
              <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border-l-8 transition-all ${step.method === 'char' ? 'bg-red-50/40 border-red-500' : 'bg-blue-50/40 border-blue-500'}`}>
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[36px]">
                    <span className="text-[9px] text-zinc-400 font-bold block mb-1">★{step.from}</span>
                    <ArrowRight size={10} className="mx-auto text-zinc-300" />
                    <span className="text-sm text-zinc-900 font-black block mt-1">★{step.to}</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-zinc-800 leading-tight">{step.label}</p>
                    <p className="text-[10px] text-zinc-500 font-bold">コスト: {step.cost}</p>
                  </div>
                </div>
                <div className={`text-[10px] font-black px-3 py-1.5 rounded-xl shadow-sm ${step.method === 'char' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                  {step.method === 'char' ? '固有石' : '万能石'}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-100">
            <div className="bg-zinc-50 rounded-xl p-3 text-center border border-zinc-100">
              <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">固有残り</p>
              <p className="text-xl font-black text-red-600">{simulation?.remainingChar || 0}</p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-3 text-center border border-zinc-100">
              <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">万能残り</p>
              <p className="text-xl font-black text-blue-600">{simulation?.remainingUni || 0}</p>
            </div>
          </div>
        </section>

        {/* Quick Advice Bar */}
        <section className="bg-zinc-900 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="flex gap-4 relative z-10 items-start">
            <div className="bg-red-600 p-2.5 rounded-2xl shadow-lg flex-shrink-0 animate-pulse">
              <Star size={20} fill="white" className="text-white" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-black text-red-500 tracking-[0.2em] uppercase leading-none mb-1">たけぷりの助言</h4>
              <p className="text-xs leading-relaxed text-zinc-200 font-medium italic">
                「{getProTip()}」
              </p>
            </div>
          </div>
        </section>

        {/* ✨ たけぷりAI軍師の戦略相談 ✨ */}
        <section className="bg-white rounded-[2rem] p-1.5 shadow-2xl border-2 border-red-500/20 overflow-hidden">
          <div className="p-5 bg-red-50/50 border-b border-red-100 flex items-center justify-between rounded-t-[1.8rem]">
            <div className="flex items-center gap-2">
              <Sparkles className="text-red-600" size={20} />
              <span className="text-base font-black text-red-700 italic tracking-tighter">たけぷりAI軍師の戦略相談</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
          </div>
          
          <div className="p-6 space-y-6 bg-white">
            <div className="space-y-3">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                <User size={16} className="text-red-500" /> 覚醒させたい超人の名前を記入
              </label>
              <input 
                type="text" 
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                placeholder="例: 悪魔将軍"
                className="w-full p-5 bg-zinc-50 rounded-[1.5rem] text-lg font-black outline-none border-2 border-zinc-100 focus:border-red-500 transition-all shadow-inner placeholder:text-zinc-300"
              />
              {!charName && <p className="text-[10px] text-red-500 font-black ml-1 animate-pulse italic">※診断には超人名が必要です</p>}
            </div>

            <button 
              onClick={askAI}
              disabled={!charName || isAiLoading}
              className={`w-full py-5 rounded-[1.5rem] flex items-center justify-center gap-3 font-black text-base transition-all shadow-xl active:scale-95 ${!charName || isAiLoading ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed shadow-none' : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-red-200'}`}
            >
              {isAiLoading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <MessageSquareQuote size={24} />
              )}
              軍師に最終診断を仰ぐ
            </button>
            
            {aiAnalysis && !isAiLoading && (
              <div className="mt-4 p-6 bg-zinc-900 rounded-[1.5rem] border-2 border-red-600/30 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-0.5 w-6 bg-red-600"></div>
                  <span className="text-[10px] font-black text-red-500 tracking-[0.4em] uppercase">Tactical Intelligence Report</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-100 font-medium italic relative z-10 selection:bg-red-500 selection:text-white">
                  {aiAnalysis}
                </p>
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Sparkles size={100} />
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        ::selection { background: #fee2e2; color: #991b1b; }
      `}</style>
    </div>
  );
};

export default App;