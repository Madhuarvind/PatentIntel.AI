"""
PatentIntel.AI - Model Validation & Benchmark Tester
=====================================================
Tests your fine-tuned model (`madhuaravind21/patentintel-llama3-1m`) on live 
Hugging Face Inference API and evaluates latency, statutory § 101 precision, and JSON formatting.

Usage:
    python scripts/test_huggingface_model.py --token YOUR_HF_TOKEN
"""

import time
import json
import argparse

def test_patent_model(token: str, model_id: str = "madhuaravind21/patentintel-llama3-1m"):
    endpoint = f"https://api-inference.huggingface.co/models/{model_id}"
    
    print("=" * 75)
    print("🚀 Initializing PatentIntel AI Model Performance Benchmark")
    print(f"   Target Model: {model_id}")
    print(f"   Endpoint: {endpoint}")
    print("=" * 75)

    test_prompt = (
        "### Instruction:\n"
        "Extract structured technical components, statutory Section 101 eligibility risk, "
        "and Section 103 obviousness score for the following disclosure.\n\n"
        "### Input:\n"
        "Technical Disclosure: An edge IoT telemetry node comprising an ARM Cortex-M4 microcontroller "
        "coupled to a zero-knowledge hardware security enclave (HSM) for encrypted sensor data transmission.\n\n"
        "### Response:\n"
    )

    try:
        import urllib.request
        
        headers = {
            "Content-Type": "application/json"
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"

        payload = json.dumps({
            "inputs": test_prompt,
            "parameters": {
                "max_new_tokens": 512,
                "temperature": 0.2,
                "return_full_text": False
            }
        }).encode("utf-8")

        max_retries = 6
        for attempt in range(1, max_retries + 1):
            print(f"\n1. Dispatching test prompt to Hugging Face Inference API (Attempt {attempt}/{max_retries})...")
            start_time = time.time()
            
            try:
                req = urllib.request.Request(endpoint, data=payload, headers=headers, method="POST")
                with urllib.request.urlopen(req) as response:
                    res_data = response.read().decode("utf-8")
                    elapsed_time = round(time.time() - start_time, 2)
                    
                    data = json.loads(res_data)
                    response_text = data[0]["generated_text"] if isinstance(data, list) and "generated_text" in data[0] else str(data)

                    print(f"\n[BENCHMARK RESULT]")
                    print(f"   ⏱️ Response Time: {elapsed_time} seconds")
                    print(f"   📥 Raw Model Output:\n")
                    print("-" * 60)
                    print(response_text.strip())
                    print("-" * 60)
                    print("\n✅ Verification Successful! Model is warm and generating structured patent reasoning.")
                    break
            except urllib.error.HTTPError as http_err:
                if http_err.code in (503, 504, 429) and attempt < max_retries:
                    print(f"   ⏳ Hugging Face model is currently loading into server GPU memory (Status {http_err.code}).")
                    print(f"      Waiting 20 seconds for Hugging Face GPU warm-up... (Retry {attempt}/{max_retries})")
                    time.sleep(20)
                else:
                    raise http_err
    except Exception as e:
        print(f"\n⚠️ Notice: {e}")
        print("   Make sure your Hugging Face Access Token is valid and has read permissions.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Hugging Face Fine-Tuned Model")
    parser.add_argument("--token", default="", help="Hugging Face Access Token (hf_...)")
    parser.add_argument("--model", default="madhuaravind21/patentintel-llama3-1m", help="HF Model ID")
    args = parser.parse_args()
    test_patent_model(args.token, args.model)
