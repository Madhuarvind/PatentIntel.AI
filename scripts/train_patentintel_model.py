"""
PatentIntel.AI - Custom Patent LLM Fine-Tuning Script
======================================================
This script demonstrates how to fine-tune an open-weights foundation model 
(e.g., Llama-3.1-8B-Instruct or Qwen2.5-7B) on USPTO patent claims, Section 101/102/103 
examination guidelines, and multi-document obviousness datasets using QLoRA / Unsloth.

Requirements:
    pip install unsloth torch transformers datasets trl peft bitsandbytes

Usage:
    python scripts/train_patentintel_model.py --base_model unsloth/llama-3.1-8b-instruct-bnb-4bit
"""

import os
import argparse

def train_custom_patent_model(base_model_name: str, output_dir: str):
    print("=" * 70)
    print(f"🚀 Initializing PatentIntel Custom LLM Training Pipeline")
    print(f"   Base Model: {base_model_name}")
    print(f"   Output Directory: {output_dir}")
    print("=" * 70)

    try:
        from unsloth import FastLanguageModel
        from datasets import load_dataset
        from trl import SFTTrainer
        from transformers import TrainingArguments

        max_seq_length = 2048
        dtype = None # Auto detect GPU dtype
        load_in_4bit = True # 4bit quantization for single-GPU training

        print("\n1. Loading Base Foundation Model & Tokenizer...")
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=base_model_name,
            max_seq_length=max_seq_length,
            dtype=dtype,
            load_in_4bit=load_in_4bit,
        )

        print("\n2. Injecting LoRA Adapters for Patent Domain Fine-Tuning...")
        model = FastLanguageModel.get_peft_model(
            model,
            r=16,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            lora_alpha=16,
            lora_dropout=0,
            bias="none",
            use_gradient_checkpointing="unsloth",
            random_state=3407,
        )

        print("\n3. Preparing Fine-Tuning Prompt Template...")
        patent_prompt = """Below is an instruction that describes a patent claim or R&D disclosure task, paired with an input context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input Context:
{}

### Response:
{}"""

        # Example dataset formatting
        def format_prompts(examples):
            instructions = examples["instruction"]
            inputs       = examples["input"]
            outputs      = examples["output"]
            texts = []
            for instruction, input_text, output in zip(instructions, inputs, outputs):
                text = patent_prompt.format(instruction, input_text, output) + tokenizer.eos_token
                texts.append(text)
            return { "text" : texts }

        print("\n4. Initializing SFT Trainer...")
        trainer = SFTTrainer(
            model=model,
            tokenizer=tokenizer,
            train_dataset=load_dataset("json", data_files="patent_dataset.json")["train"].map(format_prompts, batched=True),
            dataset_text_field="text",
            max_seq_length=max_seq_length,
            dataset_num_proc=2,
            packing=False,
            args=TrainingArguments(
                per_device_train_batch_size=2,
                gradient_accumulation_steps=4,
                warmup_steps=5,
                max_steps=60,
                learning_rate=2e-4,
                fp16=not FastLanguageModel.is_bfloat16_supported(),
                bf16=FastLanguageModel.is_bfloat16_supported(),
                logging_steps=1,
                optim="adamw_8bit",
                weight_decay=0.01,
                lr_scheduler_type="linear",
                seed=3407,
                output_dir=output_dir,
            ),
        )

        print("\n5. Executing Model Training...")
        trainer.train()

        print(f"\n6. Exporting Fine-Tuned Model to {output_dir}/gguf (Ollama Compatible)...")
        model.save_pretrained_merged(output_dir, tokenizer, save_method="merged_16bit")
        print("✅ Fine-tuning completed successfully! You can now serve this model with Ollama or vLLM.")

    except ImportError:
        print("\n⚠️ Unsloth / HuggingFace dependencies not installed.")
        print("   To execute training on your GPU, run:")
        print("   pip install unsloth torch transformers datasets trl peft bitsandbytes")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune custom LLM for PatentIntel.AI")
    parser.add_argument("--base_model", default="unsloth/llama-3.1-8b-instruct-bnb-4bit", help="HuggingFace model ID")
    parser.add_argument("--output_dir", default="./patentintel_llama3_model", help="Directory to save fine-tuned model")
    args = parser.parse_args()
    train_custom_patent_model(args.base_model, args.output_dir)
