import { Router } from "express";

import { asyncRoute } from "utils/error";
import { uploadOnMemoryStorage } from "config/multer";
import { handleUploadedFile } from "modules/upload/controllers/handleUploadedFile";
import { generateFinalDocument } from "modules/upload/controllers/generateFinalDocument";
import { handleAnswerSubmission } from "modules/upload/controllers/handleAnswerSubmission";
import { getSampleSessionController } from "./controllers/sampleSession";

const uploadRouter: Router = Router();

uploadRouter.post("/", uploadOnMemoryStorage.single("document"), asyncRoute(handleUploadedFile));

uploadRouter.post("/fill", asyncRoute(handleAnswerSubmission));

uploadRouter.post("/generate", asyncRoute(generateFinalDocument));

uploadRouter.get("/sample", asyncRoute(getSampleSessionController));

export { uploadRouter };
