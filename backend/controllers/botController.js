const pool = require("../config/db");
const axios = require("axios");
const { assignDriver } = require("../models/assignmentModel");
const { updateParcelStatus } = require("../models/parcelModel");
const { addTracking } = require("../models/trackingModel");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * FLOWLINK PLATFORM KNOWLEDGE BASE FOR GOOGLE GEMINI AI
 */
const FLOWLINK_SYSTEM_PROMPT = `
You are FlowLink AI, the official conversational intelligence assistant for the FlowLink Micro-Commute Freight Network.

PLATFORM IDENTITY & RULES:
- Brand Name: FlowLink
- Nature: Intracity & Micro-Commute Freight Logistics Platform.
- Currency: ALL PRICES ARE STRICTLY IN INDIAN RUPEES (₹). Never use dollars ($).
- Maximum Operating Range: Strictly 80 km per shipment.

DYNAMIC PRICING MODEL (IN INDIAN RUPEES ₹):
1. Option A — Shared Route (Saver / Co-traveler Courier):
   - Base Fare & Fees: ₹20.00
   - Distance Rate: ₹4.00 per km
   - Weight Rate: ₹2.00 per kg
   - Example 5 km (2 kg): ₹20 + (5 * 4) + (2 * 2) = ₹44.00 (delivered along driver's existing route).

2. Option B — Priority Direct (Express Point-to-Point):
   - Base Fare & Fees: ₹35.00
   - Distance Rate: ₹7.00 per km
   - Weight Rate: ₹3.50 per kg
   - Example 5 km (2 kg): ₹35 + (5 * 7) + (2 * 3.5) = ₹77.00 (direct express pickup).

3. Surge Pricing Multiplier:
   - Applied dynamically during high demand (1.15x–1.25x).
4. Personalization Factor:
   - 5% to 10% loyalty discount for repeat customers.

USER ROLES:
1. Customer (User): Books shipments, tracks live driver progress on radar, reviews delivery history.
2. Driver: Commuters who register vehicles (Bike, Scooter, Car, Van), accept nearby assignments along their daily routine, and earn verified payouts on completion.
3. Administrator: Full system oversight, real-time fleet radar, smart dispatch matcher, user/driver management, analytics.

AUTHENTICATION & SECURITY:
- Users register with email and verify with a 6-digit Email OTP.
- Drivers register with mobile number and verify with SMS OTP.
- Google One-Tap / OAuth integration available for fast onboarding.
- Tracking: Anyone can track shipments publicly at /tracking using Parcel ID or Tracking Code.
- Dispatch System: Uses AI-driven proximity and route matching within an 80km radius.

INSTRUCTIONS FOR RESPONSES:
- Always quote prices in Indian Rupees (₹).
- Respond naturally, helpfully, and conversationally in clean Markdown.
- Answer ANY question the user asks about the platform, dynamic pricing, surge rates, personalization, deliveries, driver requirements, technology stack, or logistics.
- If the user asks a real-time question (e.g., "How many drivers are free?" or "Where is parcel 5?"), use the provided REAL-TIME PLATFORM DATA below.
`;

/**
 * Enhanced Fallback Knowledge Base (in case of network/quota issues)
 */
const FALLBACK_KB = [
    {
        keywords: ["who are you", "what is flowlink", "introduce", "about flowlink", "about project"],
        reply: "🚚 **FlowLink** is an intelligent intracity micro-commute freight network connecting everyday commuters and fleet drivers with same-day parcel deliveries across Indian cities within an 80km radius."
    },
    {
        keywords: ["price", "pricing", "cost", "how much", "rate", "calculate", "rupee", "inr"],
        reply: "💰 **FlowLink Dynamic Pricing Model (in ₹ INR):**\n- **Base Fare & Fees:** ₹65.00 (Flat ₹40 base + ₹15 booking fee + ₹10 toll/surcharge)\n- **Variable Rates:** ₹12/km distance + ₹2/min travel time + ₹5/kg weight\n- **⚡ Surge Pricing:** Dynamic multiplier (1.2x–1.35x) during peak demand & rush hours (8-11 AM & 5-9 PM)\n- **✨ Personalization:** Up to 10% loyalty discount for frequent shippers\n- *Strict distance limit:* Up to **80 km** max."
    },
    {
        keywords: ["driver", "earn", "vehicle", "how to become driver", "commuter"],
        reply: "🚗 **Driver Opportunities:**\n- Daily commuters can register with a **Bike, Scooter, Car, or Van** at `/driver/register`.\n- Pick up parcels along your routine route and receive instant earnings in **₹ INR** upon delivery!"
    },
    {
        keywords: ["track", "tracking", "where is my package", "status"],
        reply: "📍 **Live Tracking:**\nYou can track any shipment in real-time by entering its Parcel ID or Tracking Code on the **Tracking Page** (`/tracking`)."
    }
];

function extractNumbers(str) {
    const matches = str.match(/\d+/g);
    return matches ? matches.map(n => parseInt(n, 10)) : [];
}

/**
 * Call Google Gemini API
 */
async function callGeminiAI(userMessage, systemContext) {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not configured in .env");
    }

    const promptText = `
${systemContext}

USER'S MESSAGE / QUESTION:
"${userMessage}"

Provide a direct, helpful, and natural response in markdown:
`;

    // Try Google Gemini 2.0 Flash / 1.5 Flash endpoints
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    
    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            const res = await axios.post(url, {
                contents: [{ parts: [{ text: promptText }] }]
            }, { timeout: 10000 });

            const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim()) {
                return text.trim();
            }
        } catch (err) {
            // If quota error or model not found, try next model
            continue;
        }
    }

    throw new Error("All Gemini model endpoints exhausted");
}

/**
 * Main Controller Handler
 */
const processCommand = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ reply: "Please enter a message or question." });
        }

        const raw = message.trim();
        const text = raw.toLowerCase();
        const user = req.user ? req.user : { full_name: "Guest", role: "visitor" };

        // 1. Fetch Real-time Database Context to give Gemini live awareness
        let statsContext = "";
        try {
            const statsRes = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM parcels) as total_parcels,
                    (SELECT COUNT(*) FROM parcels WHERE status='Pending') as pending_parcels,
                    (SELECT COUNT(*) FROM parcels WHERE status='In Transit' OR status='Assigned') as active_parcels,
                    (SELECT COUNT(*) FROM parcels WHERE status='Delivered') as delivered_parcels,
                    (SELECT COUNT(*) FROM drivers) as total_drivers,
                    (SELECT COUNT(*) FROM drivers WHERE status='Available') as free_drivers,
                    (SELECT COUNT(*) FROM drivers WHERE status='Busy') as busy_drivers
            `);
            const s = statsRes.rows[0] || {};
            statsContext = `
REAL-TIME PLATFORM SNAPSHOT:
- Current Authenticated User: ${user.full_name} (Role: ${user.role})
- Total Parcels in System: ${s.total_parcels || 0}
- Pending Parcels: ${s.pending_parcels || 0}
- In-Transit / Active Parcels: ${s.active_parcels || 0}
- Delivered Parcels: ${s.delivered_parcels || 0}
- Total Registered Drivers: ${s.total_drivers || 0}
- Available Drivers: ${s.free_drivers || 0}
- Busy Drivers: ${s.busy_drivers || 0}
`;
        } catch (dbErr) {
            statsContext = "REAL-TIME PLATFORM SNAPSHOT: (Database temporarily syncing)";
        }

        // 2. Direct Operational Shortcuts (for manual admin actions)
        // Assignment action: "assign parcel 1 to driver 2"
        if (text.startsWith("assign") || (text.includes("assign") && (text.includes("parcel") || text.includes("package")))) {
            const nums = extractNumbers(text);
            if (nums.length >= 2) {
                const parcelId = nums[0];
                const driverId = nums[1];
                try {
                    await assignDriver(parcelId, driverId);
                    return res.json({
                        reply: `⚡ **Success!** Parcel **#${parcelId}** has been assigned to Driver **#${driverId}**. The driver status is now **Busy** and tracking is active!`
                    });
                } catch (assignErr) {
                    return res.json({
                        reply: `⚠️ **Assignment Notice:** Unable to assign Parcel #${parcelId} to Driver #${driverId} (${assignErr.message || 'Check IDs'}).`
                    });
                }
            }
        }

        // Status update shortcut: "mark parcel 1 as delivered"
        if (text.includes("mark parcel") || text.includes("set parcel") || (text.includes("parcel") && text.includes("delivered"))) {
            const nums = extractNumbers(text);
            if (nums.length >= 1) {
                const parcelId = nums[0];
                let newStatus = "Delivered";
                if (text.includes("transit") || text.includes("picked up")) newStatus = "In Transit";
                if (text.includes("pending")) newStatus = "Pending";
                if (text.includes("cancelled")) newStatus = "Cancelled";

                try {
                    await updateParcelStatus(parcelId, newStatus);
                    await addTracking(parcelId, `Status updated to ${newStatus} by ${user.full_name}`);
                    return res.json({
                        reply: `✅ **Milestone Updated:** Parcel **#${parcelId}** status changed to **${newStatus}** and tracking synced!`
                    });
                } catch (updateErr) {
                    // Fallthrough to AI
                }
            }
        }

        // 3. Natural Language Processing via Google Gemini API
        const fullSystemContext = `${FLOWLINK_SYSTEM_PROMPT}\n${statsContext}`;

        try {
            const geminiReply = await callGeminiAI(raw, fullSystemContext);
            return res.json({ reply: geminiReply });
        } catch (aiError) {
            console.log("Gemini API fallback engaged:", aiError.message);

            // 4. Intelligent Fallback matching
            for (const item of FALLBACK_KB) {
                if (item.keywords.some(kw => text.includes(kw))) {
                    return res.json({ reply: item.reply });
                }
            }

            // General informative fallback
            return res.json({
                reply: `👋 **FlowLink AI:** I'm here to help with all intracity micro-commute logistics! You can ask about our **$5 + $1/km + $0.50/kg pricing**, live tracking on the **80km radius network**, fleet driver registration, or platform operations.`
            });
        }

    } catch (error) {
        console.error("Bot Controller Error:", error);
        return res.status(500).json({ reply: "An error occurred while processing your query." });
    }
};

module.exports = { processCommand };
