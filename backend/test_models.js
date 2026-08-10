const { GoogleGenAI } = require("@google/genai");

async function test() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        // Let's try 2.0-flash or pro
        let response;
        try {
            response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: "hi",
            });
            console.log("SUCCESS gemini-2.0-flash:", response.text);
        } catch(e) {
            console.error("FAIL gemini-2.0-flash:", e.message);
        }
        
        try {
            response = await ai.models.generateContent({
                model: 'gemini-1.5-pro',
                contents: "hi",
            });
            console.log("SUCCESS gemini-1.5-pro:", response.text);
        } catch(e) {
            console.error("FAIL gemini-1.5-pro:", e.message);
        }

    } catch (e) {
        console.error("ERROR:", e);
    }
}

test();
