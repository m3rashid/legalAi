import express, { type Locals } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import dotenv from "dotenv";
import mammoth from "mammoth";
import { OpenAI } from "openai";
import * as process from "node:process";
import { uploadFileToDisk } from "./config/multer";
import * as punycode from "node:punycode";

dotenv.config();

const app = express();
const upload = uploadFileToDisk;
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPEN_API_KEY
});

interface Placeholder {
  type: "simple" | "contextual";
  key: string;
  context?: string;
}


// Helper: Use OpenAI to extract placeholders
// async function extractPlaceholdersFromText(docFile: File): Promise<Placeholder[]> {
//   const prompt = `
// You are an assistant that extracts placeholders from legal documents. There are two types of placeholders:
// 1. Square bracketed like [Company Name] — these are simple.
// 2. Dollar-signed square bracketed like $[__________] — these are contextual and require interpreting the surrounding sentence to understand what information is being asked.
//
// Return an array of placeholders in the following JSON format:
//
// [
//   { "type": "simple", "key": "Company Name" },
//   { "type": "contextual", "key": "Purchase Amount", "context": "payment of $[__________]" }
// ]
// `;
// }

// Step 1: Extract placeholders using OpenAI
app.post("/api/placeholders", upload.single("file"), async (req: any, res: any) => {
  const file = req.file;
  console.log(file);

  const buffer = fs.readFileSync(file.path);
  const { value: text } = await mammoth.extractRawText({ buffer });

  const prompt = `
You are an assistant that extracts placeholders from legal documents. There are two types of placeholders:
1. Square bracketed like [Company Name] — these are simple.
2. Dollar-signed square bracketed like $[__________] — these are contextual and require interpreting the surrounding sentence to understand what information is being asked.

Return an array of placeholders in the following JSON format:

[
  { "type": "simple", "key": "Company Name" },
  { "type": "contextual", "key": "Purchase Amount", "context": "payment of $[__________]" }
]

Text:
------
${text}
`;

  const stream = await client.responses.create({
    model: "gpt-4-turbo",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt
          }
        ]
      }
    ]
  });

  const placeholders = stream?.output[0]?.content[0].text.toString()
  const response = placeholders.substring(7,placeholders.length-3)
  return res.json({
    response: JSON.parse(response.trim())
  });

  // try {
  //   const buffer = fs.readFileSync(filePath);
  //   const { value: text } = await mammoth.extractRawText({ buffer });
  //   const placeholders = await extractPlaceholdersFromText(text);
  //   res.json({ placeholders });
  // } catch (e) {
  //   console.error("Failed to extract:", e);
  //   res.status(500).send("Failed to extract placeholders");
  // } finally {
  //   fs.unlinkSync(filePath);
  // }
});

// Step 2: Fill placeholders and return final docx
app.post("/api/fill-doc", upload.single("file"), async (req: any, res: any) => {
  const placeholderData = JSON.parse(req.body.data);
  const filePath = req.file?.path;
  if (!filePath) return res.status(400).send("File not found");

  const content = fs.readFileSync(filePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true
  });

  doc.setData(placeholderData);

  try {
    doc.render();
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }

  const buf = doc.getZip().generate({ type: "nodebuffer" });
  const outputPath = path.join(__dirname, "output", `generated-${Date.now()}.docx`);
  fs.writeFileSync(outputPath, buf);

  res.download(outputPath, (err: any) => {
    if (err) console.error(err);
    fs.unlinkSync(outputPath);
    fs.unlinkSync(filePath);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));