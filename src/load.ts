import fs from "node:fs/promises";
import "dotenv/config"

import { AstraDBVectorStore, Document, VectorStoreIndex, storageContextFromDefaults } from 'llamaindex';

const collectionName = "the_great_gatsby";

async function main() {
    try {
        // loading the text file
        const path = "./src/sample-data/the_great_gatsby.txt";
        // 

        const essay = await fs.readFile(path, 'utf-8');
        // Create a Document object from the text file
        const document = new Document({
            text: essay,
            id_: path
        });

        // Initialize AstraDB Vector Store and connect
        const astraVS = new AstraDBVectorStore({
            params: {
                token: process.env.ASTRA_DB_APPLICATION_TOKEN,
                endpoint: process.env.ASTRA_DB_API_ENDPOINT
            }
        });

        await astraVS.createAndConnect(collectionName, {
            vector: { dimension: 1536, metric: "cosine" }
          });

        await astraVS.connect(collectionName);

    // Create embeddings and store them in VectorStoreIndex
    const ctx = await storageContextFromDefaults({ vectorStore: astraVS });
    const index = await VectorStoreIndex.fromDocuments([document], {
        storageContext: ctx

    });
    return index;

        
    } catch (error) {
        console.log(error);
        throw new Error('Something went wrong!')
        
    }

}

main()