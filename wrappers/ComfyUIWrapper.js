const WebSocket = require('ws');
const crypto = require('crypto');
const clientId = crypto.randomBytes(20).toString('hex');

const {
    COMFY_UI_IMAGE_MODEL_API_URL,
    COMFY_UI_IMAGE_MODEL_WEBSOCKET_URL,
} = require('../config.json');

async function postPrompt(prompt) {
    try {
        const response = await fetch(`${COMFY_UI_IMAGE_MODEL_API_URL}/prompt`, {
            method: 'POST',
            body: JSON.stringify({ prompt: prompt, client_id: clientId }),
            headers: { 'Content-Type': 'application/json' },
        });
        return response.json();
    } catch (error) {
        return console.error('Error posting prompt:', error);
    }
}

async function getImage(filename, subfolder, folderType) {
    const params = new URLSearchParams({ filename, subfolder, type: folderType });
    const response = await fetch(`${COMFY_UI_IMAGE_MODEL_API_URL}/view?${params}`);
    return response.arrayBuffer(); // Use arrayBuffer for binary data
}

async function getHistory(promptId) {
    const response = await fetch(`${COMFY_UI_IMAGE_MODEL_API_URL}/history/${promptId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    return await response.json();
}

function calculatePeriodsIncreaseOverTime(periods = '') {
  // start with 1 period, then two, then three, and go back to one
  let periodsIncreaseOverTime = periods + '.';
  if (periodsIncreaseOverTime.length > 3) {
    periodsIncreaseOverTime = '.';
  }
  return periodsIncreaseOverTime;
  
}

async function generateImage(prompt) {
    try {
        return new Promise((resolve, reject) => {
            const websocket = new WebSocket(`${COMFY_UI_IMAGE_MODEL_WEBSOCKET_URL}/ws?clientId=${clientId}`);
            websocket.onopen = async () => {
                try {
                    const { prompt_id: promptId } = await postPrompt(prompt);
                    const outputImages = {};

                    websocket.onmessage = async (event) => {
                        const message = JSON.parse(event.data);
                        if (message.type === 'executing' && message.data.node === null && message.data.prompt_id === promptId) {
                            websocket.close();
                            const history = await getHistory(promptId);
                            const historyPromptId = history[promptId];
                            for (const node_id in historyPromptId.outputs) {
                                const nodeOutput = historyPromptId.outputs[node_id];
                                if ('images' in nodeOutput) {
                                    const imagesOutput = [];
                                    for (const image of nodeOutput.images) {
                                        const imageBuffer = await getImage(image.filename, image.subfolder, image.type);
                                        const base64Image = Buffer.from(imageBuffer).toString('base64');
                                        imagesOutput.push(base64Image);
                                    }
                                    outputImages[node_id] = imagesOutput;
                                }
                            }
                            resolve(outputImages);
                        }
                    };
                } catch (innerError) {
                    reject(innerError);
                }
            };

            websocket.onerror = (error) => {
                reject();
                // reject(new Error('WebSocket error: ' + error.message));
                // resolve({})
            };
        });
    } catch (error) {
        console.error('Error generating image:', error);
        throw error; // Rethrow or handle as needed.
    }
}

async function checkWebsocketStatus() {
    try {
        return new Promise((resolve, reject) => {
            const websocket = new WebSocket(`${COMFY_UI_IMAGE_MODEL_WEBSOCKET_URL}/ws?clientId=${clientId}`);
            websocket.onopen = () => {
                websocket.close();
                resolve();
            };
            websocket.onerror = (error) => {
                console.error('⚠️ ComfyUI Is Down: Cannot Generate Image');
                reject();
            };
        })
    } catch (error) {
        console.error('⚠️ ComfyUI Is Down: Cannot Generate Image');
        throw error;
    }
}

const prompt = {
  "3": {
    "inputs": {
      "seed": 883917123996389,
      "steps": 32,
      "cfg": 5,
      "sampler_name": "euler",
      "scheduler": "simple",
      "denoise": 1,
      "model": [
        "30",
        0
      ],
      "positive": [
        "110",
        0
      ],
      "negative": [
        "112",
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
      "unet_name": "stage_c_bf16.safetensors"
    },
    "class_type": "UNETLoader",
    "_meta": {
      "title": "UNETLoader"
    }
  },
  "32": {
    "inputs": {
      "unet_name": "stage_b_bf16.safetensors"
    },
    "class_type": "UNETLoader",
    "_meta": {
      "title": "UNETLoader"
    }
  },
  "33": {
    "inputs": {
      "seed": 125835085563168,
      "steps": 10,
      "cfg": 1.1,
      "sampler_name": "euler",
      "scheduler": "simple",
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
        "112",
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
      "height": 1216,
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
        "110",
        0
      ]
    },
    "class_type": "ConditioningZeroOut",
    "_meta": {
      "title": "ConditioningZeroOut"
    }
  },
  "79": {
    "inputs": {
      "seed": 916071701976717,
      "steps": 30,
      "cfg": 9,
      "sampler_name": "euler",
      "scheduler": "karras",
      "denoise": 0.3,
      "model": [
        "92",
        0
      ],
      "positive": [
        "113",
        0
      ],
      "negative": [
        "114",
        0
      ],
      "latent_image": [
        "94",
        0
      ]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "KSampler"
    }
  },
  "92": {
    "inputs": {
      "ckpt_name": "redolives_v20.safetensors"
    },
    "class_type": "CheckpointLoaderSimple",
    "_meta": {
      "title": "POST CASCADE XL DETAIL"
    }
  },
  "94": {
    "inputs": {
      "pixels": [
        "8",
        0
      ],
      "vae": [
        "92",
        2
      ]
    },
    "class_type": "VAEEncode",
    "_meta": {
      "title": "VAE Encode"
    }
  },
  "96": {
    "inputs": {
      "ckpt_name": "newrealityxlAllInOne_21.safetensors"
    },
    "class_type": "CheckpointLoaderSimple",
    "_meta": {
      "title": "XL REFINER"
    }
  },
  "98": {
    "inputs": {
      "filename_prefix": "ComfyUI",
      "images": [
        "121",
        0
      ]
    },
    "class_type": "SaveImage",
    "_meta": {
      "title": "UPSCALE + LVL 2 REFINER FINAL"
    }
  },
  "100": {
    "inputs": {
      "seed": 767189133057789,
      "steps": 20,
      "cfg": 4,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 0.5,
      "model": [
        "96",
        0
      ],
      "positive": [
        "113",
        0
      ],
      "negative": [
        "114",
        0
      ],
      "latent_image": [
        "79",
        0
      ]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "KSampler"
    }
  },
  "101": {
    "inputs": {
      "samples": [
        "100",
        0
      ],
      "vae": [
        "96",
        2
      ]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE Decode"
    }
  },
  "105": {
    "inputs": {
      "images": [
        "8",
        0
      ]
    },
    "class_type": "PreviewImage",
    "_meta": {
      "title": "CASCADE BASE IMAGE PREVIEW"
    }
  },
  "110": {
    "inputs": {
      "text": "detailed photography of a caterpillar made out of rusted steel close up portrait, masterpiece photography, insane detail macrophotography. natural lighting with detailed depth of field, Shading depth, deeply detailed shading depth an award winning poster, Intricate photography lighting, High Detail, Sharp focus, dramatic, photorealistic image",
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
  "112": {
    "inputs": {
      "text": "blurry, cartoon, watermark, ugly, 2D, simple, flat, outlines, child",
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
  "113": {
    "inputs": {
      "text": "detailed photography of a caterpillar made out of rusted steel close up portrait, masterpiece photography, insane detail macrophotography. natural lighting with detailed depth of field, Shading depth, deeply detailed shading depth an award winning poster, Intricate photography lighting, High Detail, Sharp focus, dramatic, photorealistic image",
      "clip": [
        "92",
        1
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Prompt)"
    }
  },
  "114": {
    "inputs": {
      "text": "blurry, cartoon, watermark, ugly, 2D, simple, flat, outlines, child",
      "clip": [
        "92",
        1
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Prompt)"
    }
  },
  "116": {
    "inputs": {
      "dimensions": " 832 x 1216  (portrait)",
      "clip_scale": 2,
      "batch_size": 1
    },
    "class_type": "SDXL Empty Latent Image (rgthree)",
    "_meta": {
      "title": "SDXL Empty Latent Image (rgthree)"
    }
  },
  "117": {
    "inputs": {
      "model_name": "BSRGANx2.pth"
    },
    "class_type": "UpscaleModelLoader",
    "_meta": {
      "title": "Load Upscale Model"
    }
  },
  "118": {
    "inputs": {
      "upscale_model": [
        "117",
        0
      ],
      "image": [
        "101",
        0
      ]
    },
    "class_type": "ImageUpscaleWithModel",
    "_meta": {
      "title": "Upscale Image (using Model)"
    }
  },
  "119": {
    "inputs": {
      "pixels": [
        "118",
        0
      ],
      "vae": [
        "96",
        2
      ]
    },
    "class_type": "VAEEncode",
    "_meta": {
      "title": "VAE Encode"
    }
  },
  "120": {
    "inputs": {
      "seed": 846697725981818,
      "steps": 20,
      "cfg": 7.9,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 0.15,
      "model": [
        "96",
        0
      ],
      "positive": [
        "113",
        0
      ],
      "negative": [
        "114",
        0
      ],
      "latent_image": [
        "119",
        0
      ]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "KSampler"
    }
  },
  "121": {
    "inputs": {
      "samples": [
        "120",
        0
      ],
      "vae": [
        "96",
        2
      ]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE Decode"
    }
  },
  "122": {
    "inputs": {
      "images": [
        "101",
        0
      ]
    },
    "class_type": "PreviewImage",
    "_meta": {
      "title": "SDXL + LVL 1 REFINER PREVIEW"
    }
  }
}

function createImagePromptFromText(text) {
    const fullPrompt = prompt
    if (text) {
        fullPrompt["3"]["inputs"]["seed"] = Math.floor(Math.random() * 1000000000000000);
        fullPrompt["33"]["inputs"]["seed"] = Math.floor(Math.random() * 1000000000000000);
        fullPrompt["110"]["inputs"]["text"] = text;
        fullPrompt["113"]["inputs"]["text"] = text;
    }
    return fullPrompt
}

const ComfyUILibrary = {
    async generateImage(text) {
        try {
            const prompt = createImagePromptFromText(text);
            const images = await generateImage(prompt);
            return images[122][0];
        } catch (error) {
            return console.error('⚠️ ComfyUI Is Down: Cannot Generate Image');
        }
    },
    checkWebsocketStatus: checkWebsocketStatus,
};


module.exports = ComfyUILibrary;
