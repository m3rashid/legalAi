import PizZip from "pizzip";
import mammoth from "mammoth";
import Docxtemplater from "docxtemplater";
import type { Request, Response } from "express";

import { errorStatusCodes, successStatusCodes } from "utils/api";

type Session = {
  originalFileBuffer: Buffer;
  placeholders: string[];
  answers: Record<string, string>;
};

// using this as a temporary database for the session
const sessions: Record<string, Session> = {};

export async function handleUploadedFile(req: Request, res: Response) {
  try {
    if (!req.file) throw new Error("No file uploaded");

    // Validate that the file buffer exists
    if (!req.file.buffer) throw new Error("File buffer is not available");

    const fileBuffer = Buffer.from(req.file.buffer);
    console.log("File buffer length:", fileBuffer.length);

    if (!fileBuffer || fileBuffer.length === 0) throw new Error("No file buffer or empty file");

    // 1. Extract raw text from the .docx file
    const { value: text } = await mammoth.extractRawText({ buffer: fileBuffer });

    // 2. Define a regex to find placeholders
    // This regex finds:
    // - [Anything inside brackets]
    // - $[_____] with at least 2 underscores
    const placeholderRegex = /\[(.*?)\]|\$\[_{2,}\]/g;
    const matches = text.match(placeholderRegex) || [];

    // 3. Get a unique list of placeholders
    const uniquePlaceholders = [...new Set(matches)];

    if (uniquePlaceholders.length === 0) throw new Error("No placeholders found in the document.");

    // 4. Create a session to track this document and its data
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessions[sessionId] = {
      originalFileBuffer: fileBuffer,
      placeholders: uniquePlaceholders,
      answers: {}, // We will fill this in the next steps
    };

    console.log(`Session ${sessionId} created with placeholders:`, uniquePlaceholders);

    // 5. Send the session ID and placeholders back to the client
    res.status(successStatusCodes.OK).json({
      sessionId,
      placeholders: uniquePlaceholders,
    });
  } catch (err: any) {
    console.error("Error handling uploaded file:", err);
    res.status(errorStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
}

export async function handleAnswerSubmission(req: Request, res: Response) {
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

export async function generateFinalDocument(req: Request, res: Response) {
  const { sessionId } = req.body;
  const session = sessions[sessionId];

  if (!session) {
    res.status(errorStatusCodes.NOT_FOUND).json({ message: "Session not found." });
    return;
  }

  try {
    const zip = new PizZip(session.originalFileBuffer);

    // Configure docxtemplater to use square brackets as delimiters
    const doc = new Docxtemplater(zip, {
      delimiters: {
        start: "[",
        end: "]",
      },
      // This handles the $[____] case by replacing the whole tag
      // We need to strip the wrapping `[` and `]` for the key
      parser: (tag) => {
        if (tag.startsWith("$")) {
          return {
            get: (scope) => {
              // Find the key in the answers that matches this pattern
              const key = `$[${tag.substring(1)}]`; // e.g., $[_____]
              return scope[key];
            },
          };
        }
        // Default parser for simple tags like [Company Name]
        return { get: (scope) => scope[tag] };
      },
    });

    // Prepare data for rendering. The keys must NOT include the brackets.
    // But the answers object we built has keys *with* brackets. We need to adapt.
    const renderData: Record<string, string | undefined> = {};

    console.log("Session answers:", session.answers);

    for (const key in session.answers) {
      if (key.startsWith("$[")) {
        // Handle the special $[____] case - keep the full key including brackets
        renderData[key] = session.answers[key];
      } else {
        // For regular placeholders like [Company Name], remove the brackets
        const cleanKey = key.replace(/[\[\]]/g, ""); // Remove brackets
        if (cleanKey) {
          renderData[cleanKey] = session.answers[key];
        }
      }
    }

    console.log("Prepared render data:", renderData);

    doc.render(renderData);

    const buf = doc.getZip().generate({ type: "nodebuffer" });

    // Set headers to trigger download on the client
    res.setHeader("Content-Disposition", "attachment; filename=completed_document.docx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(buf);

    // Clean up the session
    delete sessions[sessionId];
  } catch (error: any) {
    console.error("Error generating document:", error);
    // This error often happens if a placeholder is found but not in the data object
    // or if the document is corrupt.
    res.status(errorStatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message,
      properties: error.properties,
      message: "Error generating the final document.",
    });
  }
}
