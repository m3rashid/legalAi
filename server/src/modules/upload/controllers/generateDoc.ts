import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

import { sessions } from "modules/upload/helpers";
import type { Session } from "modules/upload/helpers";

export async function generateDocumentFromSession(sessionId: string, session: Session) {
  // check every placeholder has an answer
  const placeHolderIds = session.placeholders.map((p) => p.id);
  for (const pid of placeHolderIds) {
    if (!session.answers[pid]) throw new Error(`Missing answer for placeholder id: ${pid}`);
  }

  // Step 1: Separate named and generic placeholders
  const namedPlaceholders = session.placeholders.filter((p) => p.type === "named");
  const genericPlaceholders = session.placeholders.filter((p) => p.type === "generic");

  // Start with the original document buffer
  let currentBuffer = Buffer.from(session.originalFileBuffer);
  let binaryReplacementWorked = true;

  // Step 2: Handle generic placeholders first
  for (const placeholder of genericPlaceholders) {
    const answer = session.answers[placeholder.id];
    if (answer && placeholder.context) {
      // Create a copy of the context
      let ctx = placeholder.context;

      console.log("Before replacement:", {
        key: placeholder.key,
        answer,
        contextIncludes: placeholder.context.includes(placeholder.key),
      });

      // Replace the placeholder.key (which already contains $[key]) with the answer
      ctx = ctx.replace(placeholder.key, answer);

      console.log("After replacement:", {
        contextChanged: ctx !== placeholder.context,
      });

      // Only proceed if the context actually changed
      if (ctx !== placeholder.context) {
        // Convert buffer to string for manipulation using binary encoding to preserve ZIP structure
        let documentText = currentBuffer.toString("binary");

        console.log("Document replacement debug:", {
          originalContextLength: placeholder.context.length,
          newContextLength: ctx.length,
          documentContainsOriginalContext: documentText.includes(placeholder.context),
          documentLength: documentText.length,
        });

        // Replace the original context with the new context in the document
        const originalLength = documentText.length;
        documentText = documentText.replace(placeholder.context, ctx);
        const newLength = documentText.length;

        console.log("Replacement result:", {
          lengthChanged: originalLength !== newLength,
          expectedLengthChange: ctx.length - placeholder.context.length,
          actualLengthChange: newLength - originalLength,
        });

        // If the replacement didn't work as expected, mark it for fallback
        if (newLength === originalLength && ctx.length !== placeholder.context.length) {
          console.log("Binary replacement failed - will use fallback approach");
          binaryReplacementWorked = false;
          break;
        }

        // Convert back to buffer using binary encoding
        currentBuffer = Buffer.from(documentText, "binary");

        console.log("Context replaced in document buffer");
      } else {
        console.log("Warning: Context was not modified - key might not be found in context");
      }
    }
  }

  // Step 3: Fallback approach if binary replacement failed
  if (!binaryReplacementWorked) {
    console.log("Using fallback approach with text extraction and docxtemplater");

    // Extract text and create replacement data
    const replacementData: Record<string, string> = {};

    // Handle all placeholders through docxtemplater
    for (const placeholder of [...genericPlaceholders, ...namedPlaceholders]) {
      const answer = session.answers[placeholder.id];
      if (answer) {
        if (placeholder.type === "generic") {
          // For generic placeholders, extract the content from $[content] pattern
          const match = placeholder.key.match(/^\$\[(.*)\]$/);
          if (match && match[1]) {
            replacementData[match[1]] = answer;
          }
        } else {
          // For named placeholders, remove brackets
          const cleanKey = placeholder.key.replace(/[\[\]]/g, "");
          if (cleanKey) {
            replacementData[cleanKey] = answer;
          }
        }
      }
    }

    // Use docxtemplater with custom parser for all replacements
    const zip = new PizZip(session.originalFileBuffer);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: "[", end: "]" },
      parser: (tag) => {
        return {
          get: (scope) => {
            // Try direct lookup first (this will handle both generic and named placeholders)
            if (scope[tag]) return scope[tag];

            // Try with brackets for named placeholders
            const withBrackets = `[${tag}]`;
            if (scope[withBrackets]) return scope[withBrackets];

            return undefined;
          },
        };
      },
      // Add custom preprocessing to handle $[...] patterns
      nullGetter: (part) => {
        // This handles cases where the tag is not found
        return "";
      },
    });

    doc.render(replacementData);
    const buffer = doc.getZip().generate({ type: "nodebuffer" });

    if (sessions[sessionId]) delete sessions[sessionId];
    return buffer;
  }

  console.log("Generic placeholders processed");

  // Step 4: Handle named placeholders using docxtemplater (original approach)
  const zip = new PizZip(currentBuffer);

  const doc = new Docxtemplater(zip, {
    delimiters: {
      start: "[",
      end: "]",
    },
  });

  // Step 5: Create replacements for named placeholders
  const namedReplacements: Record<string, string> = {};
  for (const placeholder of namedPlaceholders) {
    const answer = session.answers[placeholder.id];
    if (answer) {
      // Remove brackets from the key for docxtemplater
      const cleanKey = placeholder.key.replace(/[\[\]]/g, "");
      if (cleanKey) {
        namedReplacements[cleanKey] = answer;
      }
    }
  }

  console.log("Named replacements:", namedReplacements);

  // Step 6: Render the document with named replacements
  doc.render(namedReplacements);

  // Step 7: Generate the final buffer
  const buffer = doc.getZip().generate({ type: "nodebuffer" });

  if (sessions[sessionId]) delete sessions[sessionId];

  return buffer;
}
