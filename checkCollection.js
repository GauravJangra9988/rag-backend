import {QdrantClient} from '@qdrant/js-client-rest'
import dotenv from "dotenv";

dotenv.config()
       

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const collectionConfig = {
        vectors: {
          size: 1024,
          distance: "Cosine",
        },
      };


export async function ensureCollection (collectionName) {

    const response = await client.getCollections();



    const collectionNames = response.collections.map((collection) =>{
        return collection.name
    })

    if(!collectionNames.includes(collectionName)){
        await client.createCollection(
            collectionName,
            collectionConfig
        )
    }
}


