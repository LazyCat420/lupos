const serverAddress = "127.0.0.1:8188";
// const clientId = randomUUID();
const WebSocket = require('ws');
const crypto = require('crypto');
const clientId = crypto.randomBytes(20).toString('hex');

async function queuePrompt(prompt) {
    const response = await fetch(`http://${serverAddress}/prompt`, {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt, client_id: clientId }),
        headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
}

async function getImage(filename, subfolder, folderType) {
    const params = new URLSearchParams({ filename, subfolder, type: folderType });
    const response = await fetch(`http://${serverAddress}/view?${params}`);
    return response.arrayBuffer(); // Use arrayBuffer for binary data
}

async function getHistory(promptId) {
    const response = await fetch(`http://${serverAddress}/history/${promptId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    return await response.json();
}

async function getImages(prompt) {
    const websocket = new WebSocket(`ws://${serverAddress}/ws?clientId=${clientId}`);
    const { prompt_id: promptId } = await queuePrompt(prompt);
    const outputImages = {};

    return new Promise((resolve, reject) => {
        websocket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'executing') {
                const data = message.data;
                if (data.node === null && data.prompt_id === promptId) { // this is how we know that it's done rendering
                    websocket.close();
                    const history = await getHistory(promptId);
                    const historyPromptId = history[promptId];
                    for (const node_id in historyPromptId.outputs) {
                        const nodeOutput = historyPromptId.outputs[node_id];
                        if ('images' in nodeOutput) {
                            const imagesOutput = [];
                            for (const image of nodeOutput.images) {
                                const imageBuffer = await getImage(image.filename, image.subfolder, image.type);
                                // Convert buffer to base64
                                const base64Image = Buffer.from(imageBuffer).toString('base64');
                                imagesOutput.push(base64Image);
                            }
                            outputImages[node_id] = imagesOutput;
                        }
                    }
                    resolve(outputImages);
                }
            }
        };

        websocket.onerror = (error) => {
            reject(error);
        };
    });
}

const prompt = {
    "3": {
      "inputs": {
        "seed": 653907293513980,
        "steps": 20,
        "cfg": 4,
        "sampler_name": "euler_ancestral",
        "scheduler": "simple",
        "denoise": 0.9,
        "model": [
          "30",
          0
        ],
        "positive": [
          "6",
          0
        ],
        "negative": [
          "7",
          0
        ],
        "latent_image": [
          "34",
          0
        ]
      },
      "class_type": "KSampler",
      "_meta": {
        "title": "KSampler"
      }
    },
    "6": {
      "inputs": {
        "text": "a photograph portrait close up of a purple wolf with a red full moon in the background, growling, angry, vicious??!",
        "clip": [
          "37",
          0
        ]
      },
      "class_type": "CLIPTextEncode",
      "_meta": {
        "title": "CLIP Text Encode (Prompt)"
      }
    },
    "7": {
      "inputs": {
        "text": "watermark, signature",
        "clip": [
          "37",
          0
        ]
      },
      "class_type": "CLIPTextEncode",
      "_meta": {
        "title": "CLIP Text Encode (Prompt)"
      }
    },
    "8": {
      "inputs": {
        "samples": [
          "33",
          0
        ],
        "vae": [
          "29",
          0
        ]
      },
      "class_type": "VAEDecode",
      "_meta": {
        "title": "VAE Decode"
      }
    },
    "9": {
      "inputs": {
        "filename_prefix": "ComfyUI",
        "images": [
          "8",
          0
        ]
      },
      "class_type": "SaveImage",
      "_meta": {
        "title": "Save Image"
      }
    },
    "29": {
      "inputs": {
        "vae_name": "stage_a.safetensors"
      },
      "class_type": "VAELoader",
      "_meta": {
        "title": "Load VAE"
      }
    },
    "30": {
      "inputs": {
        "unet_name": "stage_c.safetensors"
      },
      "class_type": "UNETLoader",
      "_meta": {
        "title": "UNETLoader"
      }
    },
    "32": {
      "inputs": {
        "unet_name": "stage_b.safetensors"
      },
      "class_type": "UNETLoader",
      "_meta": {
        "title": "UNETLoader"
      }
    },
    "33": {
      "inputs": {
        "seed": 744257796489419,
        "steps": 5,
        "cfg": 1.4000000000000001,
        "sampler_name": "dpmpp_sde",
        "scheduler": "sgm_uniform",
        "denoise": 1,
        "model": [
          "32",
          0
        ],
        "positive": [
          "36",
          0
        ],
        "negative": [
          "40",
          0
        ],
        "latent_image": [
          "34",
          1
        ]
      },
      "class_type": "KSampler",
      "_meta": {
        "title": "KSampler"
      }
    },
    "34": {
      "inputs": {
        "width": 1024,
        "height": 768,
        "compression": 32,
        "batch_size": 1
      },
      "class_type": "StableCascade_EmptyLatentImage",
      "_meta": {
        "title": "StableCascade_EmptyLatentImage"
      }
    },
    "36": {
      "inputs": {
        "conditioning": [
          "40",
          0
        ],
        "stage_c": [
          "3",
          0
        ]
      },
      "class_type": "StableCascade_StageB_Conditioning",
      "_meta": {
        "title": "StableCascade_StageB_Conditioning"
      }
    },
    "37": {
      "inputs": {
        "clip_name": "model.safetensors",
        "type": "stable_cascade"
      },
      "class_type": "CLIPLoader",
      "_meta": {
        "title": "Load CLIP"
      }
    },
    "40": {
      "inputs": {
        "conditioning": [
          "6",
          0
        ]
      },
      "class_type": "ConditioningZeroOut",
      "_meta": {
        "title": "ConditioningZeroOut"
      }
    },
    "41": {
      "inputs": {
        "mode": "always",
        "volume": 0.5,
        "file": "notify.mp3",
        "any": [
          "8",
          0
        ]
      },
      "class_type": "PlaySound|pysssss",
      "_meta": {
        "title": "PlaySound 🐍"
      }
    }
};

// Modify the prompt as necessary before using it
// prompt["6"]["inputs"]["text"] = "masterpiece best quality man";
// prompt["3"]["inputs"]["seed"] = 5;

const ComfyUILibrary = {
    generateImagePrompt(message) {
        const fullPrompt = prompt
        if (message) {
            fullPrompt["6"]["inputs"]["text"] = message;
        }
        return fullPrompt
    },
    instantiateWebSocket() {
        const websocket = new WebSocket(`ws://${serverAddress}/ws?clientId=${clientId}`);
        return websocket;
    },
    async getTheImages(prompt) {
        try {
            const images = await getImages(prompt);
            return images[9][0];
        } catch (error) {
            console.error(error);
        }
    }
};


module.exports = ComfyUILibrary;