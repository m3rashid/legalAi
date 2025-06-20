import mammoth from "mammoth";
import { v4 as uuidv4 } from "uuid";

import { getOpenaiClient } from "config/openai";

type PlaceholderType = "named" | "generic";
type Placeholder = {
  id: string;
  key: string;
  type: PlaceholderType;
  context?: string;
  question: string;
};

async function formatQuestion(question: string): Promise<string> {
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

  const namedPlaceholders = foundPlaceholders.filter((ph) => ph.type === "named");

  const finalPlaceholders: Placeholder[] = [];

  const namedKeysSeen = new Set<string>();
  for (const ph of namedPlaceholders) {
    if (!namedKeysSeen.has(ph.key)) {
      finalPlaceholders.push(ph);
      namedKeysSeen.add(ph.key);
    }
  }

  const genericPlaceholders = foundPlaceholders.filter((ph) => ph.type === "generic");
  const formattedGenericPlaceholders = await Promise.all(
    genericPlaceholders.map(async (ph) => {
      if (!ph.context) return ph;
      const question = await formatQuestion(ph.context);
      return { ...ph, question } satisfies Placeholder;
    })
  );

  finalPlaceholders.push(...formattedGenericPlaceholders);

  return finalPlaceholders;
}

export async function testFileUploadForPlaceholders(filePath: string) {
  const { value: text } = await mammoth.extractRawText({ path: filePath });
  const placeholders = await findPlaceholders(text);

  if (placeholders.length === 0) throw new Error("No placeholders found in the document.");

  const sessionId = `session_${uuidv4()}`;
  const sessions: Record<string, { placeholders: Placeholder[]; answers: Record<string, string> }> = {};
  sessions[sessionId] = { placeholders, answers: {} };

  console.log(`Session ${sessionId} created with placeholders:`, placeholders);

  return { sessionId, placeholders };
}
