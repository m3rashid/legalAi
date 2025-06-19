import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { v4 as newUuidV4 } from "uuid";
import * as process from "node:process";

const TEN_MB = 10 * 1024 * 1024;

export const uploadFileToDisk = multer({
  limits: { fileSize: TEN_MB },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.cwd(), "/uploads")); // Save files to /tmp directory
    },
    filename: (req, file, cb) => {
      cb(null, "file.docx");
    }
  })
});

export async function removeFileFromDisk(filePaths: string[]) {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error("Error removing file from disk:", error);
    }
  }
}

export const uploadOnMemoryStorage = multer({
  limits: { fileSize: TEN_MB },
  storage: multer.memoryStorage()
});
