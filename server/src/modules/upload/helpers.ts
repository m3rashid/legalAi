export type PlaceholderType = "named" | "generic";

export type Placeholder = {
  id: string;
  key: string;
  type: PlaceholderType;
  context?: string;
  question: string;
};

export type Session = {
  placeholders: Placeholder[];
  answers: Record<string, string>; // { placeholderId: answer }
  originalFileBuffer: Buffer<ArrayBufferLike>;
};

export const sessions: Record<string, Session> = {}; // { sessionId: Session }
