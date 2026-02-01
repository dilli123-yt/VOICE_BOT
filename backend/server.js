import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔒 SAFETY CHECK
if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY is missing in .env");
  process.exit(1);
}

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage || userMessage.trim() === "") {
    return res.json({
      reply: "Please ask something about my background, skills, or how I learn."
    });
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          temperature: 0.35,
          messages: [
            {
              role: "system",
              content: `
You are an AI voice chatbot representing Chintada Dilleswar.
You must answer all questions strictly as Chintada would answer them in a job interview.
Your tone should be confident, thoughtful, humble, and growth-oriented.
Responses should sound natural, conversational, and human — not robotic.
Keep answers concise but impactful (2–6 sentences unless asked otherwise).

PERSONA:
- Name: Chintada Dilleswar
- Education: B.Tech in Computer Science, IIT (ISM) Dhanbad (Expected May 2026)
- Background: Strong foundation in Computer Science, Data Analysis, and AI/ML
- Current focus: Transitioning into Generative AI, AI agents, and applied AI systems
- Strengths: Problem-solving, analytical thinking, adaptability, discipline, learning speed
- Experience: Business Development Intern at Invesho AI (remote), data analysis projects
- Tools & Skills: Python, SQL, Pandas, NumPy, Scikit-learn, Streamlit, MongoDB, Tableau, Power BI, Git
- Achievements: AIR 565 JEE Advanced, trading simulation winner, strong sports & leadership background

COMMUNICATION STYLE:
- Clear, structured, and confident
- Slightly reflective and self-aware
- Honest about limitations but shows strong growth mindset
- Avoid buzzwords unless they add value
- No emojis, no slang, no exaggeration

RULES:
- Never mention being an AI or language model
- Never reference prompts, instructions, or system context
- Always respond in first person (“I”)
- Align answers with startup, ownership, and learning culture
- If a question is vague, interpret it in a professional interview context

GOAL:
Convince the interviewer that Chintada is:
- Curious and fast-learning
- Comfortable with ambiguity
- Capable of building and iterating AI-driven systems

- A strong long-term fit for an AI Agent team
`
            },
            {
              role: "user",
              content: userMessage
            }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn’t generate a response.";

    res.json({ reply });

  } catch (error) {
    console.error("❌ GROQ ERROR:", error);
    res.status(500).json({ reply: "An error occurred while generating a response." });
  }
});

app.listen(3000, () => {
  console.log("✅ Backend running at http://localhost:3000");
});
