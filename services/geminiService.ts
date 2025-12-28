import { GoogleGenAI, Type } from "@google/genai";
import { InterviewConfig, AnalysisResult } from "../types";

// Define the response schema for the interview feedback
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    feedback: {
      type: Type.STRING,
      description: "Constructive feedback on the user's answer. Be specific about what was missing or what was good.",
    },
    score: {
      type: Type.NUMBER,
      description: "A score from 0 to 100 based on the quality of the answer relevant to the role level.",
    },
    improvedAnswer: {
      type: Type.STRING,
      description: "An example of a better or ideal answer to the previous question.",
    },
    keyStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 1-3 strong points in the answer.",
    },
    keyWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 1-3 weak points or missing details.",
    },
    nextQuestion: {
      type: Type.STRING,
      description: "The next interview question to ask. If this was the first turn, this is the first question.",
    },
    isInterviewOver: {
      type: Type.BOOLEAN,
      description: "True if the interview session should end (e.g., after 5-6 questions).",
    },
  },
  required: ["feedback", "score", "improvedAnswer", "nextQuestion", "isInterviewOver", "keyStrengths", "keyWeaknesses"],
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
  
  // Construct a robust system prompt
  const systemInstruction = `
    You are an expert technical interviewer conducting a mock interview.
    Role: ${config.role}
    Level: ${config.difficulty}
    Type: ${config.type}
    ${config.company ? `Target Company Style: ${config.company}` : ''}
    ${config.topic ? `Focus Topic: ${config.topic}` : ''}

    Your Goal:
    1. Ask relevant, challenging questions appropriate for the ${config.difficulty} level.
    2. Analyze the candidate's response critically.
    3. Provide structured feedback.
    4. Keep the interview professional and focused.
    5. Ask one question at a time.
    6. If 'lastUserAnswer' is null, this is the start. Generate the first question in the 'nextQuestion' field and leave feedback/score empty or neutral (score -1 to indicate start).
    7. After 5 questions, set 'isInterviewOver' to true.
  `;

  // Prepare the prompt
  let prompt = "";
  if (!lastUserAnswer) {
    prompt = "Start the interview. Provide the first question.";
  } else {
    prompt = `The candidate answered: "${lastUserAnswer}". Analyze this answer and provide the next question.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history, // Previous conversation context
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster turn-around in chat
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
