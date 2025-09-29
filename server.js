// server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";

import { handleUpload } from "./uploadHandler.js";
import { chatHandler } from "./chatHandler.js";
import cookieParser from "cookie-parser";
import { sessionHandler } from "./sessionHandler.js";
import { sessionDeleteHandler } from "./sessionDeleteHandler.js";

dotenv.config();

const app = express();
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "http://localhost:5173");
      res.header("Access-Control-Allow-Credentials", "true"); // Required when credentials are included
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      next();
    });
app.use(express.json())
app.use(cookieParser())

const upload = multer({ storage: multer.memoryStorage() });


app.get("/", (req, res) => {
  res.status(200).send("API working")
});


app.post("/upload/file", upload.array("files"), handleUpload)

app.post("/chat", chatHandler)

app.get("/getSessionId", sessionHandler)

app.post("/deleteSession", sessionDeleteHandler)



app.listen(8000, () => {
  console.log("Server running on 8000");
});
