import cors from "cors";
import express from "express";

import { env } from "config/env";
import { uploadRouter } from "modules/upload";
import { globalErrorHandlerMiddleware } from "utils/error";

const app = express();
app.disable("x-powered-by");
app.use(
  cors({
    credentials: true,
    origin: ["https://legal-im8m5axit-m3rashids-projects.vercel.app", env.CLIENT_URL],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_, res) => void res.send("Hello World"));

app.use("/api/upload", uploadRouter);

app.use(globalErrorHandlerMiddleware);

const port = env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
