import type { Request, Response } from "express";

export async function generateFinalDocument(req: Request, res: Response) {
  // try {
  //   const { sessionId } = req.body;
  //   if (!sessionId) {
  //     res.status(errorStatusCodes.BAD_REQUEST).json({ error: "Missing sessionId" });
  //     return;
  //   }
  //   const session = sessions[sessionId];
  //   if (!session) {
  //     res.status(errorStatusCodes.NOT_FOUND).json({ error: "Session not found" });
  //     return;
  //   }
  //   const zip = new PizZip(session.originalFileBuffer);
  //   // Configure docxtemplater to use square brackets as delimiters
  //   const doc = new Docxtemplater(zip, {
  //     delimiters: {
  //       start: "[",
  //       end: "]",
  //     },
  //     // Enhanced parser that handles both simple and contextual placeholders
  //     parser: (tag) => {
  //       if (tag.startsWith("$")) {
  //         return {
  //           get: (scope) => {
  //             // For contextual placeholders, try to find by the full key format
  //             const fullKey = `$[${tag.substring(1)}]`;
  //             if (scope[fullKey] !== undefined) {
  //               return scope[fullKey];
  //             }
  //             // Try to find by the inferred key from AI
  //             const contextualPlaceholder = session.placeholders.find(
  //               (p) => p.type === "named" && p.key === tag.substring(1)
  //             );
  //             if (contextualPlaceholder) {
  //               const aiKey = `$[${contextualPlaceholder.key}]`;
  //               return scope[aiKey];
  //             }
  //             return scope[tag] || "";
  //           },
  //         };
  //       }
  //       // Default parser for simple tags like [Company Name]
  //       return { get: (scope) => scope[tag] || "" };
  //     },
  //   });
  //   // Prepare data for rendering using the structured placeholders data
  //   const renderData: Record<string, string | undefined> = {};
  //   console.log("Session answers:", session.answers);
  //   console.log("Structured placeholders:", session.structuredPlaceholders);
  //   // Map answers to the correct format for docxtemplater
  //   for (const key in session.answers) {
  //     // Find the corresponding structured placeholder
  //     const structuredPlaceholder = session.structuredPlaceholders.find((p) => {
  //       if (p.type === "simple") {
  //         return `[${p.key}]` === key;
  //       } else {
  //         return `$[${p.key}]` === key;
  //       }
  //     });
  //     if (structuredPlaceholder) {
  //       if (structuredPlaceholder.type === "simple") {
  //         // For simple placeholders, use the clean key without brackets
  //         renderData[structuredPlaceholder.key] = session.answers[key];
  //       } else {
  //         // For contextual placeholders, keep the full key format
  //         renderData[key] = session.answers[key];
  //       }
  //     } else {
  //       // Fallback to the original logic if no structured placeholder found
  //       if (key.startsWith("$[")) {
  //         renderData[key] = session.answers[key];
  //       } else {
  //         const cleanKey = key.replace(/[\[\]]/g, "");
  //         if (cleanKey) {
  //           renderData[cleanKey] = session.answers[key];
  //         }
  //       }
  //     }
  //   }
  //   console.log("Prepared render data:", renderData);
  //   doc.render(renderData);
  //   const buf = doc.getZip().generate({ type: "nodebuffer" });
  //   // Set headers to trigger download on the client
  //   res.setHeader("Content-Disposition", "attachment; filename=completed_document.docx");
  //   res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  //   res.send(buf);
  //   // Clean up the session
  //   delete sessions[sessionId];
  //   console.log(`Session ${sessionId} cleaned up after document generation`);
  // } catch (error: any) {
  //   console.error("Error generating document:", error);
  //   res.status(errorStatusCodes.INTERNAL_SERVER_ERROR).json({
  //     error: error.message || "Error generating the final document",
  //     properties: error.properties,
  //   });
  // }
}
