import React, { useState, useMemo } from 'react';
import { Star, ArrowRight, Database, Target, Heart, TrendingUp, Zap, Sparkles, AlertTriangle, BookOpen, RotateCcw, Copy, Check, Users, MessageSquare, Info, ShieldCheck } from 'lucide-react';

// 覚醒コスト設定
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
  const [charStones, setCharStones] = useState(0);
  const [universalStones, setUniversalStones] = useState(0);
  const [priorityMode, setPriorityMode] = useState('optimal'); 
  const [copied, setCopied] = useState(false);

  // リセット処理
  const handleReset = () => {
    setCurrentLevel(0);
    setTargetLevel(3);
    setCharStones(0);
    setUniversalStones(0);
    setPriorityMode('optimal');
  };

  // 計算ロジック
  const simulation = useMemo(() => {
    const relevantCosts = AWAKENING_COSTS.filter(
      (c) => c.from >= currentLevel && c.to <= targetLevel
    );
    if (relevantCosts.length === 0) return null;

    let bestResult = null;
    const n = relevantCosts.length;
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
            return (currentShortage * 10000000) + (actualUniFromStock * 10000) + (charStones - usedChar);
          } else {
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

  // 結果のコピー機能
  const copyToClipboard = () => {
    if (!simulation) return;
    const text = `【全日本KNM連合協会：（625-961-913）公式 覚醒計画】\n★${currentLevel}→★${targetLevel}\n不足万能石: ${simulation.shortage}個\n作戦: ${priorityMode === 'optimal' ? '固有優先' : '万能優先'}\n#キン肉マン #タッグ乱舞 #KNM連合協会`;
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
    document.body.removeChild(textArea);
  };

  const getProTip = () => {
    if (!simulation) return "まずは目標を設定してください。";
    if (simulation.shortage > 0) {
      return `あと ${simulation.shortage} 個の万能石があれば目標達成です。今すぐ交換所へ向かいましょう！`;
    }
    return "完璧なリソース管理です。お前の超人はリングで最強の輝きを放つでしょう！";
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 pb-20 overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-red-600 text-white px-3 py-3 sm:px-4 sm:py-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg flex-shrink-0">
            <Sparkles className="text-yellow-300 w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h1 className="text-sm sm:text-lg font-black italic tracking-tight text-white">全日本KNM連合協会公式覚醒計算機</h1>
        </div>
        <button onClick={handleReset} className="flex items-center gap-1 text-[10px] font-bold bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded-lg transition-colors border border-white/10">
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </header>

      <main className="max-w-md mx-auto p-3 sm:p-4 space-y-5 sm:space-y-6 mt-2">
        {/* レベル設定 */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-zinc-200 space-y-4">
          <div className="flex items-center gap-2 text-sm font-black text-zinc-700 uppercase tracking-tight">
            <Star size={16} className="text-orange-500" fill="currentColor" />
            <span>覚醒段階のシミュレーション</span>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-1.5">
              {[0, 1, 2, 3, 4, 5].map(lv => (
                <button key={lv} onClick={() => { setCurrentLevel(lv); if (targetLevel <= lv) setTargetLevel(Math.min(5, lv + 1)); }} 
                  className={`py-3 rounded-xl text-sm font-black transition-all ${currentLevel === lv ? 'bg-red-600 text-white shadow-lg scale-105 z-10' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'}`}>
                  ★{lv}
                </button>
              ))}
            </div>
            {/* 目標設定ボタン（★5まで選択可能に調整済み） */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar snap-x">
              {[1, 2, 3, 4, 5].filter(lv => lv > currentLevel).map(lv => (
                <button key={lv} onClick={() => setTargetLevel(lv)}
                  className={`flex-1 min-w-[75px] py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all border-2 snap-start ${targetLevel === lv ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300'}`}>
                  ★{lv}目標
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 石の入力 */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-zinc-200 grid grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <label className="text-[9px] sm:text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1 ml-1">
              <Database size={10} /> 所持：固有石
            </label>
            <input type="number" inputMode="numeric" value={charStones || ''} placeholder="0" onChange={(e) => setCharStones(Math.max(0, parseInt(e.target.value, 10) || 0))} 
              className="w-full p-4 bg-red-50/50 rounded-2xl text-2xl font-black text-red-700 outline-none border-2 border-transparent focus:border-red-400 text-center transition-all shadow-inner" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 ml-1">
              <Database size={10} /> 所持：万能石
            </label>
            <input type="number" inputMode="numeric" value={universalStones || ''} placeholder="0" onChange={(e) => setUniversalStones(Math.max(0, parseInt(e.target.value, 10) || 0))} 
              className="w-full p-4 bg-blue-50/50 rounded-2xl text-2xl font-black text-blue-700 outline-none border-2 border-transparent focus:border-blue-400 text-center transition-all shadow-inner" />
          </div>
        </section>

        {/* 作戦 */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
            <Target size={12} /> 適用する優先順位
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setPriorityMode('optimal')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${priorityMode === 'optimal' ? 'border-red-600 bg-white shadow-xl ring-4 ring-red-50' : 'border-zinc-100 bg-white opacity-60'}`}>
              <TrendingUp size={22} className={priorityMode === 'optimal' ? 'text-red-600' : 'text-zinc-300'} />
              <span className={`text-[10px] sm:text-xs font-black ${priorityMode === 'optimal' ? 'text-red-600' : 'text-zinc-400'}`}>節約：固有優先</span>
            </button>
            <button onClick={() => setPriorityMode('uni_priority')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${priorityMode === 'uni_priority' ? 'border-blue-600 bg-white shadow-xl ring-4 ring-blue-50' : 'border-zinc-100 bg-white opacity-60'}`}>
              <Heart size={22} className={priorityMode === 'uni_priority' ? 'text-blue-600' : 'text-zinc-300'} />
              <span className={`text-[10px] sm:text-xs font-black ${priorityMode === 'uni_priority' ? 'text-blue-600' : 'text-zinc-400'}`}>温存：万能優先</span>
            </button>
          </div>
        </section>

        {/* 不足数表示 */}
        {simulation && (
          <div className="space-y-3">
            <section className="bg-zinc-900 rounded-3xl p-6 text-white shadow-2xl border-b-[10px] border-orange-600 flex justify-between items-center relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-[9px] sm:text-[11px] font-black text-orange-500 tracking-[0.3em] uppercase opacity-90 mb-1">Shortage Analysis</p>
                <h3 className="text-base sm:text-xl font-black leading-none italic uppercase">不足している万能石</h3>
              </div>
              <div className="relative z-10 text-right">
                <p className="text-5xl sm:text-7xl font-black text-orange-500 leading-none drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]">{simulation.shortage}</p>
              </div>
              <AlertTriangle className="absolute -left-4 -bottom-4 text-white/5 rotate-12 w-32 h-32 group-hover:scale-110 transition-transform duration-700" />
            </section>
            <button onClick={copyToClipboard} className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-black text-xs transition-all ${copied ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'コピー完了！' : '計画をコピーする'}
            </button>
          </div>
        )}

        {/* 内訳 */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-zinc-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-zinc-400 flex items-center gap-2 uppercase tracking-widest"><BookOpen size={12} className="text-red-500" /> 覚醒ルート詳細</h3>
          </div>
          <div className="space-y-2.5">
            {simulation?.steps.map((step, idx) => (
              <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border-l-8 transition-all shadow-sm ${step.method === 'char' ? 'bg-red-50/50 border-red-500' : 'bg-blue-50/50 border-blue-500'}`}>
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[32px]">
                    <span className="text-[8px] text-zinc-400 font-bold block opacity-60">★{step.from}</span>
                    <ArrowRight size={10} className="mx-auto my-0.5 text-zinc-300" />
                    <span className="text-sm text-zinc-900 font-black block">★{step.to}</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-zinc-800 leading-tight">{step.label}</p>
                    <p className="text-[10px] text-zinc-500 font-bold mt-0.5">必要数: {step.cost}</p>
                  </div>
                </div>
                <div className={`text-[10px] font-black px-3 py-1.5 rounded-xl shadow-sm border ${step.method === 'char' ? 'bg-red-600 border-red-700 text-white' : 'bg-blue-600 border-blue-700 text-white'}`}>{step.method === 'char' ? '固有石' : '万能石'}</div>
              </div>
            ))}
          </div>
        </section>

        {/* セコンドからの声 */}
        <section className="bg-zinc-900 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden border-2 border-red-600/30">
          <div className="flex gap-4 relative z-10 items-start">
            <div className="bg-red-600 p-2.5 rounded-2xl shadow-lg flex-shrink-0">
              <Zap size={20} fill="white" className="text-white" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black text-red-500 tracking-[0.2em] uppercase leading-none">セコンドからの声</h4>
              <p className="text-[11px] sm:text-xs leading-relaxed text-zinc-200 font-medium italic">「{getProTip()}」</p>
            </div>
          </div>
        </section>

        {/* ギルド募集 */}
        <section className="bg-white rounded-3xl shadow-lg border border-zinc-200 overflow-hidden">
          <div className="bg-zinc-100 px-5 py-4 border-b border-zinc-200 flex items-center gap-2">
            <Users className="text-red-600" size={18} />
            <h4 className="text-sm font-black text-zinc-800 italic uppercase tracking-tighter">公式お知らせ & ギルド募集</h4>
          </div>
          
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-red-600" size={20} />
              <h5 className="font-black text-zinc-800 text-sm italic uppercase tracking-tight text-balance">全日本KNM連合協会：（625-961-913）</h5>
            </div>
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-3">
              <p className="text-xs font-black text-zinc-400 italic">☆補足☆</p>
              <p className="text-xs leading-relaxed font-bold text-zinc-700">キン肉マン極タッグ乱舞アプリゲーム<br />ギルド：<span className="text-red-600">「全日本KNM連合協会：（625-961-913）」</span>は、軍団員募集してます。</p>
              <p className="text-[11px] leading-relaxed text-zinc-600 font-medium">毎日軍団フラッグしっかり回収！わからないことがあってもDiscordで仲間がサポート。仲良く楽しく強くなりましょう。ご参加お待ちしてます！</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl text-white">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 p-2 rounded-xl"><MessageSquare size={16} /></div>
                <div>
                  <p className="text-[9px] font-black text-zinc-400 tracking-widest uppercase">軍団長</p>
                  <p className="text-sm font-black text-white">たけぷりお</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-zinc-400 tracking-widest uppercase">Discord</p>
                <p className="text-xs font-black text-red-500">@takexchan</p>
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
              <AlertTriangle className="text-orange-500 mt-0.5 shrink-0" size={16} />
              <p className="text-[10px] leading-relaxed font-bold text-orange-700">軍団員が飽和してなければ、予約１位～５位まで受付いたします。Discordでメッセージください。</p>
            </div>
          </div>
        </section>

        {/* マニュアル */}
        <section className="bg-white rounded-3xl shadow-xl border-t-4 border-red-600 overflow-hidden">
          <div className="bg-red-600 px-5 py-4 flex items-center gap-2">
            <BookOpen className="text-white" size={20} />
            <h4 className="text-sm font-black text-white italic uppercase tracking-wider">覚醒計算機☆完全マニュアル☆</h4>
          </div>
          <div className="p-6 space-y-6 text-zinc-600">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-xs shrink-0">1</div>
              <div>
                <p className="text-xs font-black text-zinc-800 mb-1">レベル（★）を設定する</p>
                <p className="text-[10px] leading-relaxed">今のレベルと、目標レベルをタップしてください。★3を目指すのが定石です。</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-xs shrink-0">2</div>
              <div>
                <p className="text-xs font-black text-zinc-800 mb-1">手持ちの石を入力する</p>
                <p className="text-[10px] leading-relaxed">「固有石」と「万能石」の所持数を入力してください。リアルタイムに不足数が計算されます。</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-xs shrink-0">3</div>
              <div>
                <p className="text-xs font-black text-zinc-800 mb-1">優先戦略を選択する</p>
                <p className="text-[10px] leading-relaxed">「固有優先（節約）」か「万能優先（温存）」を選びます。基本は固有優先がおすすめです。</p>
              </div>
            </div>
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              <div className="flex items-center gap-2 mb-2">
                <Info size={14} className="text-blue-500" />
                <p className="text-[10px] font-black text-zinc-700 uppercase">便利な機能</p>
              </div>
              <ul className="text-[10px] space-y-1 ml-4 list-disc font-medium">
                <li>「計画をコピーする」で、Discordに結果を貼れます。</li>
                <li>「Reset」ボタンで最初からやり直せます。</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-md mx-auto p-6 text-center">
        <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest italic">Official Strategic Tool for All Japan KNM Alliance</p>
      </footer>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
};

export default App;
