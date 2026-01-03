import { GoogleGenAI, Type } from "@google/genai";
import { InterviewConfig, AnalysisResult, Message, InterviewType } from "../types";

// Schema for the final summary report
const feedbackSchema = {
  type: Type.OBJECT,
  properties: {
    feedback: {
      type: Type.STRING,
      description: "Detailed feedback paragraph.",
    },
    summaryQuote: {
      type: Type.STRING,
      description: "A 1-2 sentence high-level summary of the candidate's performance, written in third person. e.g. 'Candidate demonstrated strong technical basics but lacked confidence...'",
    },
    score: {
      type: Type.NUMBER,
      description: "Overall interview performance score (0-100).",
    },
    technicalScore: {
      type: Type.NUMBER,
      description: "Rating of technical knowledge and accuracy (0-100).",
    },
    communicationScore: {
      type: Type.NUMBER,
      description: "Rating of language fluency and articulation (0-100).",
    },
    problemSolvingScore: {
      type: Type.NUMBER,
      description: "Rating of logical thinking and approach (0-100).",
    },
    clarityScore: {
      type: Type.NUMBER,
      description: "Rating of answer structure and clarity (0-100).",
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: "Rating of vocal confidence and delivery (0-100).",
    },
    keyStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3 specific strengths demonstrated.",
    },
    keyWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3 specific areas for improvement.",
    },
  },
  required: [
    "feedback", "summaryQuote", "score", 
    "technicalScore", "communicationScore", "problemSolvingScore", 
    "clarityScore", "confidenceScore", 
    "keyStrengths", "keyWeaknesses"
  ],
};

// Legacy method for standard text/chat based interactions
export const generateInterviewTurn = async (
  config: InterviewConfig,
  history: { role: string; parts: { text: string }[] }[],
  lastUserAnswer: string | null
): Promise<AnalysisResult> => {
   return {
       score: 0, technicalScore: 0, communicationScore: 0, problemSolvingScore: 0,
       clarityScore: 0, confidenceScore: 0, summaryQuote: "",
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

  let promptContext = "";

  if (config.type === InterviewType.COMMUNICATION_SIMPLE) {
      promptContext = `
        IMPORTANT: This was a "Simple Communication Interview" for early-career students.
        
        Evaluation Guidelines:
        - Use VERY SIMPLE language in the feedback. No corporate jargon.
        - Focus heavily on "Communication Score" and "Confidence Score".
        - Ignore deep technical accuracy; focus on clarity, sentence structure, and comfort level.
        - Provide encouraging "Strengths" and polite "Areas for Improvement".
        - The "summaryQuote" should be simple and direct.
      `;
  } else {
      promptContext = `
        Evaluation Guidelines:
        - Be strict but constructive.
        - Evaluate professional readiness for a ${config.role} role.
        - Rate specific skills (Technical, Communication, etc) critically.
        - The summaryQuote should be a direct, professional observation.
      `;
  }

  const prompt = `
    Analyze the following interview transcript.
    Interview Context: ${config.type}, Difficulty: ${config.difficulty}.
    
    ${promptContext}
    
    Transcript:
    ${transcript}
    
    Provide a comprehensive evaluation JSON based on the schema.
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
    
    const result = JSON.parse(jsonText);
    return {
        ...result,
        improvedAnswer: "See detailed feedback above.", 
        nextQuestion: "Interview Completed",
        isInterviewOver: true
    } as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return a fallback result to avoid crashing UI
    return {
        score: 0, technicalScore: 0, communicationScore: 0, problemSolvingScore: 0,
        clarityScore: 0, confidenceScore: 0, summaryQuote: "Analysis failed due to technical error.",
        feedback: "Could not generate report.", keyStrengths: [], keyWeaknesses: []
    };
  }
};