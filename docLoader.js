import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { TextLoader } from "langchain/document_loaders/fs/text";

import path from "path";
import fs from "fs/promises";
import os from "os";
import fetch from "node-fetch";


export function getLoader(filePath, ext) {
  switch (ext) {
    case "pdf":
      return new PDFLoader(filePath);

    case "docx":
      return new DocxLoader(filePath);

    case "doc":
      return new DocxLoader(filePath, { type: "doc" });

    case "pptx":
      return new PPTXLoader(filePath);

    case "txt":
      return new TextLoader(filePath);

    default:
      throw new Error(`No loader available for ${ext}`);
  }
}



export async function loadBufferFromUrl(filePath) {
  const response = await fetch(filePath);
  const buffer = Buffer.from(await response.arrayBuffer());
  const tmpPath = path.join(os.tmpdir(), path.basename(filePath));
  await fs.writeFile(tmpPath, buffer);

  return tmpPath;
}
