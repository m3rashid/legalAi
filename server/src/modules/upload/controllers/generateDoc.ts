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
    nullGetter: (part) => "",
  });

  doc.render(replacementData);
  const buffer = doc.getZip().generate({ type: "nodebuffer" });

  if (sessions[sessionId]) delete sessions[sessionId];
  return buffer;
}
