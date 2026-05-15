import { Question } from '../../../shared/types';

export const defaultQuestions: Question[] = [
  {
    id: 'q1',
    type: 'mcq',
    text: 'What does CPU stand for?',
    options: ['Central Process Unit', 'Computer Personal Unit', 'Central Processing Unit', 'Central Processor Unit'],
    correctOptionIndex: 2,
    timeLimit: 15,
    points: 100
  },
  {
    id: 'q2',
    type: 'minigame',
    text: 'MATH BLITZ! SOLVE AS MANY AS YOU CAN!',
    minigameType: 'math_blitz',
    timeLimit: 15,
    points: 10
  },
  {
    id: 'q3',
    type: 'short_answer',
    text: 'What is the standard port for HTTPS?',
    correctTextAnswer: '443',
    timeLimit: 15,
    points: 200
  },
  {
    id: 'q4',
    type: 'minigame',
    text: 'TARGET SMASH! CLICK THE DOTS FAST!',
    minigameType: 'target_smash',
    timeLimit: 10,
    points: 5
  },
  {
    id: 'q5',
    type: 'minigame',
    text: 'MEMORY CHECK. REPEAT THE SEQUENCE!',
    minigameType: 'memory_sequence',
    timeLimit: 20,
    points: 50
  }
];
