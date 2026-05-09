import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encrypt";

export interface StreamChunk {
  type: "text" | "done" | "error";
  content?: string;
  error?: string;
}

async function getActiveProvider() {
  const key = await db.apiKey.findFirst({ where: { isActive: true } });
  if (!key) throw new Error("Kein aktiver API-Key konfiguriert. Bitte in den Einstellungen hinterlegen.");
  const rawKey = decrypt(key.encryptedKey);
  return { provider: key.provider, model: key.model, rawKey };
}

export async function* streamAgentResponse(
  systemPrompt: string,
  userPrompt: string
): AsyncGenerator<StreamChunk> {
  const { provider, model, rawKey } = await getActiveProvider();

  try {
    if (provider === "anthropic") {
      const client = new Anthropic({ apiKey: rawKey });
      const stream = client.messages.stream({
        model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          yield { type: "text", content: event.delta.text };
        }
      }
    } else {
      const baseURLMap: Record<string, string> = {
        openai: "https://api.openai.com/v1",
        deepseek: "https://api.deepseek.com/v1",
        openrouter: "https://openrouter.ai/api/v1",
      };
      const extraHeaders: Record<string, string> =
        provider === "openrouter"
          ? {
              "HTTP-Referer": "https://continuum-audit.de",
              "X-Title": "Continuum Audit",
            }
          : {};

      const client = new OpenAI({
        apiKey: rawKey,
        baseURL: baseURLMap[provider],
        defaultHeaders: extraHeaders,
      });

      const stream = await client.chat.completions.create({
        model,
        max_tokens: 2048,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield { type: "text", content: delta };
      }
    }

    yield { type: "done" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    yield { type: "error", error: msg };
  }
}

export async function callAgentOnce(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  let full = "";
  for await (const chunk of streamAgentResponse(systemPrompt, userPrompt)) {
    if (chunk.type === "text") full += chunk.content;
    if (chunk.type === "error") throw new Error(chunk.error);
  }
  return full;
}
