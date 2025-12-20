
import { GoogleGenAI } from "@google/genai";
import { Goal, QuarterDetail } from "../types";

const getAmt = (q: QuarterDetail) => (q.rate || 0) * (q.quantity || 0);

export const getBudgetInsights = async (goals: Goal[]): Promise<string> => {
  // Always initialize GoogleGenAI with the API key from process.env
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const summary = goals.map(g => ({
    goal: g.name,
    activities: g.activities.map(a => ({
      name: a.name,
      quarterlySpend: {
        q1: a.subActivities.reduce((sum, s) => sum + getAmt(s.q1), 0),
        q2: a.subActivities.reduce((sum, s) => sum + getAmt(s.q2), 0),
        q3: a.subActivities.reduce((sum, s) => sum + getAmt(s.q3), 0),
        q4: a.subActivities.reduce((sum, s) => sum + getAmt(s.q4), 0),
      }
    }))
  }));

  const prompt = `Act as a senior CFO and Strategic Analyst. Analyze this SBU budget hierarchy which includes detailed quarterly disbursements based on unit rates and quantities.
  
  Hierarchy Context: ${JSON.stringify(summary)}
  
  Please provide:
  1. A critical audit of the spend phasing across the 4 quarters.
  2. Identification of any 'lumpy' spend or front-loading risks.
  3. Strategic suggestions on unit cost optimization or activity alignment.
  
  Format as professional Markdown. Be concise and hard-hitting.`;

  try {
    // Using gemini-3-pro-preview for complex reasoning and strategic analysis
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { temperature: 0.65 },
    });
    
    // Access the .text property directly to extract output
    return response.text || "No insights available.";
  } catch (error) {
    console.error("AI Error:", error);
    return "The AI consultant is currently unavailable. Please verify API connectivity.";
  }
};
