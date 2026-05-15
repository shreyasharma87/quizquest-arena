import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Heart, Coins, Flame, ShieldAlert, AlertTriangle, Shield, Snowflake, Bomb, Magnet, Zap, Check, MessageSquare, Send } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PowerupType } from '../../../shared/types';

const MEMORY_COLORS = [
  { base: 'bg-danger', active: 'bg-danger shadow-[0_0_50px_rgba(255,65,54,0.8)] scale-110', inactive: 'bg-danger/20 border-2 border-danger/50' },
  { base: 'bg-success', active: 'bg-success shadow-[0_0_50px_rgba(46,204,64,0.8)] scale-110', inactive: 'bg-success/20 border-2 border-success/50' },
  { base: 'bg-warning', active: 'bg-warning shadow-[0_0_50px_rgba(255,220,0,0.8)] scale-110', inactive: 'bg-warning/20 border-2 border-warning/50' },
  { base: 'bg-primary', active: 'bg-primary shadow-[0_0_50px_rgba(102,252,241,0.8)] scale-110', inactive: 'bg-primary/20 border-2 border-primary/50' }
];

export default function LiveGame() {
  const { room, me, timer, submitAnswer, reportSuspicious, cheatWarning, clearWarning, toggleReady, sendChatMessage } = useGameStore();

  const [textAnswer, setTextAnswer] = useState('');
  const [clickScore, setClickScore] = useState(0);

  const [typingInput, setTypingInput] = useState('');
  const typingPrompt = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG IN THE CYBER ARENA.";
  
  const [reactionState, setReactionState] = useState<'waiting' | 'ready' | 'clicked' | 'early'>('waiting');
  const [reactionStart, setReactionStart] = useState(0);

  const [mathA, setMathA] = useState(0);
  const [mathB, setMathB] = useState(0);
  const [mathOp, setMathOp] = useState('+');
  const [mathInput, setMathInput] = useState('');

  const [targetPos, setTargetPos] = useState({ top: '50%', left: '50%' });

  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [showingSeq, setShowingSeq] = useState(false);
  const [activeSeqIdx, setActiveSeqIdx] = useState(-1);

  const [targetingPowerup, setTargetingPowerup] = useState<PowerupType | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
       if (me?.activeEffects.frozenUntil) {
          setIsFrozen(Date.now() < me.activeEffects.frozenUntil);
       } else {
          setIsFrozen(false);
       }
    }, 100);
    return () => clearInterval(interval);
  }, [me?.activeEffects.frozenUntil]);

  const handlePowerupClick = (p: PowerupType) => {
    if (p === 'shield' || p === 'double_points') {
       useGameStore.getState().usePowerup(p);
    } else {
       setTargetingPowerup(p); 
    }
  };

  const executeTargetedPowerup = (targetId: string) => {
    if (targetingPowerup) {
      useGameStore.getState().usePowerup(targetingPowerup, targetId);
      setTargetingPowerup(null);
    }
  };

  useEffect(() => {
    setTextAnswer('');
    setClickScore(0);
    setTypingInput('');
    setReactionState('waiting');
    setMathInput('');
    setSequence([]);
    setPlayerSeq([]);
    setShowingSeq(false);

    const currentQ = room?.settings.gameMode === 'assignment' ? room?.questions[me?.currentQuestionIndex || 0] : room?.questions[room.gameState.currentQuestionIndex];
    if (currentQ?.type === 'minigame') {
      if (currentQ.minigameType === 'math_blitz') generateMath();
      if (currentQ.minigameType === 'target_smash') moveTarget();
      if (currentQ.minigameType === 'reaction') {
        const delay = Math.random() * 3000 + 2000;
        const t = setTimeout(() => {
          setReactionState('ready');
          setReactionStart(Date.now());
        }, delay);
        return () => clearTimeout(t);
      }
      if (currentQ.minigameType === 'memory_sequence') {
        setTimeout(() => startNewSequence(1), 1000);
      }
    }
  }, [room?.gameState.currentQuestionIndex, me?.currentQuestionIndex, room?.questions, room?.settings.gameMode]);

  const generateMath = () => {
    setMathA(Math.floor(Math.random() * 20) + 1);
    setMathB(Math.floor(Math.random() * 20) + 1);
    setMathOp(Math.random() > 0.5 ? '+' : '-');
    setMathInput('');
  };

  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correct = mathOp === '+' ? mathA + mathB : mathA - mathB;
    if (parseInt(mathInput) === correct) {
      setClickScore(s => s + 1);
      generateMath();
    } else {
      setMathInput('');
    }
  };

  const moveTarget = () => {
    setTargetPos({ top: `${Math.floor(Math.random() * 80) + 10}%`, left: `${Math.floor(Math.random() * 80) + 10}%` });
  };

  const handleReactionClick = () => {
    if (reactionState === 'waiting') {
      setReactionState('early');
      setClickScore(0);
    } else if (reactionState === 'ready') {
      setReactionState('clicked');
      const timeMs = Date.now() - reactionStart;
      setClickScore(Math.max(1, 100 - Math.floor(timeMs / 10)));
    }
  };

  const startNewSequence = (length: number) => {
    const seq = Array.from({length}, () => Math.floor(Math.random() * 4));
    setSequence(seq);
    setPlayerSeq([]);
    setShowingSeq(true);
    let i = 0;
    const interval = setInterval(() => {
      setActiveSeqIdx(seq[i]);
      setTimeout(() => setActiveSeqIdx(-1), 400);
      i++;
      if (i >= seq.length) {
        clearInterval(interval);
        setShowingSeq(false);
      }
    }, 800);
  };

  const handleMemoryClick = (idx: number) => {
    if (showingSeq) return;
    const newSeq = [...playerSeq, idx];
    setPlayerSeq(newSeq);
    
    if (sequence[newSeq.length - 1] !== idx) {
      setPlayerSeq([]);
      setShowingSeq(true);
      let i = 0;
      const interval = setInterval(() => {
        setActiveSeqIdx(sequence[i]);
        setTimeout(() => setActiveSeqIdx(-1), 400);
        i++;
        if (i >= sequence.length) {
          clearInterval(interval);
          setShowingSeq(false);
        }
      }, 800);
    } else if (newSeq.length === sequence.length) {
      setClickScore(s => s + 1);
      setTimeout(() => startNewSequence(sequence.length + 1), 800);
    }
  };

  useEffect(() => {
    const currentQ = room?.settings.gameMode === 'assignment' ? room?.questions[me?.currentQuestionIndex || 0] : room?.questions[room.gameState.currentQuestionIndex];
    if (currentQ?.minigameType === 'typing_race') {
      let correctChars = 0;
      for (let i=0; i<typingInput.length; i++) {
        if (typingInput[i] === typingPrompt[i]) correctChars++;
      }
      setClickScore(correctChars);
    }
  }, [typingInput, room?.gameState.currentQuestionIndex, me?.currentQuestionIndex, room?.questions, room?.settings.gameMode]);

  useEffect(() => {
    if (room?.settings.gameMode === 'live') {
      const currentQ = room?.questions[room.gameState.currentQuestionIndex];
      if (timer === 1 && currentQ?.type === 'minigame' && !me?.hasAnswered) {
        submitAnswer({ questionIndex: room.gameState.currentQuestionIndex, minigameScore: clickScore });
      }
    }
  }, [timer, room?.gameState.currentQuestionIndex, room?.questions, me?.hasAnswered, clickScore, submitAnswer, room?.settings.gameMode]);

  useEffect(() => {
    if (!room?.settings.antiCheatEnabled || room.gameState.status !== 'question') return;
    const handleBlur = () => reportSuspicious('blur', 'Player switched tabs or minimized browser');
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [room?.settings.antiCheatEnabled, room?.gameState.status, reportSuspicious]);

  if (!room || !me) return <Navigate to="/" />;
  const { gameState, questions, settings } = room;

  const isAssignmentExpired = settings.gameMode === 'assignment' && settings.assignmentDeadline && Date.now() > settings.assignmentDeadline;

  // --- RENDERING VIEWS ---

  const renderPausedOverlay = () => (
    <AnimatePresence>
      {gameState.isPaused && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[50] bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center">
          <ShieldAlert className="w-24 h-24 text-warning mb-6 animate-pulse" />
          <h1 className="text-5xl font-black text-white tracking-widest mb-4">MATCH PAUSED</h1>
          <p className="text-xl text-accent font-mono">The host has temporarily frozen the arena.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderLobby = () => {
    const playersList = Object.values(room.players).filter(p => p.role !== 'host');
    return (
      <div className="flex-1 flex gap-6 p-6 h-screen overflow-hidden max-w-7xl mx-auto w-full">
        <div className="flex-[3] flex flex-col bg-paper/50 rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary"/>
           
           <div className="flex justify-between items-start mb-8">
             <div>
               <h1 className="text-5xl font-black font-display uppercase tracking-widest text-white mb-2">ARENA LOBBY</h1>
               <div className="text-xl text-accent font-mono">
                 {settings.gameMode === 'assignment' ? 'Complete the assignment before the deadline.' : 'Waiting for Host to start the match...'}
               </div>
             </div>
             <div className="flex flex-col gap-2 items-end">
               <div className="bg-primary/20 border-2 border-primary text-primary px-4 py-2 rounded-xl font-black uppercase tracking-widest text-sm">
                 {settings.gameMode === 'assignment' ? 'ASSIGNMENT MODE' : 'LIVE GAME MODE'}
               </div>
               {settings.gameMode === 'assignment' && settings.assignmentDeadline && (
                 <div className={`border-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-sm ${isAssignmentExpired ? 'bg-danger/20 border-danger text-danger' : 'bg-warning/20 border-warning text-warning'}`}>
                   DUE: {new Date(settings.assignmentDeadline).toLocaleString()}
                 </div>
               )}
               {room.settings.teamMode && (
                 <div className="bg-primary/20 border-2 border-primary text-primary px-4 py-2 rounded-xl font-black uppercase tracking-widest text-sm">
                   TEAM MODE ENABLED
                 </div>
               )}
             </div>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-4 content-start flex-1">
              {playersList.map(p => {
                const teamColor = p.team === 'ALPHA' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 
                                  p.team === 'BRAVO' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 
                                  p.team === 'CHARLIE' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
                                  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
                
                return (
                 <motion.div initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} key={p.id} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${p.isReady ? 'bg-success/20 border-success shadow-[0_0_15px_rgba(46,204,64,0.3)]' : 'bg-background/50 border-white/10'}`}>
                    <div className="relative w-16 h-16 mb-3">
                       {p.avatarUrl ? (
                         <img src={p.avatarUrl} alt={p.username} className="w-full h-full rounded-full bg-secondary object-cover" />
                       ) : (
                         <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-white relative">
                            {p.username.charAt(0).toUpperCase()}
                         </div>
                       )}
                       {p.isReady && <div className="absolute -bottom-1 -right-1 bg-success text-background rounded-full p-1 z-10"><Check className="w-4 h-4"/></div>}
                    </div>
                    <div className="font-bold text-lg text-center truncate w-full">{p.username}</div>
                    
                    {room.settings.teamMode && p.team ? (
                      <div className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${teamColor}`}>
                         {p.team}
                      </div>
                    ) : (
                      <div className={`text-xs font-black uppercase tracking-widest ${p.isReady ? 'text-success' : 'text-warning'}`}>{p.isReady ? 'READY' : 'NOT READY'}</div>
                    )}
                 </motion.div>
                )
              })}
              {playersList.length === 0 && <div className="col-span-full text-center text-accent text-xl mt-10">You are alone in the lobby.</div>}
           </div>

           <div className="mt-8 pt-8 border-t border-white/10 flex justify-center">
              <button disabled={isAssignmentExpired} onClick={toggleReady} className={`px-12 py-5 rounded-2xl font-black text-2xl tracking-widest transition-all ${isAssignmentExpired ? 'bg-paper border-2 border-danger text-danger opacity-50 cursor-not-allowed' : me.isReady ? 'bg-background border-2 border-success text-success' : 'bg-primary text-background hover:bg-primary/90 shadow-[0_0_30px_rgba(102,252,241,0.4)]'}`}>
                 {isAssignmentExpired ? 'DEADLINE PASSED' : me.isReady ? 'CANCEL READY' : 'CLICK TO READY UP'}
              </button>
           </div>
        </div>

        <div className="flex-[1.5] flex flex-col bg-background/80 rounded-3xl border border-white/10 p-6 shadow-2xl relative overflow-hidden">
           <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><MessageSquare className="w-6 h-6 text-primary"/> LIVE CHAT</h3>
           <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 mb-4">
              {room.chatMessages.map(msg => (
                 <div key={msg.id} className={`p-3 rounded-xl max-w-[90%] ${msg.senderId === me.id ? 'bg-primary/20 border border-primary/30 self-end rounded-tr-sm' : msg.isSystem ? 'bg-warning/10 border border-warning/30 self-center text-center w-full text-warning text-sm' : 'bg-paper border border-white/5 self-start rounded-tl-sm'}`}>
                    {!msg.isSystem && msg.senderId !== me.id && <div className="text-xs font-bold text-accent mb-1">{msg.senderName}</div>}
                    <div className="text-sm font-medium">{msg.text}</div>
                 </div>
              ))}
           </div>
           <form onSubmit={(e) => { e.preventDefault(); const t = e.currentTarget.chat.value; if(t.trim()){ sendChatMessage(t); e.currentTarget.reset(); } }} className="flex gap-2">
              <input name="chat" type="text" placeholder="Type a message..." maxLength={100} autoComplete="off" className="flex-1 bg-paper border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors"/>
              <button type="submit" className="bg-primary/20 text-primary border border-primary/50 p-3 rounded-xl hover:bg-primary/40"><Send className="w-5 h-5"/></button>
           </form>
        </div>
      </div>
    );
  };

  if (gameState.status === 'waiting') {
    return renderLobby();
  }

  if (isAssignmentExpired) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {renderPausedOverlay()}
        <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-paper border border-danger/50 p-12 rounded-3xl shadow-2xl max-w-2xl w-full">
          <AlertTriangle className="w-24 h-24 text-danger mx-auto mb-6 bg-danger/20 p-4 rounded-full border-4 border-danger/50"/>
          <h2 className="text-5xl font-black text-danger mb-6 uppercase tracking-widest">DEADLINE PASSED</h2>
          <p className="text-xl text-accent mb-8">This assignment is no longer accepting submissions.</p>
          <div className="text-3xl font-mono text-primary font-black border-2 border-primary/50 p-6 rounded-2xl bg-primary/10">
            FINAL SCORE: {me.score}
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState.status === 'starting') {
    return (
      <div className="flex-1 flex items-center justify-center flex-col text-center relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"/>
        {renderPausedOverlay()}
        
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="z-10">
           <h1 className="text-6xl md:text-8xl font-display font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary uppercase tracking-[0.2em] drop-shadow-[0_0_30px_rgba(102,252,241,0.5)]">
             Prepare for Battle
           </h1>
           <p className="text-2xl text-accent font-mono tracking-widest uppercase">{settings.gameMode === 'assignment' ? 'Your Assignment Begins In...' : 'The Arena opens in...'}</p>
        </motion.div>

        <motion.div key={timer} initial={{ scale: 2, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', bounce: 0.5 }} className="text-[15rem] font-black text-white leading-none mt-12 drop-shadow-[0_0_50px_rgba(255,255,255,0.5)] z-10 relative">
           {timer}
           <span className="absolute inset-0 text-primary blur-2xl -z-10 opacity-50">{timer}</span>
        </motion.div>
      </div>
    );
  }

  if (settings.gameMode === 'assignment' && me.assignmentFinished) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {renderPausedOverlay()}
        <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-paper border border-white/10 p-12 rounded-3xl shadow-2xl max-w-2xl w-full">
          <Check className="w-24 h-24 text-success mx-auto mb-6 bg-success/20 p-4 rounded-full border-4 border-success/50"/>
          <h2 className="text-5xl font-black text-white mb-6 uppercase tracking-widest">ASSIGNMENT COMPLETE!</h2>
          <p className="text-xl text-accent mb-8">You have answered all questions. The host will reveal the final standings when the assignment is closed.</p>
          <div className="text-5xl font-mono text-primary font-black border-2 border-primary/50 p-8 rounded-2xl bg-primary/10 shadow-[0_0_30px_rgba(102,252,241,0.2)]">
            FINAL SCORE: {me.score}
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState.status === 'leaderboard' || gameState.status === 'finished') {
    const players = Object.values(room.players).filter(p => p.role !== 'host');
    
    if (room.settings.teamMode) {
      const teams: Record<string, { score: number, members: string[] }> = {};
      players.forEach(p => {
         if (!p.team) return;
         if (!teams[p.team]) teams[p.team] = { score: 0, members: [] };
         teams[p.team].score += p.score;
         teams[p.team].members.push(p.username);
      });
      
      const sortedTeams = Object.entries(teams).sort((a, b) => b[1].score - a[1].score);

      return (
        <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full pt-12 pb-32">
          {renderPausedOverlay()}
          <h2 className="text-5xl font-display font-black text-center mb-12 text-primary">{gameState.status === 'finished' ? 'FINAL TEAM STANDINGS' : 'LIVE TEAM LEADERBOARD'}</h2>
          <div className="flex flex-col gap-6">
            {sortedTeams.map(([teamName, data], index) => {
              const teamColor = teamName === 'ALPHA' ? 'text-red-400 border-red-500/50 bg-red-500/10' : teamName === 'BRAVO' ? 'text-blue-400 border-blue-500/50 bg-blue-500/10' : teamName === 'CHARLIE' ? 'text-green-400 border-green-500/50 bg-green-500/10' : 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
              return (
                <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} key={teamName} className={`flex flex-col p-6 rounded-2xl border-2 ${teamColor} shadow-lg`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-6">
                      <span className="text-4xl font-black opacity-50 w-8 text-center">{index + 1}</span>
                      <span className="text-3xl font-bold uppercase">TEAM {teamName}</span>
                      {me.team === teamName && <span className="ml-3 text-xs bg-white/20 text-white px-3 py-1 rounded-full font-bold uppercase tracking-widest">YOUR TEAM</span>}
                    </div>
                    <div className="text-4xl font-black font-mono">{data.score} PTS</div>
                  </div>
                  <div className="text-sm font-mono opacity-80 flex flex-wrap gap-2">
                    {data.members.map(m => <span key={m} className="bg-background/50 px-3 py-1 rounded-lg border border-white/10">{m}</span>)}
                  </div>
                </motion.div>
              )
            })}
            {sortedTeams.length === 0 && <div className="text-center text-accent text-2xl mt-12">Teams have not been assigned yet.</div>}
          </div>
        </div>
      );
    } else {
      const sortedPlayers = players.sort((a, b) => b.score - a.score);
      return (
        <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full pt-12 pb-32">
          {renderPausedOverlay()}
          <h2 className="text-5xl font-display font-black text-center mb-12 text-primary">{gameState.status === 'finished' ? 'FINAL STANDINGS' : 'LIVE LEADERBOARD'}</h2>
          <div className="flex flex-col gap-4">
            {sortedPlayers.map((player, index) => (
              <motion.div initial={{y: 20, opacity:0}} animate={{y: 0, opacity:1}} key={player.id} className={`flex items-center justify-between p-6 rounded-2xl ${player.id === me.id ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(102,252,241,0.3)]' : 'bg-paper/60 border-white/10'} border`}>
                <div className="flex items-center gap-6">
                  <span className="text-3xl font-black text-accent w-8 text-center">{index + 1}</span>
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt={player.username} className="w-14 h-14 rounded-full bg-secondary/20 border-2 border-primary/50 object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-2xl border-2 border-primary/50">{player.username.charAt(0).toUpperCase()}</div>
                  )}
                  <div>
                    <span className="text-2xl font-bold">{player.username}</span>
                    {player.id === me.id && <span className="ml-3 text-xs bg-primary text-background px-2 py-1 rounded font-bold">YOU</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-primary font-mono">{player.score}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
  }

  const currentQuestionIndex = settings.gameMode === 'assignment' ? (me.currentQuestionIndex || 0) : gameState.currentQuestionIndex;
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  const isInteractionDisabled = me.hasAnswered || isFrozen || (settings.gameMode === 'assignment' && me.assignmentFinished);

  const handleAnswerSubmit = (payload: any) => {
    submitAnswer({
      questionIndex: currentQuestionIndex,
      ...payload
    });
  };

  return (
    <div className="flex-1 flex flex-col p-6 max-w-6xl mx-auto w-full pb-32">
      <AnimatePresence>
        {targetingPowerup && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-md flex flex-col items-center justify-center p-6">
            <h2 className="text-4xl font-black text-primary mb-8 tracking-widest uppercase">Select Target for {targetingPowerup.replace('_', ' ')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full">
               {Object.values(room.players).filter(p => p.role === 'player' && p.id !== me.id).map(opp => (
                  <button key={opp.id} onClick={() => executeTargetedPowerup(opp.id)} className="bg-paper border-2 border-primary/50 hover:bg-primary/20 hover:border-primary transition-all p-6 rounded-2xl flex flex-col items-center gap-3">
                     <div className="relative w-16 h-16">
                       {opp.avatarUrl ? (
                         <img src={opp.avatarUrl} alt={opp.username} className="w-full h-full rounded-full bg-secondary object-cover" />
                       ) : (
                         <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-background">{opp.username.charAt(0).toUpperCase()}</div>
                       )}
                     </div>
                     <div className="font-bold text-xl">{opp.username}</div>
                     <div className="text-sm font-mono text-accent">HP: {opp.health}</div>
                  </button>
               ))}
            </div>
            <button onClick={() => setTargetingPowerup(null)} className="mt-12 bg-danger/20 text-danger border-2 border-danger px-8 py-4 rounded-xl font-bold hover:bg-danger hover:text-white transition-all">CANCEL</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFrozen && !gameState.isPaused && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[40] bg-cyan-900/40 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none border-8 border-cyan-400/50">
             <Snowflake className="w-32 h-32 text-cyan-300 animate-pulse mb-6"/>
             <h2 className="text-6xl font-black text-cyan-300 tracking-widest drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]">FROZEN!</h2>
          </motion.div>
        )}
      </AnimatePresence>

      {renderPausedOverlay()}
      
      <AnimatePresence>
        {cheatWarning && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="fixed inset-0 z-[70] bg-danger/20 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-paper border-2 border-danger p-10 rounded-3xl max-w-lg text-center shadow-[0_0_50px_rgba(255,65,54,0.3)]">
              <AlertTriangle className="w-20 h-20 text-danger mx-auto mb-6" />
              <h2 className="text-3xl font-black text-danger mb-4">SUSPICIOUS ACTIVITY DETECTED</h2>
              <p className="text-accent mb-8">{cheatWarning}. A penalty has been applied to your score.</p>
              <button onClick={clearWarning} className="bg-danger text-white px-8 py-4 rounded-xl font-bold w-full hover:bg-danger/80">I UNDERSTAND</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex justify-between items-center bg-paper/60 p-6 rounded-2xl border border-white/10 mb-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14">
            {me.avatarUrl ? (
              <img src={me.avatarUrl} alt={me.username} className="w-full h-full rounded-full bg-primary/20 border-2 border-primary shadow-[0_0_10px_rgba(102,252,241,0.3)] object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center font-bold text-2xl border-2 border-primary shadow-[0_0_10px_rgba(102,252,241,0.3)]">
                {me.username.charAt(0).toUpperCase()}
              </div>
            )}
            {me.activeEffects.shieldActive && <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-1 shadow-[0_0_10px_rgba(102,252,241,0.8)] z-10"><Shield className="w-4 h-4 text-background"/></div>}
            {me.activeEffects.doublePointsActive && <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1 shadow-[0_0_10px_rgba(250,204,21,0.8)] z-10"><Zap className="w-4 h-4 text-background"/></div>}
          </div>
          <div>
            <div className="font-bold text-xl flex items-center gap-3">
              {me.username}
              {room.settings.teamMode && me.team && (
                 <span className={`text-xs px-2 py-0.5 rounded-md font-black uppercase ${me.team === 'ALPHA' ? 'bg-red-500 text-white' : me.team === 'BRAVO' ? 'bg-blue-500 text-white' : me.team === 'CHARLIE' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
                   TEAM {me.team}
                 </span>
              )}
            </div>
            <div className="text-primary font-mono text-lg">{me.score} PTS</div>
          </div>
        </div>
        <div className="flex gap-4">
          {settings.gameMode === 'assignment' && settings.assignmentDeadline && (
             <div className="flex flex-col justify-center bg-danger/10 border border-danger/30 px-6 py-2 rounded-xl text-danger font-bold text-sm text-center">
               <span className="uppercase text-xs tracking-widest opacity-80">DUE BY</span>
               <span>{new Date(settings.assignmentDeadline).toLocaleString()}</span>
             </div>
          )}
          {settings.gameMode === 'assignment' && (
             <div className="flex flex-col items-center justify-center bg-primary/10 border border-primary/30 px-6 py-2 rounded-xl text-primary font-bold">
               {currentQuestionIndex + 1} / {questions.length}
             </div>
          )}
          <div className="flex flex-col items-center bg-background/50 px-4 py-2 rounded-xl"><Heart className="w-6 h-6 text-danger mb-1" /><span className="font-mono font-bold">{me.health}</span></div>
          <div className="flex flex-col items-center bg-background/50 px-4 py-2 rounded-xl"><Coins className="w-6 h-6 text-warning mb-1" /><span className="font-mono font-bold">{me.coins}</span></div>
          <div className="flex flex-col items-center bg-background/50 px-4 py-2 rounded-xl"><Flame className="w-6 h-6 text-orange-500 mb-1" /><span className="font-mono font-bold">x{me.streak}</span></div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center">
        {settings.gameMode === 'live' ? (
          <div className="relative mb-12">
             <svg className="w-32 h-32 transform -rotate-90">
               <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-paper" />
               <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * timer) / currentQuestion.timeLimit} className="text-primary transition-all duration-1000 ease-linear" />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center"><span className="text-4xl font-black font-mono">{timer}</span></div>
          </div>
        ) : (
          <div className="mb-12 bg-primary/20 border-2 border-primary text-primary px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(102,252,241,0.3)]">
             SELF-PACED ASSIGNMENT
          </div>
        )}

        <div className="bg-paper/80 p-10 md:p-16 rounded-3xl border border-white/10 text-center max-w-5xl w-full mb-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight uppercase tracking-wide">{currentQuestion.text}</h2>
        </div>

        {/* --- TRIVIA RENDERING --- */}
        {currentQuestion.type === 'mcq' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
            {currentQuestion.options?.map((opt, idx) => (
              <motion.button whileHover={!isInteractionDisabled ? { scale: 1.02 } : {}} whileTap={!isInteractionDisabled ? { scale: 0.98 } : {}} key={idx} disabled={isInteractionDisabled} onClick={() => handleAnswerSubmit({ selectedOptionIndex: idx })} className={`relative p-8 rounded-2xl text-left text-2xl font-semibold transition-all border-2 ${isInteractionDisabled ? 'opacity-70 cursor-not-allowed border-white/5 bg-paper/30' : 'border-primary/30 bg-paper/60 hover:border-primary shadow-lg hover:shadow-[0_0_20px_rgba(102,252,241,0.2)]'}`}>
                <div className="flex items-center"><span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-background border border-white/20 text-lg font-bold text-accent mr-6">{['A', 'B', 'C', 'D'][idx]}</span>{opt}</div>
              </motion.button>
            ))}
          </div>
        )}

        {currentQuestion.type === 'boolean' && (
          <div className="flex gap-6 w-full max-w-3xl">
             <motion.button whileHover={!isInteractionDisabled ? { scale: 1.02 } : {}} whileTap={!isInteractionDisabled ? { scale: 0.98 } : {}} disabled={isInteractionDisabled} onClick={() => handleAnswerSubmit({ selectedOptionIndex: 0 })} className={`flex-1 p-10 rounded-2xl text-center text-4xl font-black transition-all border-2 ${isInteractionDisabled ? 'opacity-70 cursor-not-allowed border-white/5 bg-paper/30' : 'border-success/50 bg-success/20 text-success hover:border-success shadow-[0_0_30px_rgba(46,204,64,0.3)]'}`}>TRUE</motion.button>
             <motion.button whileHover={!isInteractionDisabled ? { scale: 1.02 } : {}} whileTap={!isInteractionDisabled ? { scale: 0.98 } : {}} disabled={isInteractionDisabled} onClick={() => handleAnswerSubmit({ selectedOptionIndex: 1 })} className={`flex-1 p-10 rounded-2xl text-center text-4xl font-black transition-all border-2 ${isInteractionDisabled ? 'opacity-70 cursor-not-allowed border-white/5 bg-paper/30' : 'border-danger/50 bg-danger/20 text-danger hover:border-danger shadow-[0_0_30px_rgba(255,65,54,0.3)]'}`}>FALSE</motion.button>
          </div>
        )}

        {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'long_answer') && (
          <form onSubmit={(e) => { e.preventDefault(); handleAnswerSubmit({ textAnswer }); }} className="w-full max-w-3xl flex flex-col gap-6">
            {currentQuestion.type === 'short_answer' ? (
               <input type="text" value={textAnswer} onChange={e => setTextAnswer(e.target.value)} disabled={isInteractionDisabled} placeholder="Type your answer here..." className="w-full bg-paper/60 border-2 border-primary/30 rounded-2xl p-6 text-3xl font-bold focus:border-primary outline-none transition-all text-center"/>
            ) : (
               <textarea value={textAnswer} onChange={e => setTextAnswer(e.target.value)} disabled={isInteractionDisabled} placeholder="Type your long answer here..." rows={4} className="w-full bg-paper/60 border-2 border-primary/30 rounded-2xl p-6 text-2xl font-bold focus:border-primary outline-none transition-all resize-none"/>
            )}
            <button type="submit" disabled={isInteractionDisabled || !textAnswer.trim()} className="bg-primary text-background font-black text-2xl py-6 rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(102,252,241,0.4)]">SUBMIT ANSWER</button>
          </form>
        )}

        {/* --- MINIGAME RENDERING --- */}
        {currentQuestion.type === 'minigame' && (
          <div className="flex flex-col items-center w-full max-w-4xl bg-paper/50 p-8 rounded-3xl border border-white/10 shadow-2xl relative min-h-[400px]">
            <div className="absolute top-4 right-6 text-2xl font-mono text-primary font-bold">SCORE: {clickScore}</div>
            
            {currentQuestion.minigameType === 'clicker' && (
              <div className="flex flex-col items-center">
                 <div className="text-6xl font-black text-primary mb-8 mt-12 drop-shadow-[0_0_20px_rgba(102,252,241,0.8)]">{clickScore} CLICKS</div>
                 <motion.button whileTap={!isInteractionDisabled ? { scale: 0.9, rotate: (Math.random() - 0.5) * 10 } : {}} disabled={isInteractionDisabled} onClick={() => setClickScore(s => s + 1)} className="w-64 h-64 rounded-full border-4 border-primary bg-primary/20 text-primary text-5xl font-black shadow-[0_0_50px_rgba(102,252,241,0.5)] select-none">MASH!</motion.button>
                 {settings.gameMode === 'assignment' && (
                    <button onClick={() => handleAnswerSubmit({ minigameScore: clickScore })} className="mt-8 bg-success text-background px-8 py-3 rounded-xl font-bold hover:bg-success/80">FINISH MINIGAME</button>
                 )}
              </div>
            )}

            {currentQuestion.minigameType === 'typing_race' && (
              <div className="w-full pt-12">
                <div className="text-2xl font-mono text-accent mb-6 leading-relaxed select-none tracking-wider bg-background p-6 rounded-xl border border-white/5">{typingPrompt}</div>
                <textarea disabled={isInteractionDisabled} autoFocus value={typingInput} onChange={e => setTypingInput(e.target.value.toUpperCase())} className="w-full bg-paper border-2 border-primary/50 p-6 rounded-xl text-2xl font-mono text-white focus:border-primary outline-none resize-none" rows={3} placeholder="START TYPING HERE..."/>
                {settings.gameMode === 'assignment' && (
                    <button onClick={() => handleAnswerSubmit({ minigameScore: clickScore })} className="mt-8 bg-success text-background px-8 py-3 rounded-xl font-bold hover:bg-success/80 mx-auto block">FINISH MINIGAME</button>
                )}
              </div>
            )}

            {currentQuestion.minigameType === 'reaction' && (
              <motion.button disabled={isInteractionDisabled || reactionState === 'clicked' || reactionState === 'early'} onMouseDown={handleReactionClick} className={`w-full mt-12 h-64 rounded-3xl border-4 transition-colors flex items-center justify-center text-5xl font-black ${reactionState === 'waiting' ? 'bg-danger/20 border-danger text-danger' : reactionState === 'ready' ? 'bg-success/50 border-success text-success shadow-[0_0_100px_rgba(46,204,64,0.5)]' : reactionState === 'early' ? 'bg-background border-white/10 text-accent' : 'bg-primary/20 border-primary text-primary'}`}>
                {reactionState === 'waiting' && "WAIT FOR GREEN..."}
                {reactionState === 'ready' && "CLICK NOW!"}
                {reactionState === 'early' && "TOO EARLY!"}
                {reactionState === 'clicked' && `SCORE: ${clickScore}`}
              </motion.button>
            )}

            {currentQuestion.minigameType === 'math_blitz' && (
              <form onSubmit={handleMathSubmit} className="flex flex-col items-center pt-12">
                <div className="text-7xl font-black font-mono mb-12 tracking-widest">{mathA} {mathOp} {mathB} = ?</div>
                <input disabled={isInteractionDisabled} autoFocus type="number" value={mathInput} onChange={e => setMathInput(e.target.value)} className="w-64 bg-background border-b-4 border-primary text-center text-5xl p-4 outline-none font-bold text-white mb-6" placeholder="0"/>
                <button type="submit" disabled={isInteractionDisabled} className="hidden">SUBMIT</button>
                {settings.gameMode === 'assignment' && (
                    <button type="button" onClick={() => handleAnswerSubmit({ minigameScore: clickScore })} className="mt-8 bg-success text-background px-8 py-3 rounded-xl font-bold hover:bg-success/80">FINISH MINIGAME</button>
                )}
              </form>
            )}

            {currentQuestion.minigameType === 'target_smash' && (
              <div className="w-full h-96 relative bg-background/50 rounded-2xl overflow-hidden border border-white/10 mt-12">
                {!isInteractionDisabled && (
                  <motion.button initial={{scale:0}} animate={{scale:1}} whileTap={{scale:0}} onMouseDown={() => { setClickScore(s=>s+1); moveTarget(); }} className="absolute w-20 h-20 bg-danger rounded-full shadow-[0_0_20px_rgba(255,65,54,0.8)] border-4 border-white cursor-crosshair flex items-center justify-center" style={{top: targetPos.top, left: targetPos.left}}>
                    <div className="w-10 h-10 rounded-full border-2 border-white"/>
                  </motion.button>
                )}
                {settings.gameMode === 'assignment' && (
                    <div className="absolute bottom-4 left-0 w-full flex justify-center">
                       <button onClick={() => handleAnswerSubmit({ minigameScore: clickScore })} className="bg-success text-background px-8 py-3 rounded-xl font-bold hover:bg-success/80 shadow-2xl">FINISH MINIGAME</button>
                    </div>
                )}
              </div>
            )}

            {currentQuestion.minigameType === 'memory_sequence' && (
               <div className="flex flex-col items-center pt-12">
                 <div className="text-2xl text-accent mb-8 font-bold">{showingSeq ? 'WATCH THE PATTERN...' : 'REPEAT THE PATTERN!'}</div>
                 <div className="grid grid-cols-2 gap-4">
                   {MEMORY_COLORS.map((color, i) => (
                     <motion.button key={i} disabled={showingSeq || isInteractionDisabled} onMouseDown={() => handleMemoryClick(i)} className={`w-32 h-32 rounded-2xl transition-all ${activeSeqIdx === i ? color.active : color.inactive} ${!showingSeq && 'hover:bg-white/10 active:scale-95'}`}/>
                   ))}
                 </div>
                 {settings.gameMode === 'assignment' && (
                    <button onClick={() => handleAnswerSubmit({ minigameScore: clickScore })} className="mt-12 bg-success text-background px-8 py-3 rounded-xl font-bold hover:bg-success/80">FINISH MINIGAME</button>
                 )}
               </div>
            )}

            {me.hasAnswered && settings.gameMode === 'live' && <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-3xl flex items-center justify-center text-4xl font-black text-success tracking-widest z-10">SCORE LOCKED!</div>}
          </div>
        )}
      </main>

      {/* --- POWERUP INVENTORY DOCK --- */}
      {room.settings.powerupsEnabled && (
        <div className="fixed bottom-0 left-0 w-full p-6 pointer-events-none flex justify-center z-30">
          <div className="flex gap-4 pointer-events-auto bg-paper/80 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-2xl">
             {me.powerupsInventory.map((p, i) => (
                <motion.button key={i} whileHover={{y: -10}} whileTap={{scale: 0.9}} onClick={() => handlePowerupClick(p)} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary flex items-center justify-center relative group shadow-[0_0_15px_rgba(102,252,241,0.2)]">
                   {p === 'shield' && <Shield className="w-8 h-8 text-primary"/>}
                   {p === 'freeze' && <Snowflake className="w-8 h-8 text-cyan-400"/>}
                   {p === 'bomb' && <Bomb className="w-8 h-8 text-danger"/>}
                   {p === 'steal_coins' && <Magnet className="w-8 h-8 text-warning"/>}
                   {p === 'double_points' && <Zap className="w-8 h-8 text-yellow-400"/>}
                   
                   <div className="absolute -top-12 scale-0 group-hover:scale-100 transition-transform bg-background border border-white/10 text-white text-xs px-4 py-2 rounded-full font-bold uppercase whitespace-nowrap shadow-lg z-50">
                      {p.replace('_', ' ')}
                   </div>
                </motion.button>
             ))}
             {me.powerupsInventory.length === 0 && (
               <div className="h-16 flex items-center px-6 text-accent font-mono text-sm opacity-50 uppercase font-bold tracking-widest">Inventory Empty</div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
