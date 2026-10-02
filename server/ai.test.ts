import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const caller = appRouter.createCaller({
  user: null,
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("AI input contracts", () => {
  it("rejects resume analysis when the resume is too short", async () => {
    await expect(
      caller.ai.analyze({ resume: "too short", jobDescription: "A product designer role with research and prototyping." }),
    ).rejects.toThrow();
  });

  it("rejects chat when there is no message history", async () => {
    await expect(
      caller.ai.chat({
        resume: "A".repeat(40),
        jobDescription: "A".repeat(40),
        messages: [],
      }),
    ).rejects.toThrow();
  });
});
