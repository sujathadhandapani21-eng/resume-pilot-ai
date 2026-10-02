import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { generateAnalysis, generateChat } from "./gemini";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(5000),
});

const analysisSchema = z.object({
  score: z.number().min(0).max(100),
  scoreLabel: z.string(),
  summary: z.string(),
  strengths: z.array(z.string()).min(1).max(5),
  gaps: z.array(z.string()).min(1).max(5),
  skills: z.array(z.object({
    label: z.string(),
    value: z.number().min(0).max(100),
    tone: z.enum(["lime", "orange", "ink"]),
  })).min(3).max(5),
  recommendations: z.array(z.object({
    id: z.string(),
    priority: z.enum(["High", "Medium", "Low"]),
    title: z.string(),
    detail: z.string(),
    original: z.string().optional(),
    suggestion: z.string().optional(),
  })).min(2).max(5),
});

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "text" in item) return String((item as { text?: unknown }).text ?? "");
      return "";
    }).join("\n");
  }
  return "";
}

const analysisResponseFormat = {
  type: "json_schema" as const,
  json_schema: {
    name: "resume_audit",
    strict: true,
    schema: {
      type: "object",
      properties: {
        score: { type: "number", description: "A transparent estimate from 0 to 100 based only on role-relevant evidence." },
        scoreLabel: { type: "string" },
        summary: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        gaps: { type: "array", items: { type: "string" } },
        skills: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "number" }, tone: { type: "string", enum: ["lime", "orange", "ink"] } }, required: ["label", "value", "tone"], additionalProperties: false } },
        recommendations: { type: "array", items: { type: "object", properties: { id: { type: "string" }, priority: { type: "string", enum: ["High", "Medium", "Low"] }, title: { type: "string" }, detail: { type: "string" }, original: { type: "string" }, suggestion: { type: "string" } }, required: ["id", "priority", "title", "detail", "original", "suggestion"], additionalProperties: false } },
      },
      required: ["score", "scoreLabel", "summary", "strengths", "gaps", "skills", "recommendations"],
      additionalProperties: false,
    },
  },
};

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  ai: router({
    analyze: publicProcedure
      .input(z.object({ resume: z.string().min(30).max(30000), jobDescription: z.string().min(20).max(30000) }))
      .mutation(async ({ input }) => {
        const raw = await generateAnalysis(input.resume, input.jobDescription, JSON.stringify(analysisResponseFormat.json_schema.schema));
        return analysisSchema.parse(JSON.parse(raw));
      }),
    chat: publicProcedure
      .input(z.object({ resume: z.string().min(30).max(30000), jobDescription: z.string().min(20).max(30000), messages: z.array(messageSchema).min(1).max(20) }))
      .mutation(async ({ input }) => {
        return await generateChat(input.resume, input.jobDescription, input.messages) || "I could not generate a response. Try asking about one specific bullet or skill.";
      }),
  }),
});

export type AppRouter = typeof appRouter;
