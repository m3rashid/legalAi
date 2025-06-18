import { Router } from "express";
import { asyncRoute } from "utils/error";
import { generateFinalDocument, handleAnswerSubmission, handleUploadedFile } from "./controllers";
import { uploadOnMemoryStorage } from "config/multer";

const uploadRouter: Router = Router();

uploadRouter.post("/", uploadOnMemoryStorage.single("document"), asyncRoute(handleUploadedFile));

uploadRouter.post("/fill", asyncRoute(handleAnswerSubmission));

uploadRouter.post("/generate", asyncRoute(generateFinalDocument));

export { uploadRouter };
