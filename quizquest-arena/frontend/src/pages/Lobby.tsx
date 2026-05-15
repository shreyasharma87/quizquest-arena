import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Play, Loader } from 'lucide-react';
import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export default function Lobby() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { room, me, startGame } = useGameStore();

  useEffect(() => {
    if (room?.gameState.status === 'starting' || room?.gameState.status === 'question') {
      if (me?.isHost) {
        navigate(`/host/${roomId}`);
      } else {
        navigate(`/game/${roomId}`);
      }
    }
  }, [room?.gameState.status, navigate, roomId, me?.isHost]);

  if (!room) return (
    <div className="flex-1 flex items-center justify-center flex-col gap-4 text-primary">
      <Loader className="w-12 h-12 animate-spin" />
      <h2 className="text-2xl font-mono">Connecting to Arena...</h2>
    </div>
  );

  const players = Object.values(room.players);

  return (
    <div className="flex-1 flex flex-col p-6 max-w-6xl mx-auto w-full pt-12">
      <header className="flex justify-between items-center mb-12 bg-paper/50 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
        <div>
          <h2 className="text-3xl font-display font-black text-primary uppercase tracking-wider">
            Room Code: <span className="bg-background/50 px-4 py-1 rounded-lg text-white ml-2">{roomId}</span>
          </h2>
          <p className="text-accent flex items-center gap-2 mt-4 text-lg">
            <Users className="w-5 h-5" /> {players.length} Pilots Joined
          </p>
        </div>
        {me?.isHost ? (
          <button 
            onClick={() => startGame()}
            className="bg-primary text-background px-8 py-4 rounded-xl font-bold text-xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(102,252,241,0.5)]"
          >
            <Play className="w-6 h-6 fill-current" /> LAUNCH ARENA
          </button>
        ) : (
          <div className="flex items-center gap-3 text-accent font-mono text-lg animate-pulse bg-paper px-6 py-4 rounded-xl border border-white/5">
            <Loader className="w-5 h-5 animate-spin" /> Waiting for host to launch...
          </div>
        )}
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {players.map((player, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={player.id}
            className={`border ${player.id === me?.id ? 'border-primary shadow-[0_0_15px_rgba(102,252,241,0.2)]' : 'border-white/10'} bg-paper/40 rounded-xl p-6 flex flex-col items-center text-center relative overflow-hidden group`}
          >
            <div className="relative w-16 h-16 mb-4">
              {player.avatarUrl ? (
                <img src={player.avatarUrl} alt={player.username} className="w-full h-full rounded-full bg-secondary/20 border-2 border-primary/50 object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-secondary/20 border-2 border-primary/50 flex items-center justify-center text-2xl font-bold text-primary">
                  {player.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="font-semibold text-lg truncate w-full">{player.username}</span>
            {player.isHost && (
              <span className="text-xs text-warning border border-warning/50 rounded-full px-3 py-1 mt-3 font-mono">
                HOST
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

