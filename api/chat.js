// Save this file as: api/chat.js  (inside a folder named "api")
const MODEL = "gemini-3.5-flash"; // if you see errors, try "gemini-2.5-flash"

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { system, messages = [] } = req.body || {};
    const contents = messages.map((m) => {
      const parts = [{ text: m.text || "" }];
      const img = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(m.image || "");
      if (img) parts.unshift({ inlineData: { mimeType: img[1], data: img[2] } });
      return { role: m.role === "model" ? "model" : "user", parts };
    });
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_KEY },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system || "" }] }, contents }),
      }
    );
    const d = await r.json();
    const text = (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    if (!r.ok || !text) return res.status(502).json({ error: "AI error" });
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
};
