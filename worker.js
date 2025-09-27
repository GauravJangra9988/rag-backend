import { Worker } from "bullmq";
import { getLoader, loadBufferFromUrl } from "./docLoader.js";
import { ensureCollection } from "./checkCollection.js";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from 'dotenv'
import fs from "fs/promises";
import { CohereEmbeddings } from "@langchain/cohere";
import { QdrantVectorStore } from "@langchain/qdrant";


dotenv.config();

const redisConnection = {
  host: process.env.Redis_Host,
  port: process.env.Redis_Port,
  password: process.env.Redis_Password,
  tls: {},
};


new Worker(
  "file-upload-queue",
  async (job) => {
    try {
      const data = job.data;

      console.log(data)

      const tmpPath = await loadBufferFromUrl(data.url);
      const ext = data.url.split(".").pop().toLowerCase();

      const loader = getLoader(tmpPath, ext);
      const rawDoc = await loader.load();
      await fs.unlink(tmpPath);
      console.log("Loaded raw docs:");
      // console.log("Loaded raw docs:", JSON.stringify(rawDoc, null, 2))

      const splitter = new CharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 100,
      });

      const docs = await splitter.splitDocuments(rawDoc);
      console.log(`Split into ${docs.length} chunks`);

      const embeddings = new CohereEmbeddings({
        apiKey: process.env.COHERE_API_KEY,
        model: "embed-english-v3.0",
      });

      const collectionName = data.user;

      await ensureCollection(collectionName);

      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_URL,
          collectionName: collectionName,
          apiKey: process.env.QDRANT_API_KEY,
        }
      );

      await vectorStore.addDocuments(docs);
      console.log("Documents embedded and stored in Qdrant");
    } catch (err) {
      console.error("Worker error:", err);
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);



