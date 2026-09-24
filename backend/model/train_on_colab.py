"""
=======================================================
  MANGO LEAF DISEASE DETECTION — GOOGLE COLAB NOTEBOOK
  Copy this entire file into ONE Colab cell and run it.
  Runtime: Runtime > Change runtime type > T4 GPU
=======================================================

HOW TO USE:
  1. Go to https://colab.research.google.com
  2. File > New Notebook
  3. Runtime > Change runtime type > T4 GPU  (FREE)
  4. Paste this entire script into one cell
  5. Run it — it does EVERYTHING automatically:
       • Downloads the dataset from Kaggle
       • Trains MobileNetV2 CNN (~30–60 min)
       • Converts model to TF.js format
       • Downloads model files to your computer
  6. Place the downloaded files in:  backend/model/
  7. Restart your Node.js backend — CNN mode activates!
"""

# ════════════════════════════════════════════════════════════
# CELL 1 — Install dependencies
# ════════════════════════════════════════════════════════════
import subprocess, sys

def install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", pkg])

install("kaggle")
install("tensorflowjs")

print("✅ Dependencies installed")

# ════════════════════════════════════════════════════════════
# CELL 2 — Kaggle API setup
# ════════════════════════════════════════════════════════════
"""
BEFORE RUNNING THIS CELL:
  1. Go to https://www.kaggle.com → Your Profile → Settings → API → Create New Token
  2. It downloads  kaggle.json  to your computer
  3. Run the cell below — it will ask you to UPLOAD that kaggle.json file
"""

from google.colab import files
import os, json, zipfile, shutil

print("📤 Please upload your  kaggle.json  file when prompted...")
uploaded = files.upload()   # ← Upload kaggle.json here

# Save kaggle credentials
os.makedirs("/root/.config/kaggle", exist_ok=True)
with open("/root/.config/kaggle/kaggle.json", "wb") as f:
    f.write(uploaded["kaggle.json"])
os.chmod("/root/.config/kaggle/kaggle.json", 0o600)

print("✅ Kaggle credentials saved")

# ════════════════════════════════════════════════════════════
# CELL 3 — Download dataset
# ════════════════════════════════════════════════════════════
print("📥 Downloading Mango Leaf Disease dataset from Kaggle...")
os.system("kaggle datasets download -d aryashah2k/mango-leaf-disease-dataset --unzip -p /content/dataset")
print("✅ Dataset downloaded!")

# Check what folders are in the dataset
import os
for name in sorted(os.listdir("/content/dataset")):
    count = len(os.listdir(f"/content/dataset/{name}")) if os.path.isdir(f"/content/dataset/{name}") else 0
    print(f"   {name}:  {count} images")

# ════════════════════════════════════════════════════════════
# CELL 4 — Train the CNN (MobileNetV2)
# ════════════════════════════════════════════════════════════
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
import numpy as np, json

# ── Config ───────────────────────────────────────────────────
DATASET_PATH = "/content/dataset"
IMG_SIZE     = 224
BATCH_SIZE   = 32
EPOCHS       = 30   # EarlyStopping will stop earlier if accuracy plateaus

print("🚀 Starting CNN training on GPU:", tf.config.list_physical_devices('GPU'))

# ── Data generators ──────────────────────────────────────────
datagen = ImageDataGenerator(
    rescale          = 1.0 / 255.0,
    rotation_range   = 25,
    width_shift_range= 0.2,
    height_shift_range=0.2,
    horizontal_flip  = True,
    zoom_range       = 0.2,
    brightness_range = [0.8, 1.2],
    shear_range      = 0.1,
    validation_split = 0.20,          # 80% train, 20% validation
)

train_gen = datagen.flow_from_directory(
    DATASET_PATH,
    target_size  = (IMG_SIZE, IMG_SIZE),
    batch_size   = BATCH_SIZE,
    class_mode   = "categorical",
    subset       = "training",
    shuffle      = True,
)
val_gen = datagen.flow_from_directory(
    DATASET_PATH,
    target_size  = (IMG_SIZE, IMG_SIZE),
    batch_size   = BATCH_SIZE,
    class_mode   = "categorical",
    subset       = "validation",
    shuffle      = False,
)

NUM_CLASSES = train_gen.num_classes
print(f"   Classes found: {NUM_CLASSES}")
print(f"   Training samples: {train_gen.samples}")
print(f"   Validation samples: {val_gen.samples}")

# ── Save class labels → class_labels.json ────────────────────
# Format:  { "0": "Anthracnose", "1": "Bacterial Canker", ... }
class_indices = train_gen.class_indices           # { "Anthracnose": 0, ... }
labels_map    = {str(v): k for k, v in class_indices.items()}
with open("/content/class_labels.json", "w") as f:
    json.dump(labels_map, f, indent=2)
print("✅ class_labels.json saved:")
print(json.dumps(labels_map, indent=2))

# ── Build model ───────────────────────────────────────────────
base = MobileNetV2(
    weights      = "imagenet",
    include_top  = False,
    input_shape  = (IMG_SIZE, IMG_SIZE, 3),
)
base.trainable = False          # Freeze ImageNet weights for transfer learning

x = base.output
x = GlobalAveragePooling2D()(x)
x = Dropout(0.3)(x)
x = Dense(256, activation="relu")(x)
x = Dropout(0.2)(x)
out = Dense(NUM_CLASSES, activation="softmax")(x)

model = Model(inputs=base.input, outputs=out)

model.compile(
    optimizer = tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss      = "categorical_crossentropy",
    metrics   = ["accuracy"],
)

print(f"\n📐 Model parameters: {model.count_params():,}")

# ── Phase 1: Train only the new top layers (base frozen) ─────
print("\n📚 Phase 1: Training top layers (base model frozen)...")
history1 = model.fit(
    train_gen,
    validation_data = val_gen,
    epochs          = 15,
    callbacks       = [
        EarlyStopping(patience=4, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(factor=0.5, patience=3, verbose=1),
        ModelCheckpoint("/content/best_model.h5", save_best_only=True, monitor="val_accuracy", verbose=1),
    ],
)

# ── Phase 2: Fine-tune — unfreeze last 30 layers ─────────────
print("\n🔧 Phase 2: Fine-tuning last 30 layers of MobileNetV2...")
for layer in base.layers[-30:]:
    layer.trainable = True

model.compile(
    optimizer = tf.keras.optimizers.Adam(learning_rate=1e-5),   # much lower LR for fine-tuning
    loss      = "categorical_crossentropy",
    metrics   = ["accuracy"],
)

history2 = model.fit(
    train_gen,
    validation_data = val_gen,
    epochs          = EPOCHS,
    callbacks       = [
        EarlyStopping(patience=5, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(factor=0.5, patience=3, verbose=1),
        ModelCheckpoint("/content/best_model.h5", save_best_only=True, monitor="val_accuracy", verbose=1),
    ],
)

# ── Evaluate ──────────────────────────────────────────────────
loss, acc = model.evaluate(val_gen, verbose=0)
print(f"\n🎯 Final Validation Accuracy: {acc:.2%}")
print(f"   Final Validation Loss:     {loss:.4f}")

# ════════════════════════════════════════════════════════════
# CELL 5 — Convert model to TensorFlow.js format
# ════════════════════════════════════════════════════════════
import os

MODEL_SAVE_PATH = "/content/best_model.h5"
TFJS_OUTPUT     = "/content/tfjs_model"

print("🔄 Converting model to TensorFlow.js format...")
os.makedirs(TFJS_OUTPUT, exist_ok=True)

# Run tensorflowjs_converter
result = os.system(
    f"tensorflowjs_converter "
    f"--input_format=keras "
    f"--output_format=tfjs_layers_model "
    f"{MODEL_SAVE_PATH} "
    f"{TFJS_OUTPUT}"
)

if result == 0:
    print("✅ Conversion successful!")
    print("\n📦 Files in tfjs_model/:")
    for fname in os.listdir(TFJS_OUTPUT):
        fsize = os.path.getsize(f"{TFJS_OUTPUT}/{fname}") / 1024
        print(f"   {fname}  ({fsize:.1f} KB)")
else:
    print("❌ Conversion failed. Check errors above.")

# ════════════════════════════════════════════════════════════
# CELL 6 — Download everything to your computer
# ════════════════════════════════════════════════════════════
from google.colab import files
import shutil

# Zip the tfjs model folder
shutil.make_archive("/content/tfjs_model", "zip", TFJS_OUTPUT)

print("📥 Downloading files to your computer...")
print("   (1/2) Downloading tfjs_model.zip ...")
files.download("/content/tfjs_model.zip")

print("   (2/2) Downloading class_labels.json ...")
files.download("/content/class_labels.json")

print("""
✅ DONE! Two files downloaded to your computer.

══════════════════════════════════════════════════
NEXT STEPS:
1. Unzip  tfjs_model.zip
2. Place ALL files from it + class_labels.json into:
      Agri-Connect-main/backend/model/

   Final structure:
      backend/model/
      ├── model.json
      ├── group1-shard1ofX.bin
      ├── ...more .bin files...
      └── class_labels.json

3. Restart your Node.js backend (npm run dev)
4. The console will show:
      ✅ CNN Mango Disease Model loaded successfully
5. Open the app → Disease Detection → Upload a leaf!
══════════════════════════════════════════════════
""")
