"""
PatentIntel.AI - 1-Click Free Google Colab GPU Model Fine-Tuner
================================================================
Copy & Paste this script into Google Colab (Free T4 GPU) to fine-tune your model
on your Hugging Face dataset and push the trained model to `madhuaravind21/patentintel-llama3-1m`.

Google Colab Setup:
  1. Open https://colab.research.google.com
  2. Select Runtime -> Change runtime type -> Hardware accelerator: GPU (T4 GPU)
  3. Paste and run this code!
"""

import os

# 1. Install Unsloth & Hugging Face Libraries
print("1. Installing Fine-Tuning Dependencies...")
os.system("pip install --quiet unsloth torch transformers datasets trl peft bitsandbytes huggingface_hub")

# 2. Login to Hugging Face
from huggingface_hub import login
print("\n2. Hugging Face Authentication")
HF_TOKEN = input("Enter your Hugging Face Write Token (hf_...): ").strip()
login(token=HF_TOKEN)

# 3. Load Model & Dataset
import torch
from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

HF_USERNAME = "madhuaravind21"
DATASET_ID = f"{HF_USERNAME}/patentintel-million-dataset"
OUTPUT_MODEL_ID = f"{HF_USERNAME}/patentintel-llama3-1m"

print(f"\n3. Loading Base Llama 3.1 Model & Dataset ({DATASET_ID})...")
max_seq_length = 2048

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/llama-3.1-8b-instruct-bnb-4bit",
    max_seq_length=max_seq_length,
    load_in_4bit=True,
)

model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha=16,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
)

# 4. Load Dataset from Hugging Face
dataset = load_dataset("json", data_files="./datasets/patentintel_master_dataset_5000.json")["train"]

prompt_template = """### Instruction:
{}

### Input:
{}

### Response:
{}"""

def format_prompts(examples):
    texts = []
    for inst, inp, out in zip(examples["instruction"], examples["input"], examples["output"]):
        texts.append(prompt_template.format(inst, inp, out) + tokenizer.eos_token)
    return {"text": texts}

dataset = dataset.map(format_prompts, batched=True)

# 5. Fine-Tune Model
print("\n4. Training PatentIntel AI Model...")
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=max_seq_length,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=5,
        max_steps=60,
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=1,
        output_dir="./results",
    ),
)

trainer.train()

# 6. Push Model directly to Hugging Face Hub under madhuaravind21
print(f"\n5. Pushing Trained Model to Hugging Face Hub ({OUTPUT_MODEL_ID})...")
model.push_to_hub_merged(OUTPUT_MODEL_ID, tokenizer, save_method="merged_16bit", token=HF_TOKEN)
print(f"✅ Model Live on Hugging Face: https://huggingface.co/{OUTPUT_MODEL_ID}")
