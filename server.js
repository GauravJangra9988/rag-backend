// server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";

import { handleUpload } from "./uploadHandler.js";
import { chatHandler } from "./chatHandler.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json())

const upload = multer({ storage: multer.memoryStorage() });


app.get("/", (req, res) => {
  res.status(200).send("API working")
});


app.post("/upload/file", upload.array("files"), handleUpload)

app.post("/chat", chatHandler)

//------------- loader ------------




app.listen(8000, () => {
  console.log("Server running on 8000");
});
