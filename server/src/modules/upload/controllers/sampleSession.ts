import fs from "node:fs/promises";
import { v4 as uuidv4 } from "uuid";
import type { Request, Response } from "express";

import type { Placeholder, Session } from "modules/upload/helpers";
import { generateDocumentFromSession } from "modules/upload/controllers/generateDoc";

const samplePlaceholders: Placeholder[] = [
  {
    type: "named",
    key: "[Company Name]",
    id: "placeholder_b9bf93b2-a9e4-4832-8ca2-f49626781bfb",
    question: 'What is the "Company Name"?',
  },
  {
    type: "named",
    key: "[Investor Name]",
    id: "placeholder_910b8375-b7ff-4994-9252-798a203d2014",
    question: 'What is the "Investor Name"?',
  },
  {
    type: "named",
    key: "[Date of Safe]",
    id: "placeholder_bef65dd5-d154-47dd-8404-8b7a88a82ef2",
    question: 'What is the "Date of Safe"?',
  },
  {
    type: "named",
    key: "[State of Incorporation]",
    id: "placeholder_6f304aa2-46fa-409f-89aa-2ac662d61f50",
    question: 'What is the "State of Incorporation"?',
  },
  {
    type: "named",
    key: "[Governing Law Jurisdiction]",
    id: "placeholder_93bc035c-6b8a-4322-8b68-6844ae9eb242",
    question: 'What is the "Governing Law Jurisdiction"?',
  },
  {
    type: "named",
    key: "[COMPANY]",
    id: "placeholder_0908178e-554e-48e9-bfd3-1e0d8c1882de",
    question: 'What is the "COMPANY"?',
  },
  {
    type: "named",
    key: "[name]",
    id: "placeholder_b928fca7-0531-491f-a81c-030760e1d2c6",
    question: 'What is the "name"?',
  },
  {
    type: "named",
    key: "[title]",
    id: "placeholder_ef2f9ad2-b5a2-446b-8699-d6532ba4fe5b",
    question: 'What is the "title"?',
  },
  {
    type: "generic",
    key: "$[_____________]",
    id: "placeholder_6f395d62-af58-450a-b960-d5121d6aa085",
    context:
      "THIS CERTIFIES THAT in exchange for the payment by [Investor Name] (the “Investor”) of $[_____________] (the “Purchase Amount”) on or about [Date of Safe], [Company Name], a [State of Incorporation] corporation (the “Company”), issues to the Investor the right to certain shares of the Company’s Capital Stock, subject to the terms described below.",
    question: "What is the amount of payment made by the Investor?",
  },
  {
    type: "generic",
    key: "$[_____________]",
    id: "placeholder_f69e8f1a-bf19-4fe9-b0d9-5d51178ae74e",
    context: "The “Post-Money Valuation Cap” is $[_____________].  See Section 2 for certain additional defined terms.",
    question: 'What is the amount for the "Post-Money Valuation Cap"?',
  },
];

async function getSampleSession() {
  // const buffer = await fs.readFile("/home/genos/code/m3rashid/legalAi/server/modules/upload/controllers/buffer.txt");
  const filePath = "/home/genos/code/m3rashid/legalAi/sample.docx";

  // Read the file and convert it to a buffer (similar to req.file.buffer from multer)
  const buffer = await fs.readFile(filePath);

  return {
    sessionId: "session_c5e81b6d-f05a-4f36-9d95-83bb4d478f59",
    session: {
      originalFileBuffer: buffer,
      placeholders: samplePlaceholders,
      answers: Object.fromEntries(
        samplePlaceholders.map((p) => [p.id, p.type === "generic" ? `Generic ${uuidv4()}` : `Named ${uuidv4()}`])
      ),
    } satisfies Session,
  };
}

export async function getSampleSessionController(req: Request, res: Response) {
  const { session, sessionId } = await getSampleSession();

  const buffer = await generateDocumentFromSession(sessionId, session);

  res.setHeader("Content-Disposition", "attachment; filename=completed_document.docx");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.send(buffer);
}
