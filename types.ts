export enum InterviewType {
  BEHAVIORAL = 'Behavioral',
  TECHNICAL = 'Technical',
  SYSTEM_DESIGN = 'System Design',
  CODING = 'Coding Concepts'
}

export enum Difficulty {
  JUNIOR = 'Junior',
  MID = 'Mid-Level',
  SENIOR = 'Senior',
  STAFF = 'Staff/Principal'
}

export interface InterviewConfig {
  role: string;
  type: InterviewType;
  difficulty: Difficulty;
  company?: string; // Optional target company
  topic?: string; // Specific focus (e.g., "React", "Distributed Systems")
}

export interface AnalysisResult {
  score: number; // 0-100
  feedback: string;
  improvedAnswer: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
  nextQuestion: string;
  isInterviewOver: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string; // Display content (question or answer)
  analysis?: AnalysisResult; // Only present on assistant messages after a user turn
  timestamp: number;
}

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  messages: Message[];
  status: 'idle' | 'active' | 'completed';
  averageScore: number;
}
