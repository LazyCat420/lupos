require('dotenv/config');

const {
    LOCAL_LANGUAGE_MODEL_API_URL,
    LANGUAGE_MODEL_TEMPERATURE,
    LANGUAGE_MODEL_MAX_TOKENS,
    LANGUAGE_MODEL_LOCAL
} = require('../config.json');

const LocalAIWrapper = {
    async generateText(
        conversation,
        model=LANGUAGE_MODEL_LOCAL,
        tokens=LANGUAGE_MODEL_MAX_TOKENS,
        temperature=LANGUAGE_MODEL_TEMPERATURE
    ) {
        let text;

        // remove name property from object in conversation
        conversation = conversation.map((message) => {
            if (message.name) {
                delete message.name;
            }
            return message;
        });

        const mergedData = conversation.reduce((acc, cur, index, array) => {
          if (cur.role === "user" || cur.role === "assistant" || cur.role === "system") {
            if (acc.length && acc[acc.length - 1].role === cur.role) {
              if (cur.role === "user" && (index === array.length - 1 || array[index + 1].role !== "user")) {
                acc[acc.length - 1].content += `\n\n# Directly reply to this message:\n${cur.content}`;
              } else {
                acc[acc.length - 1].content += `\n\n${cur.content}`;
              }
            } else {
              acc.push(cur);
            }
          }
          return acc;
        }, []);

        if (mergedData[1].role === "assistant") {
            mergedData.shift();
        }


        const response = await fetch(`${LOCAL_LANGUAGE_MODEL_API_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: mergedData,
                model: model,
                temperature: temperature,
                max_tokens: tokens,
                stream: false
            })
        }).catch(error => console.error('Error:', error));
        let responseJson = await response.json();
        console.log('responseJson', responseJson);
        console.log('responseJson', responseJson.choices[0].message);
        if (responseJson.choices[0].message.content) {
            text = responseJson.choices[0].message.content;
        }
        return text;
    },
    async generateEmbedding(text) {
        return await fetch(`${LOCAL_LANGUAGE_MODEL_API_URL}/v1/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // model: "text-embedding-ada-002",
                input: text
            })
        }).catch(error => console.error('Error:', error));
    },
};

module.exports = LocalAIWrapper;
