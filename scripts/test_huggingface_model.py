"""
PatentIntel.AI - Official Hugging Face Model Validation & Benchmark Tester
==========================================================================
Tests your fine-tuned model (`madhuaravind21/patentintel-llama3-1m`) using 
Hugging Face's official `InferenceClient` library.

Usage:
    python scripts/test_huggingface_model.py --token YOUR_HF_TOKEN
"""

import time
import argparse
from huggingface_hub import InferenceClient

def test_patent_model(token: str, model_id: str = "madhuaravind21/patentintel-llama3-1m"):
    print("===========================================================================")
    print(f"[*] Initializing PatentIntel AI Model Performance Benchmark")
    print(f"    Target Model: {model_id}")
    print(f"    Hugging Face Client: Native InferenceClient")
    print("===========================================================================")

    test_prompt = (
        "### Instruction:\n"
        "Extract structured technical components, statutory Section 101 eligibility risk, "
        "and Section 103 obviousness score for the following disclosure.\n\n"
        "### Input:\n"
        "Technical Disclosure: An edge IoT telemetry node comprising an ARM Cortex-M4 microcontroller "
        "coupled to a zero-knowledge hardware security enclave (HSM) for encrypted sensor data transmission.\n\n"
        "### Response:\n"
    )

    client = InferenceClient(model=model_id, token=token if token else None)

    max_retries = 5
    for attempt in range(1, max_retries + 1):
        print(f"\n1. Querying model on Hugging Face Inference API (Attempt {attempt}/{max_retries})...")
        start_time = time.time()
        
        try:
            response = client.text_generation(
                prompt=test_prompt,
                max_new_tokens=256,
                temperature=0.2
            )
            elapsed_time = round(time.time() - start_time, 2)

            print(f"\n[BENCHMARK RESULT]")
            print(f"   [*] Response Time: {elapsed_time} seconds")
            print(f"   [*] Model Output:\n")
            print("-" * 60)
            print(response.strip())
            print("-" * 60)
            print("\n[SUCCESS] Verification Complete! Model is warm and generating structured patent reasoning.")
            break

        except Exception as e:
            err_msg = str(e)
            if "503" in err_msg or "loading" in err_msg.lower() or "429" in err_msg:
                print(f"   [WAIT] Model is loading into Hugging Face GPU memory...")
                print(f"          Waiting 20 seconds for GPU warm-up... (Retry {attempt}/{max_retries})")
                time.sleep(20)
            elif "getaddrinfo" in err_msg.lower() or "connection" in err_msg.lower():
                print(f"   [RETRY] Network connection notice: {err_msg}")
                print(f"           Retrying in 10 seconds... (Attempt {attempt}/{max_retries})")
                time.sleep(10)
            else:
                print(f"\n[NOTICE] {err_msg}")
                print("   If the model was fine-tuned as a LoRA adapter or base model, test live in PatentIntel.AI UI!")
                break

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Hugging Face Fine-Tuned Model")
    parser.add_argument("--token", default="", help="Hugging Face Access Token (hf_...)")
    parser.add_argument("--model", default="madhuaravind21/patentintel-llama3-1m", help="HF Model ID")
    args = parser.parse_args()
    test_patent_model(args.token, args.model)
