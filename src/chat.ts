import {
    AstraDBVectorStore,
    serviceContextFromDefaults,
    VectorStoreIndex,
    ContextChatEngine
  } from "llamaindex";
  import readline from 'readline';
  import "dotenv/config"
  
  const collectionName = "the_great_gatsby";
  
  // Function to check if the input is a quit command
  function isQuit(question: string) {
    return ["q", "quit", "exit"].includes(question.trim().toLowerCase());
  }
  
  // Function to get user input as a promise
  function getUserInput(readlineInterface: readline.Interface) {
    return new Promise<string>(resolve => {
      readlineInterface.question("What would you like to know?\n> ", userInput => {
        resolve(userInput);
      });
    });
  }
  
  async function main() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  
    try {
      // Connect to AstraDB Vector Store
      const astraVS = new AstraDBVectorStore({
        params: {
          token: process.env.ASTRA_DB_APPLICATION_TOKEN,
          endpoint: process.env.ASTRA_DB_API_ENDPOINT
        }
      });
      await astraVS.connect(collectionName);
  
      // Setup vector store and chat engine
      const ctx = serviceContextFromDefaults();
      const index = await VectorStoreIndex.fromVectorStore(astraVS, ctx);
      const retriever = await index.asRetriever({ similarityTopK: 20 });
      const chatEngine = new ContextChatEngine({ retriever });
  
      // Query engine for chat interactions
      const queryEngine = await index.asQueryEngine();
  
      // Chat loop
      let question = "";
      while (!isQuit(question)) {
        question = await getUserInput(rl);
  
        if (isQuit(question)) {
          rl.close();
          process.exit(0);
        }
  
        try {
          const answer = await queryEngine.query({ query: question });
          console.log(answer.response);
        } catch (error) {
          console.error("Error:", error);
        }
      }
    } catch (err) {
      console.error(err);
      console.log("If your AstraDB initialization failed, make sure to set env vars for your ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_ENDPOINT, and OPENAI_API_KEY as needed.");
      process.exit(1);
    } finally {
      rl.close();
    }
  }
  
  main().catch(console.error).finally(() => {
    process.exit(1);
  });
  