# QuizQuest Arena

## Overview
QuizQuest Arena is a real-time competitive multiplayer quiz gaming platform, combining esports-style gameplay with trivia mechanics.

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
(Starts the Game Engine / Socket Server on port 3000)

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
(Starts the React/Vite Dev Server)

## Architecture Roadmap
Currently implemented:
- Full Monorepo-style structure
- Game Engine base via Socket.io
- React Router Client
- Esports Neon Cyberpunk UI (Tailwind + Framer Motion)
- Lobby Connection state management

Pending steps (To be done in next iterations):
- Firebase Auth Integration
- Anti-Cheating tab monitoring
- Live quiz rendering & powerups
- Database schema syncing
