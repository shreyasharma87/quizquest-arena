import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useNavigate } from 'react-router-dom';
import { Trophy, Swords, Medal, Star, Target, Settings, LogOut, Activity, Gamepad2, ShieldAlert, Edit2, X, RefreshCw, CheckCircle2, Lock } from 'lucide-react';

const AVATARS = [
  { id: '1', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=121212', category: 'Common', locked: false },
  { id: '2', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aneka&backgroundColor=121212', category: 'Common', locked: false },
  { id: '3', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Max&backgroundColor=121212', category: 'Common', locked: false },
  { id: '4', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Jude&backgroundColor=121212', category: 'Rare', locked: false },
  { id: '5', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Lilith&backgroundColor=121212', category: 'Rare', locked: false },
  { id: '6', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Jack&backgroundColor=121212', category: 'Epic', locked: true, requirement: 'Reach Level 10' },
  { id: '7', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Luna&backgroundColor=121212', category: 'Epic', locked: true, requirement: 'Win 50 Matches' },
  { id: '8', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Zoe&backgroundColor=121212', category: 'Legendary', locked: true, requirement: 'Top 100 Leaderboard' }
];

export default function PlayerDashboard() {
  const { user, logout, updateProfile } = useAuthStore();
  const connect = useGameStore(state => state.connect);
  const updatePlayerProfile = useGameStore(state => state.updatePlayerProfile);
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const joinCode = searchParams.get('join');
    if (joinCode) {
      setRoomCode(joinCode.toUpperCase());
    }
  }, [searchParams]);

  if (!user) {
    navigate('/');
    return null;
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      connect(roomCode.toUpperCase(), user.username);
      navigate(`/game/${roomCode.toUpperCase()}`);
    }
  };

  const handleHost = () => {
    const newRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
    connect(newRoom, user.username, 'host');
    navigate(`/host/${newRoom}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col scroll-smooth">
      <nav className="bg-paper/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Gamepad2 className="w-8 h-8 text-primary"/>
             <span className="text-2xl font-black font-display tracking-widest text-white">ARENA<span className="text-primary">HUB</span></span>
          </div>
          <div className="hidden md:flex gap-2">
             <NavTab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Activity/>} label="Overview"/>
             <NavTab active={activeTab === 'achievements'} onClick={() => setActiveTab('achievements')} icon={<Trophy/>} label="Achievements"/>
             <NavTab active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<Swords/>} label="Match History"/>
             <NavTab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings/>} label="Settings"/>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
               <span className="font-bold">{user.username}</span>
               <span className="text-xs font-black uppercase text-primary tracking-widest">{user.rank}</span>
             </div>
             <img src={user.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-xl bg-secondary border-2 border-primary/50 shadow-[0_0_15px_rgba(102,252,241,0.3)]"/>
             <button onClick={() => { logout(); navigate('/'); }} className="ml-4 p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"><LogOut className="w-6 h-6"/></button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 pt-12 flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN - STATS */}
        <aside className="w-full lg:w-80 flex flex-col gap-6">
          <div className="bg-paper border border-white/10 rounded-3xl p-8 relative overflow-hidden text-center shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 to-secondary/20"/>
             
             <div className="relative w-32 h-32 mx-auto mb-4 group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
               <img src={user.avatarUrl} className="w-full h-full object-cover rounded-full relative z-10 border-4 border-background bg-secondary shadow-xl transition-transform duration-300 group-hover:scale-105" alt="avatar" loading="lazy" onError={(e) => { e.currentTarget.src = 'https://api.dicebear.com/7.x/initials/svg?seed=Player'; }} />
               <div className="absolute inset-0 z-20 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                 <Edit2 className="text-white w-8 h-8" />
               </div>
               {user.level >= 10 && (
                 <div className="absolute -inset-2 z-0 rounded-full border-2 border-primary animate-pulse blur-[2px]" />
               )}
             </div>

             <h2 className="text-3xl font-black mb-1">{user.username}</h2>
             <div className="text-primary font-bold uppercase tracking-widest text-sm mb-6">{user.rank}</div>
             
             <div className="bg-background/50 rounded-2xl p-4 border border-white/5 mb-6 text-left">
               <div className="flex justify-between text-xs font-bold text-accent mb-2"><span>LEVEL {user.level}</span><span>{user.xp} / {(user.level * 1000)} XP</span></div>
               <div className="w-full bg-paper rounded-full h-3 overflow-hidden border border-white/5">
                 <div className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-1000" style={{width: `${(user.xp % 1000) / 10}%`}}/>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <div className="bg-background/50 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                 <Star className="w-6 h-6 text-warning mb-2"/>
                 <span className="font-mono text-xl font-black">{user.coins}</span>
                 <span className="text-[10px] font-bold uppercase text-accent tracking-widest">Coins</span>
               </div>
               <div className="bg-background/50 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                 <Target className="w-6 h-6 text-success mb-2"/>
                 <span className="font-mono text-xl font-black">{user.stats.accuracy}%</span>
                 <span className="text-[10px] font-bold uppercase text-accent tracking-widest">Accuracy</span>
               </div>
             </div>
          </div>
        </aside>

        {/* RIGHT COLUMN - CONTENT */}
        <div className="flex-1 flex flex-col gap-8">
           
           {activeTab === 'overview' && (
             <>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-paper border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"/>
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Swords className="text-primary"/> JOIN MATCH</h3>
                    <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-4 w-full">
                      <input 
                        type="text" 
                        value={roomCode} 
                        onChange={e => setRoomCode(e.target.value.toUpperCase())} 
                        maxLength={6} 
                        placeholder="ROOM CODE" 
                        className="flex-1 w-full min-w-0 bg-background border-2 border-white/10 rounded-xl px-6 py-4 text-xl font-mono uppercase tracking-widest outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(102,252,241,0.2)] text-white transition-all"
                      />
                      <button 
                        type="submit" 
                        className="sm:w-auto min-w-[120px] shrink-0 bg-primary text-background px-8 py-4 rounded-xl font-black hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(102,252,241,0.4)] transition-all duration-200 flex items-center justify-center"
                      >
                        JOIN
                      </button>
                    </form>
                 </div>
                 
                 <div className="bg-paper border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-secondary/50 transition-colors">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"/>
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Medal className="text-secondary"/> HOST MATCH</h3>
                    <p className="text-accent mb-6 leading-relaxed">Create a custom room, invite your friends, and control the flow of the game as the Host.</p>
                    <button onClick={handleHost} className="w-full bg-secondary text-background py-4 rounded-xl font-black text-lg hover:bg-secondary/90 shadow-[0_0_20px_rgba(255,42,109,0.3)] transition-all">CREATE NEW ROOM</button>
                 </div>
               </div>

               <h3 className="text-2xl font-black mt-4 flex items-center gap-3"><Activity className="text-primary"/> RECENT ACTIVITY</h3>
               <div className="bg-paper border border-white/10 rounded-3xl p-8 flex flex-col gap-4">
                  <div className="bg-background/50 border border-white/5 p-6 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors">
                     <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-xl bg-success/20 text-success flex items-center justify-center font-black text-2xl border border-success/50">1st</div>
                       <div>
                         <div className="font-bold text-xl mb-1">Room: XQ9B2</div>
                         <div className="text-accent text-sm">Team Mode • Won by 4,200 points</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="font-mono text-primary font-bold text-xl">+850 XP</div>
                       <div className="text-sm font-bold text-warning">+120 Coins</div>
                     </div>
                  </div>
                  <div className="bg-background/50 border border-white/5 p-6 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors">
                     <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-xl bg-accent/20 text-accent flex items-center justify-center font-black text-2xl border border-accent/50">4th</div>
                       <div>
                         <div className="font-bold text-xl mb-1">Room: K19PZ</div>
                         <div className="text-accent text-sm">Solo Mode • Survived 12 rounds</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="font-mono text-primary font-bold text-xl">+250 XP</div>
                       <div className="text-sm font-bold text-warning">+30 Coins</div>
                     </div>
                  </div>
               </div>
             </>
           )}

           {activeTab === 'history' && (
             <div className="bg-paper border border-white/10 rounded-3xl p-8 flex flex-col gap-4">
               <h3 className="text-2xl font-black mb-4 flex items-center gap-3"><Swords className="text-primary"/> MATCH HISTORY</h3>
               {/* Same items as recent activity but extended */}
               <div className="bg-background/50 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                     <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-xl bg-success/20 text-success flex items-center justify-center font-black text-2xl border border-success/50">1st</div>
                       <div>
                         <div className="font-bold text-xl mb-1">Room: XQ9B2</div>
                         <div className="text-accent text-sm">Team Mode • Won by 4,200 points</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="font-mono text-primary font-bold text-xl">+850 XP</div>
                     </div>
               </div>
               <div className="bg-background/50 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                     <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-xl bg-accent/20 text-accent flex items-center justify-center font-black text-2xl border border-accent/50">4th</div>
                       <div>
                         <div className="font-bold text-xl mb-1">Room: K19PZ</div>
                         <div className="text-accent text-sm">Solo Mode • Survived 12 rounds</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="font-mono text-primary font-bold text-xl">+250 XP</div>
                     </div>
               </div>
             </div>
           )}

           {activeTab === 'settings' && (
             <div className="bg-paper border border-white/10 rounded-3xl p-8 flex flex-col gap-6">
               <h3 className="text-2xl font-black mb-4">GAME PREFERENCES</h3>
               <SettingToggle label="Enable Sound Effects" defaultOn />
               <SettingToggle label="Enable Match Music" defaultOn />
               <SettingToggle label="Reduced Motion (Disable Animations)" />
               <SettingToggle label="Profanity Filter in Chat" defaultOn />
               <hr className="border-white/5 my-4"/>
               <h3 className="text-2xl font-black mb-4 text-danger">ACCOUNT CONTROLS</h3>
               <button onClick={logout} className="bg-danger/20 text-danger border border-danger px-8 py-4 rounded-xl font-bold w-max hover:bg-danger hover:text-white transition-all">LOGOUT OF DEVICE</button>
             </div>
           )}

           {activeTab === 'achievements' && (
             <div className="bg-paper border border-white/10 rounded-3xl p-8">
               <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Trophy className="text-warning"/> UNLOCKED BADGES</h3>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                 {user.badges.map(b => (
                    <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} key={b} className="bg-background/50 border-2 border-warning/50 rounded-2xl p-6 text-center flex flex-col items-center gap-4 hover:-translate-y-2 transition-transform shadow-[0_0_20px_rgba(255,220,0,0.1)]">
                       <div className="w-20 h-20 bg-warning/20 rounded-full flex items-center justify-center text-warning shadow-[0_0_30px_rgba(255,220,0,0.3)] border-2 border-warning"><Star className="w-10 h-10"/></div>
                       <div className="font-bold text-lg">{b}</div>
                    </motion.div>
                 ))}
                 <div className="bg-background/50 border-2 border-dashed border-white/10 rounded-2xl p-6 text-center flex flex-col items-center gap-4 opacity-50 grayscale">
                     <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white"><ShieldAlert className="w-10 h-10"/></div>
                     <div className="font-bold text-lg">Flawless Victory</div>
                     <div className="text-xs">Win without taking damage</div>
                 </div>
               </div>
             </div>
           )}
           
        </div>
      </main>

      <AnimatePresence>
        {isAvatarModalOpen && (
          <AvatarSelectionModal 
            isOpen={isAvatarModalOpen} 
            onClose={() => setIsAvatarModalOpen(false)} 
            currentAvatar={user.avatarUrl}
            onSelect={(url) => {
              updateProfile({ avatarUrl: url });
              updatePlayerProfile({ avatarUrl: url });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function AvatarSelectionModal({ isOpen, onClose, currentAvatar, onSelect }: any) {
  const [selected, setSelected] = useState(currentAvatar);
  const [category, setCategory] = useState('All');
  const [isSaving, setIsSaving] = useState(false);

  const categories = ['All', 'Common', 'Rare', 'Epic', 'Legendary'];
  const filteredAvatars = AVATARS.filter(a => category === 'All' || a.category === category);

  const handleRandom = () => {
    const seed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=121212`;
    setSelected(newAvatar);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API/Firebase delay
    await new Promise(r => setTimeout(r, 800));
    onSelect(selected);
    setIsSaving(false);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-paper border border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div>
            <h2 className="text-2xl font-black tracking-widest text-white">CHOOSE AVATAR</h2>
            <p className="text-accent text-sm mt-1">Select your gaming identity or generate a random one.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-6 h-6 text-accent" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* PREVIEW PANEL */}
          <div className="w-full md:w-1/3 p-8 border-b md:border-b-0 md:border-r border-white/10 flex flex-col items-center justify-center bg-background/50">
            <div className="relative w-48 h-48 mb-6 group">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl group-hover:bg-primary/30 transition-colors" />
              <img src={selected} alt="Preview" className="w-full h-full object-cover rounded-full relative z-10 border-4 border-primary shadow-[0_0_30px_rgba(102,252,241,0.3)] bg-secondary" />
            </div>
            <div className="text-xl font-bold mb-2">Live Preview</div>
            <button 
              onClick={handleRandom}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-sm font-bold text-accent mb-8"
            >
              <RefreshCw className="w-4 h-4" /> RANDOMIZE
            </button>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-primary text-background font-black rounded-xl hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(102,252,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5"/> SAVE AVATAR</>}
            </button>
          </div>

          {/* GALLERY PANEL */}
          <div className="w-full md:w-2/3 flex flex-col">
            <div className="p-4 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
              {categories.map(c => (
                <button 
                  key={c} onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${category === c ? 'bg-primary text-background shadow-[0_0_10px_rgba(102,252,241,0.5)]' : 'bg-white/5 text-accent hover:bg-white/10'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-4 flex-1">
              {filteredAvatars.map(avatar => (
                <button
                  key={avatar.id}
                  onClick={() => !avatar.locked && setSelected(avatar.url)}
                  className={`relative aspect-square rounded-2xl border-2 transition-all duration-300 overflow-hidden group
                    ${avatar.locked ? 'border-white/5 cursor-not-allowed opacity-75' : 
                      selected === avatar.url ? 'border-primary shadow-[0_0_15px_rgba(102,252,241,0.4)] scale-105' : 'border-white/10 hover:border-white/30 hover:scale-105'}
                  `}
                >
                  <img src={avatar.url} alt={`Avatar ${avatar.id}`} className="w-full h-full object-cover bg-secondary/50" loading="lazy" />
                  
                  {avatar.locked && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center backdrop-blur-[2px] p-2 text-center">
                      <Lock className="w-6 h-6 text-danger mb-1" />
                      <span className="text-[10px] font-bold text-danger leading-tight">{avatar.requirement}</span>
                    </div>
                  )}

                  {!avatar.locked && selected === avatar.url && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-3 h-3 text-background" />
                    </div>
                  )}
                  
                  <div className={`absolute bottom-0 left-0 right-0 p-1 text-[10px] font-black uppercase text-center
                    ${avatar.category === 'Common' ? 'bg-gray-500/80 text-white' : 
                      avatar.category === 'Rare' ? 'bg-blue-500/80 text-white' : 
                      avatar.category === 'Epic' ? 'bg-purple-500/80 text-white' : 
                      'bg-warning/80 text-background'}
                  `}>
                    {avatar.category}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NavTab({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${active ? 'bg-primary/20 text-primary' : 'text-accent hover:bg-white/5 hover:text-white'}`}>
      {React.cloneElement(icon, { className: 'w-5 h-5' })}
      {label}
    </button>
  )
}

function SettingToggle({ label, defaultOn = false }: { label: string, defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between bg-background/50 p-6 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setOn(!on)}>
      <span className="font-bold text-lg">{label}</span>
      <button className={`w-14 h-8 rounded-full p-1 transition-colors ${on ? 'bg-primary' : 'bg-white/20'}`}>
        <div className={`w-6 h-6 bg-white rounded-full transition-transform ${on ? 'translate-x-6' : 'translate-x-0'}`}/>
      </button>
    </div>
  )
}
