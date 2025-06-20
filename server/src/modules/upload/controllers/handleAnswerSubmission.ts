import type { Request, Response } from "express";
import { errorStatusCodes, successStatusCodes } from "../../../utils/api";
import { sessions } from "./handleUploadedFile";

export async function handleAnswerSubmission(req: Request, res: Response) {
  console.log(req.body);
  const { sessionId, placeholder, answer } = req.body;
  if (!sessions[sessionId]) {
    res.status(errorStatusCodes.NOT_FOUND).json({ message: "Session not found." });
    return;
  }

  // Store the answer
  sessions[sessionId].answers[placeholder] = answer;
  console.log(`Session ${sessionId} - Answer for "${placeholder}": "${answer}"`);

  res.status(successStatusCodes.OK).json({ message: "Answer saved." });
}
