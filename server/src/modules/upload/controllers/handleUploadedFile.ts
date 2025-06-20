import mammoth from "mammoth";
import { v4 as uuidv4 } from "uuid";
import type { Request, Response } from "express";

import { getOpenaiClient } from "config/openai";
import { errorStatusCodes, successStatusCodes } from "utils/api";
import { type Placeholder, type PlaceholderType, sessions } from "modules/upload/helpers";

async function formatQuestionUsingAi(question: string): Promise<string> {
  const client = getOpenaiClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that formats questions for a legal document.
				You will be given a sentence from a legal document which contains a blank space to fill response.
				You have to output a question that can be used to fill the blank space.
				You have to make sure that the question is clear and concise and that it is in the correct format, correct language, tone, style and format.`,
      },
      { role: "user", content: question },
    ],
  });

  return response.choices[0]?.message.content ?? "";
}

async function findPlaceholders(text: string) {
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  const foundPlaceholders: Placeholder[] = [];

  const placeholderRegex = /(\[.*?\]|\$\[.*?\])/g;

  lines.forEach((line) => {
    const matches = line.match(placeholderRegex);
    if (!matches) return;

    matches.forEach((match) => {
      // `match` is the full placeholder string, e.g., "[Company Name]" or "[____]"
      const innerText = match.replace(/[\[\]\$]/g, "").trim();

      const context = line.replace(match, `__${innerText}__`); // Highlight the blank
      const type: PlaceholderType = /[a-zA-Z]/.test(innerText) ? "named" : "generic";

      foundPlaceholders.push({
        type,
        key: match,
        id: `placeholder_${uuidv4()}`, // Create a unique ID for every single placeholder instance. This is CRITICAL.
        ...(type === "named" ? { question: `What is the "${innerText}"?` } : { context, question: "" }),
      });
    });
  });

  const finalPlaceholders: Placeholder[] = [];

  const namedPlaceholders = foundPlaceholders.filter((ph) => ph.type === "named");

  // remove duplicates from the named placeholders
  const namedKeysSeen = new Set<string>();
  for (const ph of namedPlaceholders) {
    if (!namedKeysSeen.has(ph.key)) {
      finalPlaceholders.push(ph);
      namedKeysSeen.add(ph.key);
    }
  }

  const genericPlaceholders = foundPlaceholders.filter((ph) => ph.type === "generic");
  const formattedGenericPlaceholders = await Promise.all(
    genericPlaceholders.map(async (placeholder) => {
      if (!placeholder.context) return placeholder;
      const question = await formatQuestionUsingAi(placeholder.context);
      return { ...placeholder, question } satisfies Placeholder;
    })
  );

  finalPlaceholders.push(...formattedGenericPlaceholders);

  return finalPlaceholders;
}

async function getUploadedFilePlaceholders(buffer: Buffer<ArrayBufferLike>) {
  const { value: text } = await mammoth.extractRawText({ buffer });
  const placeholders = await findPlaceholders(text);

  if (placeholders.length === 0) throw new Error("No placeholders found in the document.");

  const sessionId = `session_${uuidv4()}`;
  sessions[sessionId] = { placeholders, answers: {}, originalFileBuffer: buffer };

  console.log(`Session ${sessionId} created with placeholders:`, placeholders);

  return { sessionId, placeholders };
}

export async function handleUploadedFile(req: Request, res: Response) {
  if (!req.file || !req.file.buffer) {
    res.status(errorStatusCodes.BAD_REQUEST).json({ error: "No file uploaded" });
    return;
  }

  const { sessionId, placeholders } = await getUploadedFilePlaceholders(req.file.buffer);

  res.status(successStatusCodes.OK).json({ sessionId, placeholders });
}
