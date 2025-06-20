import z from "zod";
import type { Request, Response } from "express";

import { sessions } from "modules/upload/helpers";
import { errorStatusCodes, successStatusCodes } from "utils/api";

const answerSubmissionSchema = z.object({
  answer: z.string(),
  sessionId: z.string(),
  placeholderId: z.string(),
});

export async function handleAnswerSubmission(req: Request, res: Response) {
  const resp = answerSubmissionSchema.safeParse(req.body);
  if (!resp.success) {
    res.status(errorStatusCodes.BAD_REQUEST).json({ message: "Invalid request body." });
    return;
  }

  const { sessionId, placeholderId, answer } = resp.data;

  if (!sessions[sessionId]) {
    res.status(errorStatusCodes.NOT_FOUND).json({ message: "Session not found." });
    return;
  }

  const placeholder = sessions[sessionId].placeholders.find((p) => p.id === placeholderId);
  if (!placeholder) {
    res.status(errorStatusCodes.NOT_FOUND).json({ message: "Placeholder not found." });
    return;
  }

  sessions[sessionId].answers[placeholderId] = answer;

  res.status(successStatusCodes.OK).json({ message: "Answer saved." });
}
