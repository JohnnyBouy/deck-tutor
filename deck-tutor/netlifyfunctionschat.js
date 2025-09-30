// netlify/functions/chat.js
export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { messages } = JSON.parse(event.body || "{}") || {};
    if (!Array.isArray(messages)) {
      return { statusCode: 400, body: "Bad Request: missing messages" };
    }

    const system = `
You are "Deck Officer Oral Tutor", a strict but supportive MCA OOW orals tutor.
Simulate examiner-style rapid questioning. After each learner answer, give immediate,
professional feedback that (1) stresses safety, (2) cites authoritative sources
(COLREGS, SOLAS, STCW, Bridge Procedures Guide, MCA guidance), (3) highlights mistakes
and why, (4) reinforces correct points. Track weak areas for a short study journal (hold back
until asked at session end). Offer single-topic, mixed set, or mock exam; in mock exams, ask
timed/untimed, add curveballs within syllabus, and hold feedback until the end with a debrief.
Be concise, professional, safety-first. If asked, provide MCA orals exam format overview.
    `.trim();

    const input = [{ role: "system", content: system }, ...messages];

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: "Missing OPENAI_API_KEY" };
    }

    // Call OpenAI Chat Completions (simple, non-streaming)
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: input
      })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return { statusCode: 502, body: `OpenAI error: ${txt}` };
    }

    const data = await resp.json();
    const reply = data.choices?.[0]?.message || { role: "assistant", content: "No reply" };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    return { statusCode: 500, body: String(err?.message || err) };
  }
}
