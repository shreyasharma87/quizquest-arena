import { Server, Socket } from 'socket.io';
import { Player, Room, AnswerPayload, ActivityLog, UsePowerupPayload, ChatMessage, MatchRecord } from '../../../shared/types';
import { defaultQuestions } from '../data/questions';

const rooms: Record<string, Room> = {};
const timers: Record<string, NodeJS.Timeout> = {};
const matchHistory: MatchRecord[] = [];

export function setupSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    
    const isHost = (roomId: string) => rooms[roomId] && rooms[roomId].hostId === socket.id;

    socket.on('joinRoom', ({ roomId, username, forceRole }) => {
      // Prevent duplicate usernames inside the same room (case-insensitive)
      if (rooms[roomId] && rooms[roomId].players) {
        const isTaken = Object.values(rooms[roomId].players).some(
          p => p.username.toLowerCase() === username.toLowerCase() && p.id !== socket.id
        );
        if (isTaken) {
          let suggestedUsername = username;
          let suffix = 42;
          while (true) {
            const candidate = `${username}_${suffix}`;
            const taken = Object.values(rooms[roomId].players).some(
              p => p.username.toLowerCase() === candidate.toLowerCase()
            );
            if (!taken) {
              suggestedUsername = candidate;
              break;
            }
            suffix = Math.floor(Math.random() * 90) + 10;
          }

          socket.emit('joinError', {
            message: 'Username already taken in this room',
            suggestedUsername
          });
          return;
        }
      }

      socket.join(roomId);
      
      if (!rooms[roomId]) {
        rooms[roomId] = {
          roomId,
          hostId: socket.id,
          players: {},
          gameState: { status: 'waiting', currentQuestionIndex: 0, timer: 0, isPaused: false },
          settings: { antiCheatEnabled: true, powerupsEnabled: true, teamMode: false, maxCapacity: 100, gameMode: 'live' },
          questions: [...defaultQuestions],
          activityLogs: [],
          chatMessages: []
        };
      }

      const role = rooms[roomId].hostId === socket.id ? 'host' : (forceRole || 'player');
      
      const newPlayer: Player = {
        id: socket.id,
        username,
        score: 0,
        health: 100,
        streak: 0,
        coins: 0,
        role,
        status: 'lobby',
        powerupsInventory: ['shield', 'freeze'],
        activeEffects: {},
        warnings: 0,
        isReady: false,
        currentQuestionIndex: 0,
        assignmentFinished: false
      };

      rooms[roomId].players[socket.id] = newPlayer;
      io.to(roomId).emit('roomState', rooms[roomId]);
    });

    socket.on('getHistory', () => {
      socket.emit('historyData', matchHistory);
    });

    socket.on('updateSettings', ({ roomId, settings }) => {
      if (!isHost(roomId)) return;
      const room = rooms[roomId];
      if (room) {
        room.settings = { ...room.settings, ...settings };
        io.to(roomId).emit('roomState', room);
      }
    });

    socket.on('updatePlayerProfile', ({ roomId, profile }) => {
      const room = rooms[roomId];
      if (!room || !room.players[socket.id]) return;
      room.players[socket.id] = { ...room.players[socket.id], ...profile };
      io.to(roomId).emit('roomState', room);
    });

    socket.on('assignTeams', (roomId: string) => {
      if (!isHost(roomId)) return;
      const room = rooms[roomId];
      if (!room) return;
      const players = Object.values(room.players).filter(p => p.role === 'player');
      const teams = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'];
      
      players.sort(() => Math.random() - 0.5);
      const numTeams = Math.min(players.length, 4) > 1 ? Math.min(players.length, 4) : 2;
      
      players.forEach((p, i) => {
        p.team = teams[i % numTeams];
      });
      
      io.to(roomId).emit('roomState', room);
      logActivity(roomId, io, 'system', 'Host shuffled and assigned teams.', socket.id);
    });

    socket.on('toggleReady', (roomId: string) => {
      const room = rooms[roomId];
      if (room && room.players[socket.id]) {
        room.players[socket.id].isReady = !room.players[socket.id].isReady;
        io.to(roomId).emit('roomState', room);
      }
    });

    socket.on('sendChatMessage', ({ roomId, text }) => {
      const room = rooms[roomId];
      if (!room) return;
      const player = room.players[socket.id];
      const senderName = player ? player.username : (isHost(roomId) ? 'HOST' : 'Unknown');
      
      const msg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: socket.id,
        senderName,
        text: text.substring(0, 200),
        timestamp: Date.now(),
        isSystem: false
      };
      
      room.chatMessages.push(msg);
      if (room.chatMessages.length > 100) room.chatMessages.shift();
      io.to(roomId).emit('roomState', room);
    });

    socket.on('addQuestion', ({ roomId, question }) => {
      if (!isHost(roomId)) return;
      const newQuestion = { id: Math.random().toString(36).substr(2, 9), ...question };
      rooms[roomId].questions.push(newQuestion);
      io.to(roomId).emit('roomState', rooms[roomId]);
    });

    socket.on('deleteQuestion', ({ roomId, questionId }) => {
      if (!isHost(roomId)) return;
      rooms[roomId].questions = rooms[roomId].questions.filter(q => q.id !== questionId);
      io.to(roomId).emit('roomState', rooms[roomId]);
    });

    socket.on('startGame', (roomId: string) => {
      if (!isHost(roomId)) return;
      const room = rooms[roomId];
      room.gameState.status = 'starting';
      room.gameState.timer = 5;
      io.to(roomId).emit('roomState', room);

      const countdown = setInterval(() => {
        if (room.gameState.isPaused) return;
        room.gameState.timer -= 1;
        io.to(roomId).emit('timerUpdate', room.gameState.timer);
        
        if (room.gameState.timer <= 0) {
          clearInterval(countdown);
          
          if (room.settings.gameMode === 'assignment') {
             room.gameState.status = 'question';
             Object.values(room.players).forEach(p => {
                p.currentQuestionIndex = 0;
                p.assignmentFinished = false;
             });
             io.to(roomId).emit('roomState', room);
          } else {
             startQuestion(roomId, io);
          }
        }
      }, 1000);
    });

    socket.on('endGame', (roomId: string) => {
      if (!isHost(roomId)) return;
      finishGame(roomId, io);
    });

    socket.on('pauseGame', (roomId: string) => {
      if (!isHost(roomId)) return;
      rooms[roomId].gameState.isPaused = true;
      io.to(roomId).emit('roomState', rooms[roomId]);
      logActivity(roomId, io, 'system', 'Host paused the match', socket.id);
    });

    socket.on('resumeGame', (roomId: string) => {
      if (!isHost(roomId)) return;
      rooms[roomId].gameState.isPaused = false;
      io.to(roomId).emit('roomState', rooms[roomId]);
      logActivity(roomId, io, 'system', 'Host resumed the match', socket.id);
    });

    socket.on('kickPlayer', ({ roomId, targetId }) => {
      if (!isHost(roomId)) return;
      if (rooms[roomId].players[targetId]) {
        const pName = rooms[roomId].players[targetId].username;
        delete rooms[roomId].players[targetId];
        io.to(targetId).emit('kicked');
        io.to(roomId).emit('roomState', rooms[roomId]);
        logActivity(roomId, io, 'system', `Kicked player ${pName}`, socket.id);
      }
    });

    socket.on('reportSuspicious', ({ roomId, type, description }) => {
      const room = rooms[roomId];
      if (!room || !room.settings.antiCheatEnabled) return;
      const player = room.players[socket.id];
      if (!player) return;
      
      player.warnings += 1;
      player.score = Math.max(0, player.score - 50);
      
      logActivity(roomId, io, type, description, socket.id);
      io.to(roomId).emit('roomState', room);
      io.to(socket.id).emit('cheatWarning', description);
    });

    socket.on('usePowerup', ({ roomId, powerup, targetId }: UsePowerupPayload) => {
      const room = rooms[roomId];
      if (!room || room.gameState.isPaused || !room.settings.powerupsEnabled) return;

      const user = room.players[socket.id];
      if (!user || !user.powerupsInventory.includes(powerup)) return;

      user.powerupsInventory.splice(user.powerupsInventory.indexOf(powerup), 1);
      const target = targetId ? room.players[targetId] : null;

      if (powerup === 'shield') {
        user.activeEffects.shieldActive = true;
        logActivity(roomId, io, 'combat', `${user.username} deployed a Shield.`, socket.id);
      } else if (powerup === 'double_points') {
        user.activeEffects.doublePointsActive = true;
        logActivity(roomId, io, 'combat', `${user.username} activated Double Points!`, socket.id);
      } else if (target && target.id !== user.id) {
        if (target.activeEffects.shieldActive) {
           target.activeEffects.shieldActive = false; 
           io.to(target.id).emit('powerupBlocked');
           logActivity(roomId, io, 'combat', `${target.username}'s shield blocked an attack from ${user.username}!`, target.id);
        } else {
           if (powerup === 'freeze') {
             target.activeEffects.frozenUntil = Date.now() + 5000;
             logActivity(roomId, io, 'combat', `${user.username} froze ${target.username}!`, socket.id);
           } else if (powerup === 'bomb') {
             target.health = Math.max(0, target.health - 30);
             logActivity(roomId, io, 'combat', `${user.username} bombed ${target.username} for 30 HP!`, socket.id);
           } else if (powerup === 'steal_coins') {
             const stolen = Math.min(50, target.coins);
             target.coins -= stolen;
             user.coins += stolen;
             logActivity(roomId, io, 'combat', `${user.username} stole ${stolen} coins from ${target.username}!`, socket.id);
           }
        }
      }
      io.to(roomId).emit('roomState', room);
    });

    socket.on('submitAnswer', (payload: AnswerPayload) => {
      const room = rooms[payload.roomId];
      if (!room || room.gameState.status !== 'question' || room.gameState.isPaused) return;

      const player = room.players[socket.id];
      if (!player || player.role === 'spectator') return;
      if (player.activeEffects.frozenUntil && player.activeEffects.frozenUntil > Date.now()) return; 

      if (room.settings.gameMode === 'assignment') {
         if (player.assignmentFinished) return;
         if (room.settings.assignmentDeadline && Date.now() > room.settings.assignmentDeadline) return; // Deadline check
         
         const qIndex = player.currentQuestionIndex || 0;
         const question = room.questions[qIndex];
         
         let isCorrect = false;
         let pointsEarned = 0;

         if (question.type === 'mcq' || question.type === 'boolean') {
           isCorrect = payload.selectedOptionIndex === question.correctOptionIndex;
           pointsEarned = isCorrect ? question.points : 0;
         } else if (question.type === 'short_answer' || question.type === 'long_answer') {
           const expected = (question.correctTextAnswer || '').toLowerCase().trim();
           const received = (payload.textAnswer || '').toLowerCase().trim();
           isCorrect = expected === received;
           pointsEarned = isCorrect ? question.points : 0;
         } else if (question.type === 'minigame') {
           isCorrect = true; 
           pointsEarned = (payload.minigameScore || 0) * question.points;
         }

         if (isCorrect) {
           const multiplier = player.activeEffects.doublePointsActive ? 2 : 1;
           player.score += pointsEarned * multiplier;
           player.activeEffects.doublePointsActive = false; 
           player.streak += 1;
           player.coins += 10 + (player.streak * 2);
         } else {
           player.streak = 0;
           player.health = Math.max(0, player.health - 20);
         }

         player.currentQuestionIndex = qIndex + 1;
         if (player.currentQuestionIndex >= room.questions.length) {
            player.assignmentFinished = true;
         }
         io.to(payload.roomId).emit('roomState', room);
         return;
      }

      // Live Mode Logic
      if (player.hasAnswered) return;
      
      const question = room.questions[payload.questionIndex];
      let isCorrect = false;
      let pointsEarned = 0;

      if (question.type === 'mcq' || question.type === 'boolean') {
        isCorrect = payload.selectedOptionIndex === question.correctOptionIndex;
        pointsEarned = isCorrect ? question.points : 0;
      } else if (question.type === 'short_answer' || question.type === 'long_answer') {
        const expected = (question.correctTextAnswer || '').toLowerCase().trim();
        const received = (payload.textAnswer || '').toLowerCase().trim();
        isCorrect = expected === received;
        pointsEarned = isCorrect ? question.points : 0;
      } else if (question.type === 'minigame') {
        isCorrect = true; 
        pointsEarned = (payload.minigameScore || 0) * question.points;
      }

      player.hasAnswered = true;
      player.isCorrect = isCorrect;

      if (isCorrect) {
        let speedBonus = 0;
        if (question.type !== 'minigame') {
          speedBonus = Math.floor((room.gameState.timer / question.timeLimit) * 50);
        }

        const multiplier = player.activeEffects.doublePointsActive ? 2 : 1;
        player.score += (pointsEarned + speedBonus) * multiplier;
        player.activeEffects.doublePointsActive = false; 
        
        player.streak += 1;
        player.coins += 10 + (player.streak * 2);

        if (player.streak > 0 && player.streak % 3 === 0 && room.settings.powerupsEnabled) {
           if (player.powerupsInventory.length < 3) {
             const pTypes: import('../../../shared/types').PowerupType[] = ['freeze', 'bomb', 'steal_coins', 'shield', 'double_points'];
             player.powerupsInventory.push(pTypes[Math.floor(Math.random() * pTypes.length)]);
           }
        }
      } else {
        player.streak = 0;
        player.health = Math.max(0, player.health - 20);
      }

      io.to(payload.roomId).emit('roomState', room);
      
      const activePlayers = Object.values(room.players).filter(p => p.role === 'player');
      const allAnswered = activePlayers.length > 0 && activePlayers.every(p => p.hasAnswered);
      if (allAnswered) {
        endQuestion(payload.roomId, io);
      }
    });

    socket.on('nextQuestion', (roomId: string) => {
      if (!isHost(roomId)) return;
      const room = rooms[roomId];
      room.gameState.currentQuestionIndex += 1;
      if (room.gameState.currentQuestionIndex >= room.questions.length) {
        finishGame(roomId, io);
      } else {
        startQuestion(roomId, io);
      }
    });

    socket.on('disconnect', () => {
      for (const roomId in rooms) {
        if (rooms[roomId].players[socket.id]) {
          delete rooms[roomId].players[socket.id];
          io.to(roomId).emit('roomState', rooms[roomId]);
          if (Object.keys(rooms[roomId].players).length === 0) {
            const room = rooms[roomId];
            const isAssignment = room.settings.gameMode === 'assignment';
            const isExpired = room.settings.assignmentDeadline && Date.now() > room.settings.assignmentDeadline;
            
            // Delete room only if it's Live mode OR an expired/finished assignment
            if (!isAssignment || isExpired || room.gameState.status === 'finished') {
              delete rooms[roomId];
            }
          }
        }
      }
    });
  });

  // Background Task: Check for Assignment Deadlines
  setInterval(() => {
    const now = Date.now();
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (
        room.settings.gameMode === 'assignment' && 
        room.settings.assignmentDeadline && 
        now > room.settings.assignmentDeadline && 
        room.gameState.status !== 'finished'
      ) {
        console.log(`[ARENA ENGINE] Deadline Reached for Room ${roomId}. Closing submissions.`);
        finishGame(roomId, io);
        
        // Log to activity log
        room.activityLogs.unshift({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          playerId: 'SYSTEM',
          playerName: 'SYSTEM',
          type: 'system',
          description: 'Assignment deadline reached. Submissions closed automatically.'
        });
        if (room.activityLogs.length > 50) room.activityLogs.pop();
        io.to(roomId).emit('roomState', room);
      }
    }
  }, 30000); // Check every 30 seconds
}

function logActivity(roomId: string, io: Server, type: ActivityLog['type'], description: string, playerId: string) {
  const room = rooms[roomId];
  const playerName = room.players[playerId]?.username || 'System';
  room.activityLogs.unshift({
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    playerId,
    playerName,
    type,
    description
  });
  if (room.activityLogs.length > 50) room.activityLogs.pop();
  io.to(roomId).emit('roomState', room);
}

function startQuestion(roomId: string, io: Server) {
  const room = rooms[roomId];
  if (!room) return;

  room.gameState.status = 'question';
  const question = room.questions[room.gameState.currentQuestionIndex];
  room.gameState.timer = question.timeLimit;
  
  Object.values(room.players).forEach(p => {
    p.hasAnswered = false;
    p.isCorrect = false;
  });

  io.to(roomId).emit('roomState', room);

  if (timers[roomId]) clearInterval(timers[roomId]);

  timers[roomId] = setInterval(() => {
    if (room.gameState.isPaused) return;
    room.gameState.timer -= 1;
    io.to(roomId).emit('timerUpdate', room.gameState.timer);

    if (room.gameState.timer <= 0) {
      endQuestion(roomId, io);
    }
  }, 1000);
}

function endQuestion(roomId: string, io: Server) {
  const room = rooms[roomId];
  if (!room) return;

  if (timers[roomId]) {
    clearInterval(timers[roomId]);
    delete timers[roomId];
  }

  room.gameState.status = 'leaderboard';
  io.to(roomId).emit('roomState', room);
}

function finishGame(roomId: string, io: Server) {
  const room = rooms[roomId];
  if (!room) return;
  room.gameState.status = 'finished';
  
  const players = Object.values(room.players).filter(p => p.role !== 'host');
  const leaderboard = players.map(p => ({
    username: p.username,
    score: p.score,
    team: p.team
  })).sort((a, b) => b.score - a.score);

  matchHistory.push({
    id: Math.random().toString(36).substr(2, 9),
    roomId,
    date: Date.now(),
    gameMode: room.settings.gameMode,
    leaderboard
  });
  
  io.to(roomId).emit('roomState', room);
}
