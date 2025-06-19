import OpenAI from "openai";

import { env } from "config/env";

export function getOpenaiClient() {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}
