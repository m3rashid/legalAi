import { z } from "zod";
import mammoth from "mammoth";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Request, Response } from "express";

import { getOpenaiClient } from "config/openai";
import { errorStatusCodes, successStatusCodes } from "utils/api";

// Session storage (in production, use Redis or database)
type Session = {
  originalFileBuffer: Buffer;
  placeholders: PlaceholderType[];
  structuredPlaceholders: PlaceholderType[];
  answers: Record<string, string>;
};

export const sessions: Record<string, Session> = {};

// Zod schema for placeholder validation
const placeholderSchema = z.union([
  z.object({
    type: z.literal("simple"),
    key: z.string(),
  }),
  z.object({
    type: z.literal("contextual"),
    key: z.string(),
    context: z.string(),
  }),
]);

const placeholdersArraySchema = z.array(placeholderSchema);
const placeholdersArrayJsonSchema = zodToJsonSchema(placeholdersArraySchema);

// console.log(JSON.stringify(placeholdersArrayJsonSchema, null, 2));

export type PlaceholderType = z.infer<typeof placeholderSchema>;

function getUserPrompt(text: string) {
  return `
You are an assistant that extracts placeholders from legal documents. There are two types of placeholders:
1. Square bracketed like [Company Name] — these are simple.
2. Dollar-signed square bracketed like $[__________] — these are contextual and require interpreting the surrounding sentence to understand what information is being asked.

Please return the response as a JSON object with the key "placeholders" and the value being an array of placeholders.
Each placeholder should be an object with the following properties:
- "type": "simple" or "contextual"
- "key": the key of the placeholder
- "context": the context of the placeholder (only for contextual placeholders)

Example:
[
  { "type": "simple", "key": "Company Name" },
  { "type": "contextual", "key": "Purchase Amount", "context": "payment of $[__________]" }
]

Text:
------
${text}
`;
}

export async function handleUploadedFile(req: Request, res: Response) {
  try {
    if (!req.file) {
      res.status(errorStatusCodes.BAD_REQUEST).json({ error: "No file uploaded" });
      return;
    }

    const { value: text } = await mammoth.extractRawText({ buffer: req.file.buffer });

    const client = getOpenaiClient();

    // Use structured outputs with the correct OpenAI API
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: getUserPrompt(text) }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "placeholders",
          schema: {
            type: "object",
            properties: {
              placeholders: placeholdersArrayJsonSchema,
            },
            required: ["placeholders"],
            additionalProperties: false,
          },
        },
      },
    });

    console.log(JSON.stringify(completion, null, 2));

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from OpenAI");

    // Parse and validate the response
    const rawResponse = JSON.parse(content);
    const validatedPlaceholders = placeholdersArraySchema.parse(rawResponse.placeholders);

    // Convert to the format expected by frontend (array of keys)
    // const placeholderKeys = validatedPlaceholders.map((placeholder) => {
    //   if (placeholder.type === "simple") {
    //     return `[${placeholder.key}]`;
    //   } else {
    //     // For contextual placeholders, we'll use a pattern that matches the original document
    //     return `$[__________]`; // This will be matched with context later
    //   }
    // });

    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessions[sessionId] = {
      originalFileBuffer: req.file.buffer,
      placeholders: validatedPlaceholders,
      structuredPlaceholders: validatedPlaceholders,
      answers: {},
    };

    console.log(`Session ${sessionId} created with placeholders:`, validatedPlaceholders);

    res.status(successStatusCodes.OK).json({
      sessionId,
      placeholders: validatedPlaceholders,
    });
  } catch (error: any) {
    console.error("Error processing uploaded file:", error);

    if (error instanceof z.ZodError) {
      res.status(errorStatusCodes.BAD_REQUEST).json({
        error: "Invalid response format from AI",
        details: error.errors,
      });
      return;
    }

    res.status(errorStatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || "Failed to process document",
    });
  }
}
