const axios = require('axios');
/**
 * Send a prompt to the configured LLM provider and return the response.
 * The API key and endpoint are read from environment variables.
 *
 * LLM_API_KEY   - key for authenticating with the provider
 * LLM_API_URL   - HTTP endpoint for chat completions
 */
async function callLLM({ payload, prompt, model, apiUrl, apiKey }) {
  const finalApiKey = apiKey || process.env.LLM_API_KEY;
  const finalUrl = apiUrl || process.env.LLM_API_URL;

  if (!finalApiKey) {
    throw new Error('LLM API key not configured');
  }

  // If a full payload is provided use it directly, otherwise build the
  // default chat-completion body from the prompt and model.
  // 需要更改model！
  const body = payload || {
    model: model || process.env.LLM_MODEL,
    messages: [{ role: 'user', content: prompt }]
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${finalApiKey}`
  };

  const { data } = await axios.post(finalUrl, body, { headers });
  return data;
}

async function chat(prompt) {
  return callLLM({ prompt });
}

module.exports = {
  chat,
  callLLM
};
