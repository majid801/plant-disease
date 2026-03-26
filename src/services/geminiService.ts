import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function detectDisease(base64Image: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Analyze this plant leaf image. 
  Identify the plant name, the disease (if any), confidence score (0-1), severity (Low, Medium, High), 
  recommended pesticide, dosage (ml per liter), organic alternative, and estimated yield loss percentage if untreated.
  Return the result in JSON format.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          plantName: { type: Type.STRING },
          diseaseName: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          severity: { type: Type.STRING },
          pesticide: { type: Type.STRING },
          dosage: { type: Type.STRING },
          organicAlternative: { type: Type.STRING },
          yieldLossEstimate: { type: Type.STRING }
        },
        required: ["plantName", "diseaseName", "confidence", "severity", "pesticide", "dosage", "organicAlternative", "yieldLossEstimate"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function chatWithDoctor(message: string, history: { role: string, content: string }[]) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are an expert agricultural scientist and plant doctor. Provide helpful, accurate, and eco-friendly advice to farmers about plant diseases, pesticides, and crop management. Keep responses concise and practical."
    }
  });

  // Convert history to Gemini format
  const contents = history.map(h => ({
    role: h.role === "user" ? "user" : "model",
    parts: [{ text: h.content }]
  }));

  const response = await chat.sendMessage({ message });
  return response.text;
}
