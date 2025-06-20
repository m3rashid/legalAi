import { Router } from "express";

import { asyncRoute } from "utils/error";
import { uploadFileToDisk } from "config/multer";
import { handleUploadedFile } from "modules/upload/controllers/handleUploadedFile";
import { handleAnswerSubmission } from "modules/upload/controllers/handleAnswerSubmission";
import { generateFinalDocument } from "modules/upload/controllers/generateFinalDocument";

const uploadRouter: Router = Router();

uploadRouter.post("/", uploadFileToDisk.single("document"), asyncRoute(handleUploadedFile));

uploadRouter.post("/fill", asyncRoute(handleAnswerSubmission));

uploadRouter.post("/generate", asyncRoute(generateFinalDocument));

export { uploadRouter };
