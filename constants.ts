import { InterviewType, Difficulty } from './types';

export const INITIAL_GREETING = "I'm ready to start your interview. I'll act as a strict but fair interviewer. Good luck.";

export const INTERVIEW_TYPES = [
  { value: InterviewType.BEHAVIORAL, label: 'Behavioral (STAR Method)' },
  { value: InterviewType.TECHNICAL, label: 'Technical Knowledge' },
  { value: InterviewType.SYSTEM_DESIGN, label: 'System Design' },
  { value: InterviewType.CODING, label: 'Coding Concepts & DSA' },
];

export const DIFFICULTIES = [
  { value: Difficulty.JUNIOR, label: 'Junior (0-2 years)' },
  { value: Difficulty.MID, label: 'Mid-Level (2-5 years)' },
  { value: Difficulty.SENIOR, label: 'Senior (5+ years)' },
  { value: Difficulty.STAFF, label: 'Staff/Principal' },
];

export const MOCK_CHART_DATA = [
  { question: 'Q1', score: 65 },
  { question: 'Q2', score: 80 },
  { question: 'Q3', score: 75 },
  { question: 'Q4', score: 90 },
  { question: 'Q5', score: 85 },
];
