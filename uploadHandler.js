import { Storage } from "@google-cloud/storage";
import { Queue } from "bullmq";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const uuid = uuidv4();

const storage = new Storage({
  keyFilename: "key.json",
  projectId: "dochat-473216",
});

const bucket = storage.bucket("dochatbucket");


const redisConnection = {
  host: process.env.Redis_Host,
  port: process.env.Redis_Port,
  password: process.env.Redis_Password,
  tls: {},
};

const queue = new Queue("file-upload-queue", {
  connection: redisConnection,
});

export const handleUpload = async (req, res) => {
  try {
    if (!req.files || req.files.length == 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const user = req.body.user;

    const uploadedFile = [];

    for (const file of req.files) {
      const blobName = `${uuid}-${file.originalname}`;
      const blob = bucket.file(blobName);

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

      uploadedFile.push({ filename: file.originalname, url: publicUrl });

      queue.add("file-ready", {
        user: user,
        filename: file.originalname,
        fileType: file.mimetype,
        gcsPath: blob.name,
        url: publicUrl,
      });
    }

    res.json({ message: "PDF uploaded and queued", uploadedFile });
  } catch (error) {
    console.log(error);
  }
};




