import { InterviewType, Difficulty } from './types';

export const INITIAL_GREETING = "Hello. I am your interviewer for today. I've reviewed your profile. Let's begin with a simple introduction.";

export const INTERVIEW_TYPES = [
  { value: InterviewType.TECHBEE, label: 'TechBee / Early Career Program (Managerial)' },
  { value: InterviewType.COMMUNICATION_SIMPLE, label: 'Simple Communication (TechBee Prep)' },
  { value: InterviewType.CAMPUS, label: 'Campus Placement / Fresher' },
  { value: InterviewType.TRAINEE, label: 'IT Support / Software Trainee' },
  { value: InterviewType.MANAGERIAL, label: 'Managerial Round (General)' },
  { value: InterviewType.BEHAVIORAL, label: 'HR / Behavioral' },
];

export const DIFFICULTIES = [
  { value: Difficulty.FRESHER, label: 'Fresher (0-1 year)' },
  { value: Difficulty.JUNIOR, label: 'Junior (1-2 years)' },
  { value: Difficulty.MID, label: 'Mid-Level (3+ years)' },
];

export const PERSONAS = [
  { value: 'Professional', label: 'Professional (Default)', desc: 'Balanced and polite' },
  { value: 'Friendly', label: 'Friendly', desc: 'Warm, encouraging, and patient' },
  { value: 'Neutral', label: 'Neutral', desc: 'Objective and formal' },
  { value: 'Stern', label: 'Stern', desc: 'Direct, critical, and challenging' },
];

export const VOICES = [
  { value: 'Kore', label: 'Kore (Female, Soothing)' },
  { value: 'Puck', label: 'Puck (Male, Energetic)' },
  { value: 'Charon', label: 'Charon (Male, Deep)' },
  { value: 'Fenrir', label: 'Fenrir (Male, Authoritative)' },
  { value: 'Aoede', label: 'Aoede (Female, Clear)' },
];

export const MOCK_CHART_DATA = [
  { question: 'Q1', score: 65 },
  { question: 'Q2', score: 80 },
  { question: 'Q3', score: 75 },
  { question: 'Q4', score: 90 },
  { question: 'Q5', score: 85 },
];