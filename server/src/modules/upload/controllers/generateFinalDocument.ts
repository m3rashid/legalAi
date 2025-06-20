import z from "zod";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { Request, Response } from "express";

import { sessions } from "modules/upload/helpers";
import { errorStatusCodes } from "utils/api";

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

  // check every placeholder has an answer
  const placeHolderIds = session.placeholders.map((p) => p.id);
  for (const pid of placeHolderIds) {
    if (!session.answers[pid]) {
      res.status(errorStatusCodes.BAD_REQUEST).json({ message: `Missing answer for placeholder id: ${pid}` });
      return;
    }
  }

  try {
    // Step 1: Separate named and generic placeholders
    const namedPlaceholders = session.placeholders.filter((p) => p.type === "named");
    const genericPlaceholders = session.placeholders.filter((p) => p.type === "generic");

    // Step 2: Create a mapping of placeholder keys to their answers for named placeholders
    const namedReplacements: Record<string, string> = {};
    for (const placeholder of namedPlaceholders) {
      const answer = session.answers[placeholder.id];
      if (answer) {
        namedReplacements[placeholder.key] = answer;
      }
    }

    // Step 3: Process generic placeholders - replace named placeholders in their questions first
    const genericReplacements: Record<string, string> = {};
    for (const placeholder of genericPlaceholders) {
      let processedQuestion = placeholder.question;

      // Replace any named placeholders in the question text
      for (const [namedKey, namedAnswer] of Object.entries(namedReplacements)) {
        processedQuestion = processedQuestion.replace(new RegExp(namedKey.replace(/[[\]]/g, "\\$&"), "g"), namedAnswer);
      }

      const answer = session.answers[placeholder.id];
      if (answer) {
        genericReplacements[placeholder.key] = answer;
      }
    }

    console.log("Named replacements:", namedReplacements);
    console.log("Generic replacements:", genericReplacements);

    // Step 4: Create the final document using docxtemplater
    const zip = new PizZip(session.originalFileBuffer);

    // Configure docxtemplater to handle both types of placeholders
    const doc = new Docxtemplater(zip, {
      delimiters: {
        start: "[",
        end: "]",
      },
      parser: (tag) => {
        // Handle $[____] patterns
        if (tag.startsWith("$")) {
          return {
            get: (scope) => {
              const fullKey = `$[${tag.substring(1)}]`;
              return scope[fullKey];
            },
          };
        }
        // Handle regular [placeholders]
        return {
          get: (scope) => scope[tag],
        };
      },
    });

    // Step 5: Prepare render data - combine both named and generic replacements
    const renderData: Record<string, string> = {};

    // Add named placeholders (remove brackets from keys for docxtemplater)
    for (const [key, value] of Object.entries(namedReplacements)) {
      if (key.startsWith("$[")) {
        // Keep the full key for $[____] patterns
        renderData[key] = value;
      } else {
        // Remove brackets for regular named placeholders
        const cleanKey = key.replace(/[\[\]]/g, "");
        if (cleanKey) {
          renderData[cleanKey] = value;
        }
      }
    }

    // Add generic placeholders
    for (const [key, value] of Object.entries(genericReplacements)) {
      if (key.startsWith("$[")) {
        // Keep the full key for $[____] patterns
        renderData[key] = value;
      } else {
        // Remove brackets for regular generic placeholders
        const cleanKey = key.replace(/[\[\]]/g, "");
        if (cleanKey) {
          renderData[cleanKey] = value;
        }
      }
    }

    console.log("Final render data:", renderData);

    // Step 6: Render the document
    doc.render(renderData);

    // Step 7: Generate the final buffer
    const buffer = doc.getZip().generate({ type: "nodebuffer" });

    // Step 8: Send the document to the client
    res.setHeader("Content-Disposition", "attachment; filename=completed_document.docx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(buffer);

    // Step 9: Clean up the session
    delete sessions[sessionId];
  } catch (error: any) {
    console.error("Error generating document:", error);
    res.status(errorStatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message,
      properties: error.properties || {},
      message: "Error generating the final document.",
    });
  }
}
