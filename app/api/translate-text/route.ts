import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { bubbles, targetLang, modelPreference } = await req.json();
    
    if (!bubbles || !Array.isArray(bubbles)) {
      return NextResponse.json({ error: "Missing or invalid text data" }, { status: 400 });
    }

    if (bubbles.length === 0) {
      return NextResponse.json({ text: JSON.stringify({ bubbles: [] }) });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing API Key. Please add GEMINI_API_KEY to .env" }, { status: 500 });
    }

    const promptText = 
      `Translate the following JSON list of text blocks to ${targetLang || 'Thai'}.\n`+
      `The input format is {"bubbles":[{"t":"original text","box":[ymin,xmin,ymax,xmax]}]}.\n`+
      `Output ONLY valid JSON, no markdown, no explanation.\n`+
      `The output format must be EXACTLY the same, but with the text translated:\n`+
      `{"bubbles":[{"t":"translated text","box":[ymin,xmin,ymax,xmax]}]}\n`+
      `Keep the 'box' arrays exactly the same as the input.\n`+
      `Translate ALL text. ALL translations MUST be in ${targetLang || 'Thai'}. Never use English unless target IS English.\n\n`+
      `INPUT DATA:\n`+
      JSON.stringify({ bubbles }, null, 2);

    const payload = {
      contents: [{
        parts: [
          { text: promptText }
        ]
      }],
      safetySettings: [
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    let MODELS = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro-latest",
      "gemini-1.5-flash-latest"
    ];

    if (modelPreference && modelPreference !== "auto") {
      MODELS = [modelPreference];
    }

    let data = null;
    let resOk = false;
    let resStatus = 500;
    let firstError = null;

    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      data = await res.json();
      resOk = res.ok;
      resStatus = res.status;

      if (resOk) break; // Success, exit loop
      
      const errorMsg = data?.error?.message || "Unknown error";
      console.warn(`Model ${model} failed with status ${res.status}: ${errorMsg}`);
      
      if (!firstError) firstError = errorMsg;
      
      if (modelPreference && modelPreference !== "auto") {
        break;
      }
      
      if (res.status === 400 || res.status === 403 || res.status === 429) {
        break; 
      }
    }

    if (!resOk) {
      console.error("Gemini API Error after all fallbacks:", data);
      return NextResponse.json({ error: firstError || "Failed to translate from Gemini after multiple attempts" }, { status: resStatus });
    }

    if (data.promptFeedback?.blockReason) {
      console.error("Prompt blocked by Gemini:", data.promptFeedback);
      return NextResponse.json({ error: `เนื้อหาถูกปฏิเสธโดยระบบคัดกรอง (เหตุผล: ${data.promptFeedback.blockReason})` }, { status: 400 });
    }

    const candidate = data.candidates?.[0];
    if (candidate?.finishReason === "SAFETY" || candidate?.finishReason === "PROHIBITED_CONTENT") {
      return NextResponse.json({ error: "เนื้อหาถูกแบนโดยระบบ Safety ของ AI" }, { status: 400 });
    }

    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("Gemini returned unexpected format:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: "AI ไม่สามารถอ่านข้อความนี้ได้" }, { status: 500 });
    }

    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return NextResponse.json({ text: cleanText });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
