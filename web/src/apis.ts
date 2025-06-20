import type { Placeholder } from "@/app.tsx";

const baseUrl = "http://localhost:4000";

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("document", file);

  const res = await fetch(`${baseUrl}/api/upload`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Failed to upload file");

  return res.json() as Promise<{ sessionId: string; placeholders: Placeholder[] }>;
}

export async function fillDocument(sessionId: string, placeholder: Placeholder, answer: string) {
  const res = await fetch(`${baseUrl}/api/upload/fill`, {
    method: "POST",
    body: JSON.stringify({ sessionId, placeholder, answer }),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fill document");

  return res.json() as Promise<{ message: string }>;
}

export async function generateDocument(sessionId: string) {
  const res = await fetch(`${baseUrl}/api/upload/generate`, {
    method: "POST",
    body: JSON.stringify({ sessionId }),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to generate document");

  return res.blob() as Promise<Blob>;
}
