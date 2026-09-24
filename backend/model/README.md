# 📂 model/ — Place Your Trained TF.js Model Files Here

After training on Google Colab and running `tensorflowjs_converter`, copy the output files into THIS folder:

```
backend/model/
├── model.json              ← model architecture + weights manifest
├── group1-shard1of3.bin    ← weight binary shards (number varies by model size)
├── group1-shard2of3.bin
├── group1-shard3of3.bin
└── class_labels.json       ← { "0": "Anthracnose", "1": "Bacterial Canker", ... }
```

## class_labels.json format
```json
{
  "0": "Anthracnose",
  "1": "Bacterial Canker",
  "2": "Die Back",
  "3": "Gall Midge",
  "4": "Healthy",
  "5": "Powdery Mildew",
  "6": "Red Rust",
  "7": "Sooty Mould"
}
```
> The key order must match what `train_gen.class_indices` produced in your Colab notebook.

## Until you place the model files:
The server runs in **DEMO MODE** — it returns sample predictions so the UI can be tested.
Once you place the files here and restart the backend, it will automatically switch to **CNN mode**.
