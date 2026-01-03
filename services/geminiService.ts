import { GoogleGenAI, Type } from "@google/genai";
import { InterviewConfig, AnalysisResult, Message } from "../types";

// Schema for the final summary report
const feedbackSchema = {
  type: Type.OBJECT,
  properties: {
    feedback: {
      type: Type.STRING,
      description: "Comprehensive feedback on the candidate's performance.",
    },
    score: {
      type: Type.NUMBER,
      description: "Overall interview performance score (0-100).",
    },
    structureScore: {
      type: Type.NUMBER,
      description: "Average structure score (1-10).",
    },
    clarityScore: {
      type: Type.NUMBER,
      description: "Average clarity and articulation score (1-10).",
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: "Average confidence score (1-10).",
    },
    keyStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3 key strengths demonstrated.",
    },
    keyWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3 areas for improvement.",
    },
  },
  required: ["feedback", "score", "structureScore", "clarityScore", "confidenceScore", "keyStrengths", "keyWeaknesses"],
};

// Legacy method for standard text/chat based interactions (if needed) or initial prompt setup
export const generateInterviewTurn = async (
  config: InterviewConfig,
  history: { role: string; parts: { text: string }[] }[],
  lastUserAnswer: string | null
): Promise<AnalysisResult> => {
   // This acts as a fallback or initial state generator if we were using text mode. 
   // For Live API, we primarily use this logic embedded in the system instruction.
   return {
       score: 0, structureScore: 0, clarityScore: 0, confidenceScore: 0,
       feedback: "", improvedAnswer: "", keyStrengths: [], keyWeaknesses: [],
       nextQuestion: "Ready to start.", isInterviewOver: false
   };
};

// New method to analyze the full transcript after the Live session
export const generateFinalFeedback = async (
  config: InterviewConfig,
  messages: Message[]
): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

  const prompt = `
    Analyze the following interview transcript for a ${config.role} role.
    Interview Context: ${config.type}, Difficulty: ${config.difficulty}.
    
    Transcript:
    ${transcript}
    
    Provide a comprehensive evaluation based on the candidate's answers.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: feedbackSchema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    // Map the simple feedback schema to our AnalysisResult type
    const result = JSON.parse(jsonText);
    return {
        ...result,
        improvedAnswer: "See detailed feedback above.", 
        nextQuestion: "Interview Completed",
        isInterviewOver: true
    } as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};