export enum InterviewType {
  TECHBEE = 'TechBee / Early Career',
  COMMUNICATION_SIMPLE = 'Simple Communication (TechBee Prep)',
  CAMPUS = 'Campus Fresher',
  TRAINEE = 'IT Support / Software Trainee',
  MANAGERIAL = 'Managerial Round',
  BEHAVIORAL = 'Behavioral (HR)'
}

export enum Difficulty {
  FRESHER = 'Fresher (0-1 year)',
  JUNIOR = 'Junior (1-2 years)',
  MID = 'Mid-Level (3-5 years)',
}

export interface InterviewConfig {
  role: string;
  type: InterviewType;
  difficulty: Difficulty;
  company?: string;
  topic?: string;
  mode: 'standard' | 'stress';
  persona?: string;
  voice?: string;
  speed?: number;
}

export interface AnalysisResult {
  score: number; // Overall 0-100
  technicalScore: number; // 0-100
  communicationScore: number; // 0-100
  problemSolvingScore: number; // 0-100
  clarityScore: number; // 0-100
  confidenceScore: number; // 0-100
  summaryQuote: string;
  feedback: string;
  improvedAnswer?: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
  nextQuestion?: string; // Optional for final report
  isInterviewOver?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  analysis?: AnalysisResult;
  timestamp: number;
}

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  messages: Message[];
  status: 'idle' | 'active' | 'completed';
  averageScore: number;
}