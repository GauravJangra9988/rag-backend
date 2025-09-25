// server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { config } from "dotenv";
import {v4 as uuidv4} from 'uuid'
import { Storage } from "@google-cloud/storage";
import { Queue, Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { CohereEmbeddings } from "@langchain/cohere";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

config();

const uuid = uuidv4();

const app = express();
app.use(cors());


// ----------------- Multer Config -------------------
const upload = multer({ storage: multer.memoryStorage() });

// google storage

const storage = new Storage({
  keyFilename: "key.json",
  projectId: "dochat-473216",
});

const bucket = storage.bucket("dochatbucket");

// ----------------- Redis Queue ---------------------
const redisConnection = {
  host: "legible-fox-11403.upstash.io",
  port: 6379,
  password: "ASyLAAIncDI1YWU0ODMxZTlmOTQ0M2E0YTg5ZDE4ODc2NzE3ODEzOHAyMTE0MDM",
  tls: {},
};

const queue = new Queue("file-upload-queue", {
  connection: redisConnection,
});

// ----------------- API Routes ----------------------

app.get("/", (req, res) => {
  res.send("API is working");
});

app.post("/upload/file", upload.array("files"), async (req, res) => {
  
  try {
    if(!req.files || req.files.length == 0){
      return res.status(400).json({message: "No files uploaded"});
    }

    const uploadedFile = [];

    for(const file of req.files){
      const blobName = `${uuid}-${file.originalname}`;
      const blob = bucket.file(blobName)
    
      await new Promise((resolve, reject) => {
        const stream = blob.createWriteStream({
          resumable: false,
          metadata: { contentType: file.mimetype },
        });

        stream.on("error", reject);
        stream.on("finish", resolve);

        stream.end(file.buffer);
      });

      await blob.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

      uploadedFile.push({filename: file.originalname, url: publicUrl});

    }

    res.json({ message: "PDF uploaded and queued", uploadedFile });

  } catch(error){
    console.log(error)
  }
  
  
  
  
  
  
  // req.files.forEach((file) => {
  //   queue.add(
  //     "file-ready",
  //     JSON.stringify({
  //       filename: file.originalname,
  //       destination: file.destination,
  //       path: file.path,
  //     })
  //   );
  // });

});

app.get("/chat", async (req, res) => {
  const userQuery = req.query.q;
  const embeddings = new CohereEmbeddings({
    apiKey: process.env.COHERE_API_KEY,
    model: "embed-english-v3.0",
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: "https://bd1282e6-8573-48da-956d-36e2cc367ecb.us-east4-0.gcp.cloud.qdrant.io",
      collectionName: "langchainjs-testing",
      apiKey: process.env.QDRANT_API_KEY,
    }
  );

  const retriever = vectorStore.asRetriever({ k: 2 });
  const result = await retriever.invoke(userQuery);

  const SYSTEM_PROMPT = `You are a helpful assistant. Based only on the following context from a PDF file, answer the user query precisely.

Context:
${JSON.stringify(result)}

Question: ${userQuery}`;

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: SYSTEM_PROMPT,
  });

  res.json({ answer: response.text });
});

// ----------------- Worker Logic --------------------

new Worker(
  "file-upload-queue",
  async (job) => {
    console.log("🟡 Job received:", job.name);
    const data = JSON.parse(job.data);

    try {
      const loader = new PDFLoader(data.path);
      const rawDocs = await loader.load();
      console.log(`✅ Loaded ${rawDocs.length} raw docs`);

      const splitter = new CharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 100,
      });

      const docs = await splitter.splitDocuments(rawDocs);
      console.log(`✅ Split into ${docs.length} chunks`);

      const embeddings = new CohereEmbeddings({
        apiKey: process.env.COHERE_API_KEY,
        model: "embed-english-v3.0",
      });

      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: "https://bd1282e6-8573-48da-956d-36e2cc367ecb.us-east4-0.gcp.cloud.qdrant.io",
          collectionName: "langchainjs-testing",
          apiKey: process.env.QDRANT_API_KEY,
        }
      );

      await vectorStore.addDocuments(docs);
      console.log("🎉 Documents embedded and stored in Qdrant");
    } catch (err) {
      console.error("❌ Worker error:", err);
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

// ----------------- Start Server --------------------

app.listen(8000, () => {
  console.log("🚀 Express + Worker running on port 8000");
});
