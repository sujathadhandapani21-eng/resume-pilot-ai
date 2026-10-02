import { ENV } from "./_core/env";

const MODEL = "gemini-2.0-flash";

type GeminiPart = { text: string };
type GeminiContent = { role?: "user" | "model"; parts: GeminiPart[] };

function extractText(data: any): string {
  return data?.candidates?.[0]?.content?.parts?.map((part: GeminiPart) => part.text).join("\n") ?? "";
}

async function generate(contents: GeminiContent[], systemInstruction: string, json = false): Promise<string> {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(ENV.geminiApiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: json ? { responseMimeType: "application/json", temperature: 0.2 } : { temperature: 0.3 },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 500)}`);
  }

  const data = await response.json();
  const text = extractText(data);
  if (!text) throw new Error("Gemini returned an empty response");
  return text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
}

export function generateAnalysis(resume: string, jobDescription: string, schema: string) {
  return generate(
    [{ role: "user", parts: [{ text: `RESUME:\n${resume}\n\nTARGET ROLE:\n${jobDescription}\n\nReturn JSON matching this schema exactly:\n${schema}` }] }],
    "You are ResumePilot, an evidence-grounded resume coach. Compare the resume to the target role. Never invent facts, metrics, employers, dates, or skills. If a metric is missing, use a placeholder like [add verified metric]. Do not use protected characteristics. Return only valid JSON.",
    true,
  );
}

export function generateChat(resume: string, jobDescription: string, messages: Array<{ role: "user" | "assistant"; content: string }>) {
  const contents: GeminiContent[] = [
    { role: "user", parts: [{ text: `RESUME:\n${resume}\n\nTARGET ROLE:\n${jobDescription}` }] },
    ...messages.map((message) => ({ role: message.role === "assistant" ? "model" as const : "user" as const, parts: [{ text: message.content }] })),
  ];
  return generate(contents, "You are ResumePilot's concise career coach. Ground every answer in the provided resume and target role. Never invent candidate facts. If evidence is missing, say so and suggest a way to verify it. Keep answers practical and under 180 words.");
}
