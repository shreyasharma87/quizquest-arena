import { useGameStore } from '../store/gameStore';
import { Users, SkipForward, Ban, Pause, Play, ShieldAlert, Database, PlusCircle, Trash2, MessageSquare, Send, Archive, Calendar, Copy, Check } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { QuestionType, Question, MinigameType } from '../../../shared/types';

export default function HostDashboard() {
  const { room, me, nextQuestion, pauseGame, resumeGame, endGame, kickPlayer, sendChatMessage, updateSettings, assignTeams, history, fetchHistory } = useGameStore();
  const [activeTab, setActiveTab] = useState<'players' | 'logs' | 'builder' | 'chat' | 'history'>('builder');
  const [copied, setCopied] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Omit<Question, 'id'>>({
    type: 'mcq',
    text: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    correctTextAnswer: '',
    minigameType: 'clicker',
    timeLimit: 15,
    points: 100
  });

  if (!room || me?.role !== 'host') return <Navigate to="/" />;

  const { gameState, questions, settings, activityLogs, chatMessages } = room;
  const players = Object.values(room.players).filter(p => p.role !== 'host');
  const readyPlayers = players.filter(p => p.isReady).length;

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    useGameStore.getState().addQuestion(newQuestion);
    setNewQuestion({
      type: 'mcq',
      text: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      correctTextAnswer: '',
      minigameType: 'clicker',
      timeLimit: 15,
      points: 100
    });
  };

  const formatDateForInput = (ts?: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/dashboard?join=${room.roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-80 bg-paper/80 border-r border-white/10 flex flex-col p-6 backdrop-blur-xl z-10">
        <h2 className="text-3xl font-display font-black text-primary mb-8 tracking-wider">HOST PANEL</h2>
        
        <div className="space-y-4 flex-1 overflow-y-auto pr-2">
          <div className="p-5 bg-background/60 rounded-xl border border-white/5 group relative">
            <div className="text-accent text-sm mb-2 font-bold uppercase tracking-wider flex justify-between items-center">
              Room Code
              <button 
                onClick={handleCopyLink}
                className={`text-xs flex items-center gap-1 transition-colors ${copied ? 'text-success' : 'text-primary hover:text-white'}`}
              >
                {copied ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}
                {copied ? 'COPIED!' : 'COPY LINK'}
              </button>
            </div>
            <div className="text-4xl font-mono font-black text-white tracking-widest">{room.roomId}</div>
          </div>
          
          <div className="p-5 bg-background/60 rounded-xl border border-white/5">
            <div className="text-accent text-sm mb-2 font-bold uppercase tracking-wider">Game Status</div>
            <div className={`text-2xl font-bold uppercase ${gameState.isPaused ? 'text-danger' : 'text-secondary animate-pulse'}`}>
              {gameState.isPaused ? 'PAUSED' : gameState.status}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {gameState.isPaused ? (
              <button onClick={resumeGame} className="bg-success text-background py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-success/80">
                <Play className="w-4 h-4"/> Resume
              </button>
            ) : (
              <button onClick={pauseGame} className="bg-warning text-background py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-warning/80">
                <Pause className="w-4 h-4"/> Pause
              </button>
            )}
            <button onClick={endGame} className="bg-danger text-background py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-danger/80">
               End Game
            </button>
          </div>

          {gameState.status === 'waiting' && (
            <button 
              onClick={() => useGameStore.getState().startGame()}
              className="w-full mt-4 bg-primary hover:bg-primary/90 text-background py-4 rounded-xl font-black text-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(102,252,241,0.3)] transition-transform active:scale-95"
            >
               START MATCH ({readyPlayers}/{players.length} Ready)
            </button>
          )}

          <hr className="border-white/10 my-6" />

          <div className="space-y-2">
            <div className="text-accent text-sm font-bold uppercase mb-3">Room Settings</div>
            
            <label className="flex items-center justify-between p-3 bg-background/40 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
              <span className="font-bold text-primary">Game Mode</span>
              <select value={settings.gameMode} onChange={e => updateSettings({gameMode: e.target.value as 'live' | 'assignment'})} className="bg-background border border-white/10 rounded-lg p-2 text-white outline-none focus:border-primary text-sm font-bold">
                <option value="live">Live Game (Host Paced)</option>
                <option value="assignment">Assignment (Self Paced)</option>
              </select>
            </label>

            {settings.gameMode === 'assignment' && (
              <div className="flex flex-col gap-2 p-3 bg-primary/10 rounded-lg border border-primary/30 transition-colors">
                <span className="font-bold text-primary text-sm flex items-center gap-2"><Calendar className="w-4 h-4"/> Assignment Deadline</span>
                
                <select 
                  onChange={e => {
                     const val = e.target.value;
                     e.target.value = ''; // reset so it acts like a button
                     if (!val) return;
                     const now = Date.now();
                     let newTime = now;
                     if (val === '1h') newTime += 3600000;
                     if (val === '12h') newTime += 3600000 * 12;
                     if (val === '1d') newTime += 86400000;
                     if (val === '3d') newTime += 86400000 * 3;
                     if (val === '1w') newTime += 86400000 * 7;
                     updateSettings({ assignmentDeadline: newTime });
                  }} 
                  className="bg-background border border-primary/50 rounded-lg p-2 text-white outline-none focus:border-primary text-sm font-bold w-full"
                >
                  <option value="">Quick Presets...</option>
                  <option value="1h">+1 Hour from now</option>
                  <option value="12h">+12 Hours from now</option>
                  <option value="1d">+1 Day from now</option>
                  <option value="3d">+3 Days from now</option>
                  <option value="1w">+1 Week from now</option>
                </select>

                <div className="relative">
                  <input 
                    type="datetime-local" 
                    value={formatDateForInput(settings.assignmentDeadline)} 
                    onChange={e => {
                       if (e.target.value) {
                         updateSettings({ assignmentDeadline: new Date(e.target.value).getTime() });
                       } else {
                         updateSettings({ assignmentDeadline: undefined });
                       }
                    }} 
                    style={{ colorScheme: 'dark' }}
                    className="bg-background border border-primary/50 rounded-lg p-2 text-white outline-none focus:border-primary text-sm font-mono w-full"
                  />
                </div>
              </div>
            )}

            <label className="flex items-center justify-between p-3 bg-background/40 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
              <span>Anti-Cheat Engine</span>
              <input type="checkbox" checked={settings.antiCheatEnabled} onChange={e => updateSettings({antiCheatEnabled: e.target.checked})} className="accent-primary w-5 h-5 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between p-3 bg-background/40 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
              <span>Allow Powerups</span>
              <input type="checkbox" checked={settings.powerupsEnabled} onChange={e => updateSettings({powerupsEnabled: e.target.checked})} className="accent-primary w-5 h-5 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between p-3 bg-primary/20 rounded-lg border border-primary/50 cursor-pointer hover:bg-primary/30 transition-colors">
              <span className="font-bold text-primary">Enable Team Mode</span>
              <input type="checkbox" checked={settings.teamMode} onChange={e => updateSettings({teamMode: e.target.checked})} className="accent-primary w-5 h-5 cursor-pointer" />
            </label>
          </div>

          <hr className="border-white/10 my-6" />

          {settings.gameMode === 'live' && (gameState.status === 'leaderboard' || gameState.status === 'finished') && (
            <button 
              onClick={nextQuestion}
              className="w-full bg-primary hover:bg-primary/90 text-background py-5 rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-[0_0_20px_rgba(102,252,241,0.4)]"
            >
              <SkipForward className="w-6 h-6" /> {gameState.status === 'finished' ? 'FINISH GAME' : 'NEXT ROUND'}
            </button>
          )}

          {settings.gameMode === 'assignment' && gameState.status === 'question' && (
            <div className="bg-primary/20 border border-primary p-4 rounded-xl text-center mt-6">
              <div className="text-primary font-bold uppercase tracking-widest mb-2">Assignment Active</div>
              <p className="text-sm text-accent">Players are completing questions at their own pace.</p>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 bg-background p-10 flex flex-col relative z-0 h-screen overflow-hidden">
        <div className="flex justify-between items-center mb-8 flex-shrink-0">
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('players')} className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'players' ? 'bg-primary text-background' : 'bg-paper text-accent border border-white/5'}`}>
              Player Management
            </button>
            <button onClick={() => setActiveTab('builder')} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'builder' ? 'bg-secondary text-background' : 'bg-paper text-accent border border-white/5'}`}>
              <Database className="w-5 h-5"/> Question Builder
            </button>
            <button onClick={() => setActiveTab('chat')} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'bg-primary text-background' : 'bg-paper text-accent border border-white/5'}`}>
              <MessageSquare className="w-5 h-5"/> Live Chat
            </button>
            <button onClick={() => setActiveTab('logs')} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-danger text-background' : 'bg-paper text-accent border border-white/5'}`}>
              <ShieldAlert className="w-5 h-5"/> Anti-Cheat Logs
            </button>
            <button onClick={() => { setActiveTab('history'); fetchHistory(); }} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-success text-background' : 'bg-paper text-accent border border-white/5'}`}>
              <Archive className="w-5 h-5"/> Records
            </button>
          </div>
          <div className="flex items-center gap-3 text-white bg-paper/80 border border-primary/30 px-6 py-3 rounded-xl font-bold shadow-lg">
            <Users className="w-6 h-6 text-primary" /> {players.length} Active
          </div>
        </div>

        {activeTab === 'players' && (
          <div className="flex-1 flex flex-col overflow-hidden">
             {settings.teamMode && (
                <div className="flex justify-between items-center mb-4 pr-4 bg-paper/50 p-4 rounded-xl border border-white/10">
                   <div>
                     <span className="text-xl font-black text-primary uppercase">Team Mode Active</span>
                     <p className="text-sm text-accent">Scores will be aggregated into Team Standings.</p>
                   </div>
                   <button onClick={assignTeams} className="bg-primary text-background px-6 py-3 rounded-xl font-bold shadow-[0_0_10px_rgba(102,252,241,0.5)] hover:bg-primary/90 transition-all flex items-center gap-2">
                      <Users className="w-5 h-5"/> SHUFFLE & ASSIGN TEAMS
                   </button>
                </div>
             )}
             
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto content-start pb-20">
              {players.map(player => (
                <div key={player.id} className={`bg-paper/60 border-2 ${player.team === 'ALPHA' ? 'border-red-500/50' : player.team === 'BRAVO' ? 'border-blue-500/50' : player.team === 'CHARLIE' ? 'border-green-500/50' : player.team === 'DELTA' ? 'border-yellow-500/50' : 'border-white/10'} rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden`}>
                  {player.isReady && gameState.status === 'waiting' && <div className="absolute top-0 right-0 bg-success text-background px-3 py-1 font-bold text-xs rounded-bl-xl z-10">READY</div>}
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xl truncate pr-2">{player.username}</span>
                    <div className="flex gap-2 relative z-20">
                      <button onClick={() => kickPlayer(player.id)} className="text-accent hover:text-danger hover:bg-danger/10 transition-all p-2 rounded-lg" title="Kick Player">
                        <Ban className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {settings.teamMode && player.team && (
                     <div className={`text-sm font-black uppercase tracking-widest ${player.team === 'ALPHA' ? 'text-red-400' : player.team === 'BRAVO' ? 'text-blue-400' : player.team === 'CHARLIE' ? 'text-green-400' : 'text-yellow-400'}`}>
                       TEAM {player.team}
                     </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm font-mono bg-background/80 p-4 rounded-xl border border-white/5">
                    <div className="flex flex-col"><span className="text-accent text-xs">Score</span> <span className="text-primary text-lg font-bold">{player.score}</span></div>
                    {settings.gameMode === 'assignment' ? (
                       <div className="flex flex-col"><span className="text-accent text-xs">Progress</span> <span className="text-lg font-bold">{player.currentQuestionIndex} / {questions.length}</span></div>
                    ) : (
                       <div className="flex flex-col"><span className="text-accent text-xs">HP</span> <span className="text-lg font-bold">{player.health}</span></div>
                    )}
                    <div className="flex flex-col"><span className="text-accent text-xs">Warnings</span> <span className="text-danger text-lg font-bold">{player.warnings}</span></div>
                    <div className="flex flex-col"><span className="text-accent text-xs">Status</span> <span className={`text-sm mt-1 font-bold ${player.assignmentFinished ? 'text-success' : player.hasAnswered ? 'text-primary' : 'text-warning'}`}>{player.assignmentFinished ? 'Finished' : player.hasAnswered ? 'Answered' : 'Playing'}</span></div>
                  </div>
                </div>
              ))}
              {players.length === 0 && <div className="col-span-full text-center text-accent text-xl mt-12">No players connected yet.</div>}
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          <div className="flex gap-8 overflow-hidden flex-1 pb-10">
            {/* Same Builder UI as before */}
            <div className="w-1/2 bg-paper/50 border border-white/10 rounded-2xl p-6 overflow-y-auto">
              <h4 className="text-2xl font-bold mb-6 flex items-center gap-2"><PlusCircle className="text-primary"/> Create Question</h4>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-accent text-sm mb-2 uppercase font-bold">Question Type</label>
                    <select value={newQuestion.type} onChange={e => setNewQuestion({...newQuestion, type: e.target.value as QuestionType})} className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none">
                      <option value="mcq">Multiple Choice</option>
                      <option value="boolean">True / False</option>
                      <option value="short_answer">Short Answer</option>
                      <option value="long_answer">Long Answer</option>
                      <option value="minigame">Mini-Game</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-accent text-sm mb-2 uppercase font-bold">Time Limit (Sec)</label>
                    <input type="number" min="5" max="120" required value={newQuestion.timeLimit} onChange={e => setNewQuestion({...newQuestion, timeLimit: parseInt(e.target.value)})} className="w-full bg-background border border-white/10 rounded-lg p-3 focus:border-primary outline-none"/>
                  </div>
                </div>

                <div>
                  <label className="block text-accent text-sm mb-2 uppercase font-bold">Prompt / Question Text</label>
                  <input type="text" required value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg p-4 text-lg focus:border-primary outline-none" placeholder="Enter your prompt..."/>
                </div>

                {newQuestion.type === 'mcq' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {newQuestion.options?.map((opt, idx) => (
                        <div key={idx}>
                          <label className="block text-accent text-sm mb-2 uppercase font-bold">Option {['A','B','C','D'][idx]}</label>
                          <input type="text" required value={opt} onChange={e => {
                            const newOpts = [...(newQuestion.options || [])];
                            newOpts[idx] = e.target.value;
                            setNewQuestion({...newQuestion, options: newOpts});
                          }} className="w-full bg-background border border-white/10 rounded-lg p-3 focus:border-primary outline-none"/>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-accent text-sm mb-2 uppercase font-bold">Correct Answer</label>
                      <select value={newQuestion.correctOptionIndex} onChange={e => setNewQuestion({...newQuestion, correctOptionIndex: parseInt(e.target.value)})} className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none">
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>
                  </>
                )}

                {newQuestion.type === 'boolean' && (
                  <div>
                    <label className="block text-accent text-sm mb-2 uppercase font-bold">Correct Answer</label>
                    <select value={newQuestion.correctOptionIndex} onChange={e => setNewQuestion({...newQuestion, correctOptionIndex: parseInt(e.target.value)})} className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none">
                      <option value={0}>True</option>
                      <option value={1}>False</option>
                    </select>
                  </div>
                )}

                {(newQuestion.type === 'short_answer' || newQuestion.type === 'long_answer') && (
                  <div>
                    <label className="block text-accent text-sm mb-2 uppercase font-bold">Exact Correct Text Match</label>
                    <input type="text" required value={newQuestion.correctTextAnswer} onChange={e => setNewQuestion({...newQuestion, correctTextAnswer: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg p-3 focus:border-primary outline-none" placeholder="Enter acceptable exact answer..."/>
                  </div>
                )}

                {newQuestion.type === 'minigame' && (
                  <div>
                    <label className="block text-accent text-sm mb-2 uppercase font-bold">Minigame Type</label>
                    <select value={newQuestion.minigameType} onChange={e => setNewQuestion({...newQuestion, minigameType: e.target.value as MinigameType})} className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none">
                      <option value="clicker">Speed Clicker / Masher</option>
                      <option value="typing_race">Typing Race (Type exactly)</option>
                      <option value="reaction">Reaction Time (Click on Green)</option>
                      <option value="memory_sequence">Memory Sequence (Remember pattern)</option>
                      <option value="math_blitz">Math Blitz (Solve equations)</option>
                      <option value="target_smash">Target Smash (Aim trainer)</option>
                    </select>
                  </div>
                )}

                <div className="pt-4 border-t border-white/5">
                  <label className="block text-accent text-sm mb-2 uppercase font-bold">Points Awarded (Multiplier)</label>
                  <input type="number" min="1" max="1000" required value={newQuestion.points} onChange={e => setNewQuestion({...newQuestion, points: parseInt(e.target.value)})} className="w-full bg-background border border-white/10 rounded-lg p-3 focus:border-primary outline-none"/>
                </div>

                <button type="submit" className="w-full bg-primary text-background font-bold text-lg py-4 rounded-xl mt-6 hover:bg-primary/90 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(102,252,241,0.3)]">
                  <Database className="w-5 h-5"/> Add {newQuestion.type.toUpperCase()} to Quiz Array
                </button>
              </form>
            </div>

            <div className="w-1/2 bg-paper/50 border border-white/10 rounded-2xl p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-2xl font-bold text-primary">{questions.length} Active Rounds</h4>
                <button 
                  onClick={handleCopyLink}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${copied ? 'bg-success text-background' : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'}`}
                >
                  {copied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                  {copied ? 'LINK COPIED' : 'SHARE ROOM'}
                </button>
              </div>
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-background border border-white/5 p-5 rounded-xl group relative transition-all hover:border-primary/50">
                    <button onClick={() => useGameStore.getState().deleteQuestion(q.id)} className="absolute top-4 right-4 text-danger/50 hover:text-danger p-2 bg-danger/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-5 h-5"/>
                    </button>
                    <div className="flex gap-2 mb-2">
                       <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold uppercase">{q.type}</span>
                       <span className="font-mono text-accent text-sm">Round {idx + 1} • {q.timeLimit}s • {q.points}pts multiplier</span>
                    </div>
                    <div className="text-xl font-bold mb-4 pr-10">{q.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col bg-paper/50 border border-white/10 rounded-2xl p-6 overflow-hidden">
            <h4 className="text-2xl font-bold mb-6 text-primary">Live Game Chat</h4>
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-4 mb-6">
              {chatMessages.map(msg => (
                 <div key={msg.id} className={`p-4 rounded-xl max-w-[80%] ${msg.senderId === me?.id ? 'bg-primary/20 border border-primary/30 self-end rounded-tr-sm' : 'bg-background border border-white/5 self-start rounded-tl-sm'}`}>
                    {msg.senderId !== me?.id && <div className="text-xs font-bold text-accent mb-1">{msg.senderName}</div>}
                    <div className="text-base font-medium">{msg.text}</div>
                 </div>
              ))}
              {chatMessages.length === 0 && <div className="text-center text-accent my-auto">No messages yet.</div>}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const t = e.currentTarget.chat.value; if(t.trim()){ sendChatMessage(t); e.currentTarget.reset(); } }} className="flex gap-3 mt-auto">
              <input name="chat" type="text" placeholder="Send a message as Host..." maxLength={200} autoComplete="off" className="flex-1 bg-background border border-white/10 rounded-xl px-6 py-4 text-lg focus:border-primary outline-none transition-colors"/>
              <button type="submit" className="bg-primary text-background px-8 rounded-xl font-bold hover:bg-primary/90 flex items-center gap-2"><Send className="w-5 h-5"/> Send</button>
            </form>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="flex-1 bg-paper/50 border border-white/10 rounded-2xl p-6 overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-accent font-mono text-sm border-b border-white/10">
                  <th className="pb-3 pl-4">Time</th>
                  <th className="pb-3">Player</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map(log => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-4 font-mono text-sm">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="py-4 font-bold">{log.playerName}</td>
                    <td className="py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${log.type === 'combat' ? 'bg-warning/20 text-warning' : log.type === 'system' ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}`}>{log.type}</span></td>
                    <td className="py-4 text-accent">{log.description}</td>
                  </tr>
                ))}
                {activityLogs.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-accent">No suspicious activity detected yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex-1 bg-paper/50 border border-white/10 rounded-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
               <h4 className="text-2xl font-bold text-primary flex items-center gap-3"><Archive className="w-6 h-6"/> Match Records (Server Session)</h4>
               <button onClick={fetchHistory} className="bg-paper border border-white/10 px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/5">REFRESH</button>
            </div>
            
            <div className="space-y-6">
              {history.map(record => (
                <div key={record.id} className="bg-background border border-white/10 p-6 rounded-xl flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div>
                      <span className="text-lg font-bold mr-4 text-white">Room: {record.roomId}</span>
                      <span className="bg-primary/20 text-primary px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">{record.gameMode}</span>
                    </div>
                    <div className="text-accent text-sm font-mono">{new Date(record.date).toLocaleString()}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {record.leaderboard.slice(0, 3).map((p, i) => (
                       <div key={i} className="flex justify-between items-center bg-paper/50 p-4 rounded-lg border border-white/5">
                         <div className="flex items-center gap-4">
                           <span className="font-black text-2xl w-8 text-center text-accent">{i + 1}</span>
                           <span className="font-bold text-lg">{p.username}</span>
                           {p.team && <span className="text-xs uppercase text-primary border border-primary/30 px-2 py-0.5 rounded">{p.team}</span>}
                         </div>
                         <span className="font-mono font-bold text-primary">{p.score} PTS</span>
                       </div>
                     ))}
                     {record.leaderboard.length === 0 && <div className="text-accent italic col-span-full">No players scored in this match.</div>}
                  </div>
                </div>
              ))}
              {history.length === 0 && <div className="text-center text-accent py-20 text-xl border-2 border-dashed border-white/10 rounded-2xl">No matches have been recorded on this server session yet.</div>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
