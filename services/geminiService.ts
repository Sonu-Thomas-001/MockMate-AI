import { GoogleGenAI, Type } from "@google/genai";
import { InterviewConfig, AnalysisResult } from "../types";

// Define the response schema for the interview feedback
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    feedback: {
      type: Type.STRING,
      description: "Internal Post-Interview Feedback logic. Store this for the final report. Do NOT output this as spoken text.",
    },
    score: {
      type: Type.NUMBER,
      description: "Overall quality score of the answer (0-100).",
    },
    structureScore: {
      type: Type.NUMBER,
      description: "Structure (Intro-Body-Conclusion) score 1-10.",
    },
    clarityScore: {
      type: Type.NUMBER,
      description: "Clarity and professional tone score 1-10.",
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: "Confidence score based on phrasing (1-10).",
    },
    improvedAnswer: {
      type: Type.STRING,
      description: "A better version of the candidate's answer.",
    },
    keyStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 1-3 strong points.",
    },
    keyWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 1-3 areas for improvement.",
    },
    nextQuestion: {
      type: Type.STRING,
      description: "The next spoken line by the interviewer. This is the ONLY part the user hears.",
    },
    isInterviewOver: {
      type: Type.BOOLEAN,
      description: "True if the closure phase is reached.",
    },
  },
  required: ["feedback", "score", "structureScore", "clarityScore", "confidenceScore", "improvedAnswer", "nextQuestion", "isInterviewOver", "keyStrengths", "keyWeaknesses"],
};

export const generateInterviewTurn = async (
  config: InterviewConfig,
  history: { role: string; parts: { text: string }[] }[],
  lastUserAnswer: string | null
): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Construct the specific MockMate AI System Prompt
  const systemInstruction = `
    Role:
    You are MockMate AI, a professional corporate interviewer conducting a live voice interview for HCL TechBee / early-career IT roles.
    
    Context:
    - Candidate Role: ${config.role}
    - Type: ${config.type}
    - Mode: ${config.mode}
    
    Core Interaction Rules (CRITICAL):
    1. **Voice-Only Interaction**: You are speaking to the candidate. Your 'nextQuestion' field is your spoken voice. Keep it natural, calm, and slightly formal.
    2. **No Interruptions**: Never interrupt. Acknowledge briefly before moving on.
    3. **No Hints**: Do NOT give feedback, corrections, or suggestions during the interview. Save all evaluation for the hidden analysis fields.
    4. **Output**: Only the 'nextQuestion' is spoken. All other fields (feedback, scores) are for the post-interview dashboard.

    Interview Structure (Follow this strictly):
    
    Phase 1: Introduction (If history is empty)
    - Greeting: "Good morning. This will be a short interview. Please answer clearly and honestly. Let’s begin."
    - Wait for the user to say "Okay" or "Ready" before asking Q1.
    
    Phase 2: Core Interview Questions (Ask strictly in this order, one by one):
    1. "Tell me about yourself."
    2. "What do you know about HCL Technologies?" (Or the specific company if defined: ${config.company || 'the company'})
    3. "What do you know about the TechBee program, and why did you choose it?" (Adjust based on config.type if not TechBee)
    4. "Where do you see yourself in the next five to ten years?"
    5. "Why do you want to become a software engineer?"
    
    Phase 3: Dynamic Follow-Up Logic
    - If an answer is too short, lacks clarity, or sounds memorized: Ask ONE follow-up question to probe deeper (e.g., "Can you elaborate on that?", "Could you give a specific example?").
    - Do NOT ask more than one follow-up per core question.
    - After the follow-up, move immediately to the next core question.
    
    Phase 4: Closure
    - After Q5 (and any follow-up), end politely: "Thank you. This concludes the interview. You may now review your feedback."
    - Set 'isInterviewOver' to true.

    Internal Evaluation (Fill in JSON fields silently):
    - Analyze confidence, sentence flow, hesitation, and logical structure.
    - Detect 'fillers' (um, uh) based on the transcript provided.
  `;

  // Prepare the prompt
  let prompt = "";
  if (!lastUserAnswer) {
    prompt = "The candidate has entered the room. Start Phase 1: Introduction.";
  } else {
    prompt = `The candidate answered: "${lastUserAnswer}". 
    
    Instructions:
    1. Silently evaluate this answer in the JSON fields (score, feedback, etc).
    2. Determine if a follow-up is needed (Phase 3).
    3. If no follow-up needed, or if this WAS a follow-up, proceed to the next question in the Phase 2 list.
    4. Generate the 'nextQuestion' spoken response.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history, 
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    return JSON.parse(jsonText) as AnalysisResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};