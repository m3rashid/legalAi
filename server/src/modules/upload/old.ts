import { Router } from "express";
import { asyncRoute } from "utils/error";
import { uploadOnMemoryStorage } from "config/multer";
import { generateFinalDocument, handleAnswerSubmission, handleUploadedFile } from "modules/upload/legacy/controllers";

const oldUploadRouter: Router = Router();

oldUploadRouter.post("/", uploadOnMemoryStorage.single("document"), asyncRoute(handleUploadedFile));

oldUploadRouter.post("/fill", asyncRoute(handleAnswerSubmission));

oldUploadRouter.post("/generate", asyncRoute(generateFinalDocument));

export { oldUploadRouter };
