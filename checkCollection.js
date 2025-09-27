import {QdrantClient} from '@qdrant/js-client-rest'
import dotenv from "dotenv";

dotenv.config()
       

const client = new QdrantClient({
    url: "https://3730d721-6b6a-4105-83cf-c4f2b3b9faea.europe-west3-0.gcp.cloud.qdrant.io",
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
        collection.name
    })

    if(!collectionNames.includes(collectionName)){
        await client.createCollection(
            collectionName,
            collectionConfig
        )
    }
}


