const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MIRA_SYSTEM_INSTRUCTION = `You are Mira, the startup coach on "Skill to Startup" — a platform that helps
people turn a skill they already have into a small, real business. Your voice: warm, practical, no jargon, no
pitch-deck talk. You believe useful beats impressive, one person is a market, and the next step should be small
enough to take today. You ask one thoughtful question at a time rather than lecturing. Keep replies conversational
and fairly short (2-4 sentences), the way a good coach texts, not the way a blog post reads. Never claim to book
sessions, send emails, or take real-world actions — you only talk.`;

// POST /api/mira/chat
// Body: {
//   message: string,
//   history?: [{ role: "user" | "mira", text: string }]
// }

const chatWithMira = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "message is required.",
      });
    }

    // Keep only the last ~10 turns
    // This keeps the request small and preserves recent conversation context.
    const recentHistory = Array.isArray(history) ? history.slice(-10) : [];

    const contents = [
      ...recentHistory.map((turn) => ({
        role: turn.role === "mira" ? "model" : "user",
        parts: [
          {
            text: String(turn.text || "").slice(0, 2000),
          },
        ],
      })),

      {
        role: "user",
        parts: [
          {
            text: message.trim().slice(0, 2000),
          },
        ],
      },
    ];

    // Try the primary model first.
    // If Google temporarily returns 503, try the fallback model.
    const modelsToTry = [
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
      "gemini-3.7-flash",
    ];

    let response = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Mira trying model: ${model}`);

        response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: MIRA_SYSTEM_INSTRUCTION,
          },
        });

        console.log(`Mira succeeded with model: ${model}`);

        break;
      } catch (error) {
        lastError = error;

        console.error(
          `Mira model ${model} failed:`,
          error?.status || error?.code,
          error?.message || error,
        );

        // 503 means the model is temporarily unavailable.
        // Try the next model.
        if (error?.status === 503 || error?.code === 503) {
          continue;
        }

        // For other errors such as 400, 401, 403 or 404,
        // stop immediately because trying another model
        // will not necessarily fix the underlying problem.
        throw error;
      }
    }

    // None of the models succeeded.
    if (!response) {
      throw lastError;
    }

    const reply = response.text;

    if (!reply) {
      throw new Error("Gemini returned an empty response.");
    }

    res.json({
      reply,
    });
  } catch (error) {
    console.error("Mira controller error:", error);
    next(error);
  }
};

module.exports = {
  chatWithMira,
};
