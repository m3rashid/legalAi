import z from "zod";
import type { Request, Response } from "express";

import { errorStatusCodes } from "utils/api";
import { sessions } from "modules/upload/helpers";
import { generateDocumentFromSession } from "modules/upload/controllers/generateDoc";

const generateFinalDocumentSchema = z.object({
  sessionId: z.string(),
});

export async function generateFinalDocument(req: Request, res: Response) {
  const resp = generateFinalDocumentSchema.safeParse(req.body);
  if (!resp.success) {
    res.status(errorStatusCodes.BAD_REQUEST).json({ message: "Invalid request body." });
    return;
  }

  const { sessionId } = resp.data;
  const session = sessions[sessionId];

  if (!session) {
    res.status(errorStatusCodes.NOT_FOUND).json({ message: "Session not found." });
    return;
  }

  const buffer = await generateDocumentFromSession(sessionId, session);

  res.setHeader("Content-Disposition", "attachment; filename=completed_document.docx");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.send(buffer);
}
