import * as tf from '@tensorflow/tfjs';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Multer: store uploaded image in memory (no disk write needed) ────────────
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// ── Paths ────────────────────────────────────────────────────────────────────
const MODEL_PATH  = path.join(__dirname, '../model/model.json');
const LABELS_PATH = path.join(__dirname, '../model/class_labels.json');

// ── Load class labels ────────────────────────────────────────────────────────
let classLabels = {};
if (fs.existsSync(LABELS_PATH)) {
  classLabels = JSON.parse(fs.readFileSync(LABELS_PATH, 'utf-8'));
  // Expected format: { "0": "Anthracnose", "1": "Bacterial Canker", ... }
  console.log('✅ Class labels loaded:', classLabels);
} else {
  console.warn('⚠️  class_labels.json not found at:', LABELS_PATH);
}

// ── Custom IO Handler for loading TensorFlow.js models from local filesystem 
// and converting Keras 3 model topology metadata to be compatible with TF.js (Keras 2)
function nodeFileSystemHandler(modelJsonPath) {
  return {
    load: async () => {
      const modelJsonDir = path.dirname(modelJsonPath);
      const modelJsonContent = fs.readFileSync(modelJsonPath, 'utf8');
      const modelJson = JSON.parse(modelJsonContent);

      const modelTopology = modelJson.modelTopology;
      const depthwiseLayers = new Set();
      
      // Fix Keras 3 model topology compatibility with TF.js
      if (modelTopology && modelTopology.model_config && modelTopology.model_config.config) {
        const config = modelTopology.model_config.config;
        
        // 1. Wrap input_layers / output_layers if flat arrays
        if (config.input_layers && typeof config.input_layers[0] === 'string') {
          config.input_layers = [config.input_layers];
        }
        if (config.output_layers && typeof config.output_layers[0] === 'string') {
          config.output_layers = [config.output_layers];
        }
        
        // 2. Fix layers list
        if (config.layers) {
          for (const layer of config.layers) {
            if (layer.class_name === 'DepthwiseConv2D') {
              depthwiseLayers.add(layer.name);
            }
            if (layer.class_name === 'InputLayer' && layer.config) {
              if (layer.config.batch_shape && !layer.config.batchInputShape) {
                layer.config.batchInputShape = layer.config.batch_shape;
              }
            }
            if (layer.inbound_nodes) {
              const convertedNodes = [];
              for (const node of layer.inbound_nodes) {
                if (Array.isArray(node)) {
                  convertedNodes.push(node);
                  continue;
                }
                if (node && typeof node === 'object' && node.args) {
                  const inputs = [];
                  for (const arg of node.args) {
                    if (Array.isArray(arg)) {
                      for (const subArg of arg) {
                        if (subArg && subArg.class_name === '__keras_tensor__' && subArg.config && subArg.config.keras_history) {
                          const [layerName, nodeIdx, tensorIdx] = subArg.config.keras_history;
                          inputs.push([layerName, nodeIdx, tensorIdx, {}]);
                        }
                      }
                    } else if (arg && arg.class_name === '__keras_tensor__' && arg.config && arg.config.keras_history) {
                      const [layerName, nodeIdx, tensorIdx] = arg.config.keras_history;
                      inputs.push([layerName, nodeIdx, tensorIdx, {}]);
                    }
                  }
                  convertedNodes.push(inputs);
                }
              }
              layer.inbound_nodes = convertedNodes;
            }
          }
        }
      }
      
      let weightSpecs = [];
      const weightsManifest = modelJson.weightsManifest;
      if (weightsManifest) {
        for (const group of weightsManifest) {
          if (group.weights) {
            for (const weight of group.weights) {
              const parts = weight.name.split('/');
              const layerName = parts[0];
              const varName = parts.slice(1).join('/');
              if (depthwiseLayers.has(layerName) && varName === 'kernel') {
                weight.name = `${layerName}/depthwise_kernel`;
              }
              weightSpecs.push(weight);
            }
          }
        }
      }

      const weightBuffers = [];
      if (weightsManifest) {
        for (const group of weightsManifest) {
          for (const shardPath of group.paths) {
            const fullShardPath = path.resolve(modelJsonDir, shardPath);
            const shardBuffer = fs.readFileSync(fullShardPath);
            weightBuffers.push(shardBuffer);
          }
        }
      }

      const combinedBuffer = Buffer.concat(weightBuffers);
      const weightData = combinedBuffer.buffer.slice(
        combinedBuffer.byteOffset,
        combinedBuffer.byteOffset + combinedBuffer.byteLength
      );

      return {
        modelTopology,
        weightSpecs,
        weightData,
      };
    }
  };
}

// ── Load CNN model ONCE at server startup (not on every request) ─────────────
let model = null;
let modelReady = false;

const loadModel = async () => {
  if (!fs.existsSync(MODEL_PATH)) {
    console.warn('⚠️  model.json not found. Running in DEMO MODE.');
    console.warn('    Place your trained TF.js model files in: backend/model/');
    return;
  }
  try {
    const handler = nodeFileSystemHandler(MODEL_PATH);
    model = await tf.loadLayersModel(handler);
    modelReady = true;
    console.log('✅ CNN Mango Disease Model loaded successfully');
    console.log('   Input shape:', model.inputs[0].shape);
    console.log('   Output shape:', model.outputs[0].shape);
  } catch (err) {
    console.error('❌ Failed to load CNN model:', err.message);
  }
};
loadModel(); // Call on server start

// ── Disease info: precautions, treatment, prevention ─────────────────────────
const diseaseInfo = {
  Anthracnose: {
    severity: 'High',
    description:
      'A fungal disease caused by Colletotrichum gloeosporioides. Dark sunken lesions appear on leaves, fruits, and twigs.',
    precautions: [
      'Remove and destroy all infected plant parts immediately',
      'Avoid overhead irrigation — use drip irrigation instead',
      'Improve air circulation by pruning the dense canopy',
      'Do not store infected fruits alongside healthy ones',
      'Sterilize pruning tools with 70% alcohol between cuts',
    ],
    treatment: [
      'Spray Copper Oxychloride (3g per litre of water) at 15-day intervals',
      'Apply Mancozeb 75% WP (2.5g/L) before and after flowering',
      'Use Carbendazim 50% WP (1g/L) post-flowering',
      'Repeat fungicide sprays during humid or rainy seasons',
    ],
    prevention: [
      'Use only certified disease-free planting material',
      'Apply prophylactic copper spray before the monsoon season',
      'Maintain proper spacing between trees (8–10 metres)',
      'Plant resistant mango varieties when available',
    ],
  },
  'Powdery Mildew': {
    severity: 'Medium',
    description:
      'Caused by Oidium mangiferae. White powdery coating appears on leaves, flower panicles, and young fruits.',
    precautions: [
      'Prune the dense canopy to improve sunlight penetration',
      'Avoid excess nitrogen fertiliser application',
      'Remove and burn infected flower panicles promptly',
      'Monitor closely during dry cool weather (flowering season)',
      'Keep the orchard floor clean and weed-free',
    ],
    treatment: [
      'Spray Wettable Sulphur (2–3g/L) every 10 days at onset',
      'Apply Triadimefon 25% WP (1g/L) for early-stage infection',
      'Use Hexaconazole 5% SC (1 mL/L) for severe infection',
      'Spray Dinocap (Karathane) 48% EC (1 mL/L) if needed',
    ],
    prevention: [
      'Apply the first spray at panicle emergence',
      'Plant mango varieties with natural resistance',
      'Avoid planting in areas with poor air circulation',
      'Maintain adequate spacing to reduce canopy humidity',
    ],
  },
  'Bacterial Canker': {
    severity: 'High',
    description:
      'Caused by Xanthomonas campestris pv. mangiferaeindicae. Water-soaked lesions appear on leaves that turn brown with a yellow halo.',
    precautions: [
      'Use only certified disease-free planting material',
      'Sterilize all pruning and grafting tools before and after use',
      'Avoid creating unnecessary wounds during maintenance',
      'Remove and burn all infected plant material immediately',
      'Restrict water splash from irrigation to limit bacterial spread',
    ],
    treatment: [
      'Spray Copper Hydroxide (2g/L) every 14 days',
      'Apply Bordeaux mixture (1%) at first sign of infection',
      'Use Streptomycin Sulphate (500 ppm) for severe cases',
      'Apply Copper Oxychloride (3g/L) during rainy season',
    ],
    prevention: [
      'Plant bacterial-canker-resistant mango varieties',
      'Ensure proper orchard drainage to prevent waterlogging',
      'Apply protective copper spray before the monsoon',
      'Avoid planting in frost-prone or high-humidity zones',
    ],
  },
  'Die Back': {
    severity: 'High',
    description:
      'Caused by Lasiodiplodia theobromae. Shoots die back progressively from the tip to the base; bark turns dark brown.',
    precautions: [
      'Remove dead and dying shoots at least 15 cm below the infected area',
      'Immediately paint pruned surfaces with Bordeaux paste',
      'Avoid stressing the tree through drought or waterlogging',
      'Burn all infected pruned material — do not compost',
      'Never prune during wet or highly humid conditions',
    ],
    treatment: [
      'Spray Carbendazim + Mancozeb combination (2g/L)',
      'Apply Thiophanate-methyl 70% WP (1g/L) on affected shoots',
      'Use Copper Oxychloride (3g/L) on all cut and pruned surfaces',
      'Drench soil around the base with Thiram 75% WS (2.5g/L)',
    ],
    prevention: [
      'Keep trees healthy with balanced NPK fertilisation',
      'Ensure adequate irrigation, especially during dry spells',
      'Apply wound-healing paste after every pruning activity',
      'Avoid injuring tree bark during orchard field operations',
    ],
  },
  'Gall Midge': {
    severity: 'Medium',
    description:
      'Insect pest (Erosomyia mangiferae). Galls form on young leaves and shoot tips; larvae feed inside the tissue causing distortion.',
    precautions: [
      'Destroy all affected shoots and leaves without delay',
      'Set up light traps during adult midge emergence (flushing season)',
      'Remove and burn fallen leaf litter and shoot debris',
      'Prevent movement of infected plant material to other farms',
      'Monitor trees closely during every new flush emergence',
    ],
    treatment: [
      'Spray Dimethoate 30% EC (1.5 mL/L) at flush emergence',
      'Apply Quinalphos 25% EC (2 mL/L) at 10-day intervals',
      'Use Imidacloprid 17.8% SL (0.5 mL/L) for severe infestation',
      'Apply Malathion 50% EC (2 mL/L) as a supplementary spray',
    ],
    prevention: [
      'Time pruning to minimise new flushes during peak midge activity',
      'Encourage natural predators such as parasitic wasps',
      'Apply Neem oil (5 mL/L) prophylactically before flushing season',
      'Maintain high orchard hygiene to reduce overwintering pest population',
    ],
  },
  'Sooty Mould': {
    severity: 'Medium',
    description:
      'Black sooty fungal coating on leaves caused by fungi growing on honeydew secreted by sucking pests (aphids, whiteflies, mealybugs).',
    precautions: [
      'First control the underlying sucking insect pests',
      'Improve canopy air circulation through regular pruning',
      'Wash heavily infected leaves with clean pressurised water',
      'Avoid excess nitrogen fertilisation that promotes lush, pest-attracting growth',
      'Inspect the underside of leaves regularly for pest colonies',
    ],
    treatment: [
      'Spray Neem oil (5 mL/L) to simultaneously control insects and mould',
      'Apply Starch solution (10g/L) to suffocate the mould coating',
      'Use Imidacloprid (0.5 mL/L) to quickly control sucking pests',
      'Spray dilute Copper fungicide (2g/L) if mould coating is very thick',
    ],
    prevention: [
      'Place yellow sticky traps to monitor and reduce whitefly populations',
      'Release biological control agents such as Encarsia for whiteflies',
      'Avoid planting adjacent to heavily pest-infested trees or hedges',
      'Inspect and treat at the first sign of any sucking pest activity',
    ],
  },
  'Red Rust': {
    severity: 'Low',
    description:
      'Caused by algal parasite Cephaleuros virescens. Reddish-brown rust-coloured patches appear on the upper surface of leaves.',
    precautions: [
      'Maintain proper orchard drainage to avoid waterlogging',
      'Avoid water stagnation around the tree base',
      'Improve light penetration into the canopy by strategic pruning',
      'Remove and burn affected leaves to reduce algal spore dispersal',
      'Ensure irrigation water is clean and uncontaminated',
    ],
    treatment: [
      'Spray Copper Oxychloride (3g/L) at 2-week intervals',
      'Apply Chlorothalonil 75% WP (2g/L) on affected leaf surfaces',
      'Use Bordeaux mixture (1%) for broad preventive coverage',
      'Physically scrub algal patches from accessible branches',
    ],
    prevention: [
      'Ensure excellent orchard drainage before planting',
      'Avoid planting in shaded, poorly ventilated, or high-humidity areas',
      'Apply copper-based spray routinely during monsoon as prevention',
      'Maintain tree vigour with proper balanced nutrition',
    ],
  },
  Healthy: {
    severity: 'None',
    description:
      'Your mango leaf appears perfectly healthy with no visible signs of disease. Keep up your current plant care routine!',
    precautions: [
      'Monitor leaves weekly for any early disease signs',
      'Maintain proper irrigation — avoid both overwatering and drought stress',
      'Apply balanced NPK fertiliser as per the growth stage',
      'Keep the orchard floor clean and free of diseased debris',
      'Inspect for pest activity during every new flush emergence',
    ],
    treatment: [
      'No treatment required — your mango plant is healthy! 🌿',
    ],
    prevention: [
      'Apply a preventive copper spray before the monsoon season',
      'Ensure adequate spacing between trees for good air circulation',
      'Follow a regular pruning schedule after each harvest',
      'Use certified disease-free grafting or planting material for expansion',
      'Continue regular scouting so problems are caught early',
    ],
  },
};

// ── Demo-mode predictions (used when model files are not yet placed) ──────────
const DEMO_PREDICTIONS = [
  { disease: 'Anthracnose',     confidence: 92 },
  { disease: 'Powdery Mildew',  confidence: 87 },
  { disease: 'Bacterial Canker',confidence: 79 },
  { disease: 'Healthy',         confidence: 97 },
];

// ── Main controller ───────────────────────────────────────────────────────────
export const detectDisease = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    let diseaseName, confidence, isDemo = false;
    let inferenceTimeMs = 0;

    if (modelReady && model) {
      // ── Real CNN inference ──────────────────────────────────────────────────
      const startTime = performance.now();

      // 1. Preprocess image: resize to 224×224, strip alpha, get raw RGB buffer
      const rawBuffer = await sharp(req.file.buffer)
        .resize(224, 224)
        .removeAlpha()
        .raw()
        .toBuffer();

      // 2. Build float32 tensor and normalise pixel values to [0, 1]
      const float32Data = new Float32Array(rawBuffer.length);
      for (let i = 0; i < rawBuffer.length; i++) {
        float32Data[i] = rawBuffer[i] / 255.0;
      }

      // 3. Shape: [1, 224, 224, 3]  (batch of 1)
      const tensor = tf.tensor4d(float32Data, [1, 224, 224, 3]);

      // 4. Run model prediction
      const predictionTensor = model.predict(tensor);
      const probabilities = await predictionTensor.data(); // Float32Array

      // 5. Pick class with highest probability
      let maxProb = 0, maxIdx = 0;
      for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] > maxProb) { maxProb = probabilities[i]; maxIdx = i; }
      }

      diseaseName = classLabels[maxIdx.toString()] || `Class_${maxIdx}`;
      confidence  = Math.round(maxProb * 100);

      // 6. Free GPU/CPU memory
      tensor.dispose();
      predictionTensor.dispose();

      const endTime = performance.now();
      inferenceTimeMs = Math.round(endTime - startTime);

      console.log(`✅ CNN Prediction: ${diseaseName} (${confidence}%) in ${inferenceTimeMs}ms`);

    } else {
      // ── Demo mode: model files not yet placed ───────────────────────────────
      isDemo = true;
      const pick = DEMO_PREDICTIONS[Math.floor(Math.random() * DEMO_PREDICTIONS.length)];
      diseaseName = pick.disease;
      confidence  = pick.confidence;
      console.log(`ℹ️  Demo mode — returning sample result: ${diseaseName}`);
    }

    // Fetch precautions / treatment info from local data
    const info = diseaseInfo[diseaseName] || diseaseInfo['Healthy'];

    return res.status(200).json({
      disease:     diseaseName,
      confidence:  confidence,
      severity:    info.severity,
      description: info.description,
      precautions: info.precautions,
      treatment:   info.treatment,
      prevention:  info.prevention,
      model_mode:  isDemo ? 'demo' : 'cnn',
      latency_ms:  inferenceTimeMs,
    });

  } catch (err) {
    console.error('Disease Detection Error:', err.message);
    return res.status(500).json({
      error: 'Failed to analyse the image. Please try again with a clear mango leaf photo.',
    });
  }
};
