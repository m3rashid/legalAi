import type { Request, Response } from "express";

export async function handleAnswerSubmission(req: Request, res: Response) {
  console.log(req.body);
}
