import cors from "cors";
import express from "express";

import { env } from "config/env";
import { globalErrorHandlerMiddleware } from "utils/error";

import { uploadRouter } from "modules/upload";

const app = express();
app.disable("x-powered-by");
app.use(
  cors({
    credentials: true,
    origin: [env.CLIENT_URL],
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
