"""
PatentIntel.AI - Native Windows Fine-Tuning Script (No Triton / CUDA Dependency)
===================================================================================
This script allows fine-tuning LLMs directly on Windows using standard Hugging Face 
`transformers`, `peft`, and `trl` without requiring Linux Triton CUDA kernels.

Usage:
    python scripts/train_patentintel_model_windows.py --dataset ./datasets/patentintel_master_dataset_5000.json
"""

import os
import json
import argparse
import torch

def train_windows_patent_model(dataset_path: str, base_model: str, output_dir: str):
    print("=" * 75)
    print("Initializing PatentIntel Native Windows Model Trainer")
    print(f"   Base Model: {base_model}")
    print(f"   Dataset: {dataset_path}")
    print(f"   PyTorch Device: {'CUDA (GPU)' if torch.cuda.is_available() else 'CPU'}")
    print("=" * 75)

    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
        from datasets import load_dataset
        from trl import SFTTrainer
        from peft import LoraConfig, get_peft_model
    except ImportError:
        print("\n[ERROR] Required packages missing. Please install via:")
        print("   pip install torch transformers datasets trl peft")
        return

    if not os.path.exists(dataset_path):
        print(f"\n[ERROR] Dataset file not found at: {dataset_path}")
        print("   Run `python scripts/generate_large_patent_dataset.py --samples 5000` first.")
        return

    print("\n1. Loading Tokenizer & Base Model...")
    tokenizer = AutoTokenizer.from_pretrained(base_model, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Load model in 8-bit or standard float16/float32 depending on GPU availability
    device_map = "auto" if torch.cuda.is_available() else None
    torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        torch_dtype=torch_dtype,
        device_map=device_map,
        trust_remote_code=True
    )

    print("\n2. Configuring LoRA Fine-Tuning Adapter...")
    peft_config = LoraConfig(
        r=8,
        lora_alpha=16,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )

    model = get_peft_model(model, peft_config)

    print("\n3. Loading Dataset...")
    raw_dataset = load_dataset("json", data_files=dataset_path)["train"]

    def format_instruction(sample):
        return f"### Instruction:\n{sample['instruction']}\n\n### Input:\n{sample['input']}\n\n### Response:\n{sample['output']}"

    print("\n4. Initializing SFT Trainer...")
    training_args = TrainingArguments(
        output_dir=output_dir,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        warmup_steps=5,
        max_steps=50,
        learning_rate=2e-4,
        logging_steps=1,
        fp16=torch.cuda.is_available(),
        save_strategy="no"
    )

    trainer = SFTTrainer(
        model=model,
        train_dataset=raw_dataset,
        formatting_func=format_instruction,
        max_seq_length=1024,
        tokenizer=tokenizer,
        args=training_args
    )

    print("\n5. Executing Model Fine-Tuning...")
    trainer.train()

    print(f"\n[SUCCESS] Native Windows Fine-Tuning Complete!")
    print(f"   Model saved to: {os.path.abspath(output_dir)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Native Windows LLM Fine-Tuner")
    parser.add_argument("--dataset", default="./datasets/patentintel_master_dataset_5000.json", help="Path to JSON dataset")
    parser.add_argument("--base_model", default="Qwen/Qwen2.5-Coder-1.5B-Instruct", help="Hugging Face model ID")
    parser.add_argument("--output_dir", default="./patentintel_windows_model", help="Save directory")
    args = parser.parse_args()
    train_windows_patent_model(args.dataset, args.base_model, args.output_dir)
