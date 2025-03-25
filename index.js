const express = require('express');
const axios = require('axios');
const { WebhookClient } = require('dialogflow-fulfillment');

const app = express();
app.use(express.json());

// Your Cohere API key
const apiKey = 'LMrLYbBsVoOLIAPghzjPcKomJr5mXzjWsnmmFPGZ'; // Replace with your Cohere API key

let conversationHistory = [];

async function handleWebhook(request, response) {
  console.log("📢 Received Webhook Request:", JSON.stringify(request.body, null, 2));

  const agent = new WebhookClient({ request, response });

  let userQuery = agent.query || agent.queryText || '';
  console.log("💬 Processing User Query:", userQuery);

  // Check if the user query is valid and not empty
  if (!userQuery.trim()) {
    console.error("❌ No valid user query received");
    response.json({
      fulfillmentText: ""
    });
    return;
  }

  try {
    // Send the API request to Cohere with only the most recent query
    const apiResponse = await axios.post('https://api.cohere.ai/v1/chat', {
      message: userQuery,  // Only send the most recent user query
      chat_history: [{ role: 'User', message: userQuery }],  // Include the latest user query in chat history
      model: 'db87b9ea-6013-4442-88c4-805a364fd2f6-ft', // Ensure you're using the correct model
      preamble: ""
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 100000
    });

    console.log("🤖 Cohere API Full Response:", JSON.stringify(apiResponse.data, null, 2));

    if (apiResponse.data.text) {
      const cohereText = apiResponse.data.text.trim();
      conversationHistory.push({ query: userQuery, response: cohereText });
      response.json({
        fulfillmentText: cohereText
      });
    } else {
      console.error("🚨 Cohere API did not return 'text' field.");
      response.json({
        fulfillmentText: "Answer too long to be said. Please try another question."
      });
    }

  } catch (error) {
    console.error("❌ Error calling Cohere API:", error);
    response.json({
      fulfillmentText: "An error occured. Please try again later."
    });
  }
}

// Set up the POST route for the webhook
app.post('/dialogflowWebhook', handleWebhook);

// Start the server on port 3000
const port = 3000;
app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
