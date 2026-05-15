import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Users, ShieldBan, ArrowRight, Activity, Zap, Trophy, Flame } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuthStore();
  const [loginInput, setLoginInput] = useState('');

  const handlePlayNow = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      if (loginInput.trim()) {
        login(loginInput);
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-x-hidden relative scroll-smooth">
      <header className="p-6 flex justify-between items-center z-50 relative bg-background/80 backdrop-blur-md sticky top-0 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-display font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            QUIZQUEST ARENA
          </h1>
        </div>
        <nav className="hidden md:flex gap-8 font-bold text-accent items-center">
          <a href="#features" className="hover:text-primary transition-colors uppercase tracking-widest text-sm">Features</a>
          <a href="#about" className="hover:text-primary transition-colors uppercase tracking-widest text-sm">About</a>
          {isAuthenticated ? (
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary/20 transition-all shadow-[0_0_15px_rgba(102,252,241,0.2)]">Go to Dashboard</button>
          ) : (
            <button onClick={() => document.getElementById('login-input')?.focus()} className="px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary/20 transition-all shadow-[0_0_15px_rgba(102,252,241,0.2)]">Login / Guest</button>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative px-4 min-h-[90vh]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center z-10 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-paper/50 border border-primary/20 backdrop-blur-sm mb-6 text-sm font-semibold text-primary shadow-lg">
            <Activity className="w-4 h-4" />
            V1.0 LIVE: ESPORTS EDITION
          </div>
          
          <h2 className="text-6xl md:text-8xl font-display font-black mb-6 leading-tight drop-shadow-2xl">
            BATTLE OF <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-pulse drop-shadow-[0_0_30px_rgba(102,252,241,0.5)]">
              WITS & SPEED
            </span>
          </h2>
          
          <form onSubmit={handlePlayNow} className="flex flex-col gap-4 max-w-md mx-auto w-full mt-12">
            {!isAuthenticated ? (
               <input 
                 id="login-input" 
                 type="text" 
                 placeholder="ENTER USERNAME TO PLAY" 
                 value={loginInput} 
                 onChange={e => setLoginInput(e.target.value)} 
                 className="w-full bg-paper/80 border-2 border-accent/30 rounded-xl px-6 py-5 text-center text-xl font-bold outline-none focus:border-primary transition-all text-white shadow-xl" 
                 required 
                 maxLength={15} 
               />
            ) : (
               <div className="bg-paper/80 border-2 border-primary/50 rounded-xl px-6 py-5 text-center flex items-center justify-center gap-4 shadow-[0_0_20px_rgba(102,252,241,0.2)]">
                  <img src={user?.avatarUrl} className="w-12 h-12 rounded-full bg-secondary border-2 border-primary" alt="avatar" />
                  <span className="text-xl font-bold">Welcome back, {user?.username}</span>
               </div>
            )}
            <button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 text-background px-8 py-5 rounded-xl font-black text-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-[0_0_30px_rgba(102,252,241,0.5)] tracking-widest mt-2"
            >
              {isAuthenticated ? 'ENTER DASHBOARD' : 'PLAY NOW'} <ArrowRight className="w-8 h-8" />
            </button>
          </form>
        </motion.div>
      </main>

      <section id="features" className="py-32 px-6 relative bg-paper border-t border-white/5 z-20">
         <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-black font-display text-center mb-20 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">ESPORTS READY FEATURES</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               <FeatureCard icon={<Zap/>} title="Real-Time Engine" desc="Ultra low-latency socket synchronization for perfectly timed competitive modes."/>
               <FeatureCard icon={<Users/>} title="Squad Battles" desc="Team up with friends, aggregate scores, and dominate the team leaderboard."/>
               <FeatureCard icon={<ShieldBan/>} title="Anti-Cheat V2" desc="Tab-tracking, blur detection, and instant host alerts keep matches clean."/>
               <FeatureCard icon={<Trophy/>} title="Live XP & Rank" desc="Earn XP, climb the ranks from Bronze to Radiant, and unlock rare badges."/>
               <FeatureCard icon={<Gamepad2/>} title="Action Minigames" desc="Between trivia rounds, test your reaction time and APM with action minigames."/>
               <FeatureCard icon={<Flame/>} title="Powerup Inventory" desc="Deploy Shields, freeze opponents, or steal coins mid-match."/>
            </div>
         </div>
      </section>

      <section id="about" className="py-20 px-6 bg-background text-center border-t border-white/5 z-20">
         <h2 className="text-3xl font-black text-white mb-6">BUILT FOR THE FUTURE OF LEARNING & GAMING</h2>
         <p className="text-accent max-w-2xl mx-auto text-lg leading-relaxed">
            QuizQuest Arena merges the engagement of modern competitive games with educational mechanics. 
            Create assignments or host live matches with up to 200 concurrent players instantly.
         </p>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="bg-background/50 border border-white/5 p-8 rounded-3xl hover:border-primary/50 transition-all hover:-translate-y-2 group shadow-xl">
      <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
         {React.cloneElement(icon, { className: 'w-8 h-8' })}
      </div>
      <h3 className="text-2xl font-bold mb-4 text-white">{title}</h3>
      <p className="text-accent leading-relaxed">{desc}</p>
    </div>
  )
}
