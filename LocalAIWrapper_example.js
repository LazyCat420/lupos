require('dotenv/config');

const {
    LOCAL_LANGUAGE_MODEL_API_URL,
    LANGUAGE_MODEL_TEMPERATURE,
    LANGUAGE_MODEL_MAX_TOKENS
} = require('../config.json');

const LocalAIWrapper = {
    async generateText(conversation, tokens) {
        try {
            const messages = conversation.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const requestBody = {
                model: "llama3.1:8b", // Make sure this matches the model name in Ollama
                messages: messages,
                temperature: LANGUAGE_MODEL_TEMPERATURE,
                max_tokens: tokens || LANGUAGE_MODEL_MAX_TOKENS,
                stream: false
            };

            console.log('Request to Ollama:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(LOCAL_LANGUAGE_MODEL_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Ollama API Error:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }

            const responseJson = await response.json();
            console.log('Response from Ollama:', JSON.stringify(responseJson, null, 2));
            
            if (responseJson.message && responseJson.message.content) {
                return responseJson.message.content.trim();
            } else if (responseJson.choices && responseJson.choices[0] && responseJson.choices[0].message) {
                return responseJson.choices[0].message.content.trim();
            } else {
                console.error('Unexpected response structure:', responseJson);
                return 'I apologize, but I encountered an error while processing your request.';
            }
        } catch (error) {
            console.error('Error in LocalAIWrapper.generateText:', error);
            return 'I apologize, but I encountered an error while processing your request.';
        }
    }
};

module.exports = LocalAIWrapper;
