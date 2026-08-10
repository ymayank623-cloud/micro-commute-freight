const { GoogleGenAI } = require("@google/genai");

async function test() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "hi",
        });
        console.log("SUCCESS:", response.text);
    } catch (e) {
        console.error("ERROR:", e);
    }
}

test();
