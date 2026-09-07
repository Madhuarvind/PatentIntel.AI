"""
PatentIntel.AI - Hugging Face Million-Dataset Uploader
======================================================
Uploads your generated 1,000,000 datapoint master dataset (917 MB) directly to 
Hugging Face Hub under your account: `madhuaravind21`.

Usage:
    python scripts/upload_to_huggingface.py --repo_name patentintel-million-dataset --token YOUR_HF_TOKEN
"""

import os
import argparse

def upload_patent_dataset(repo_name: str, token: str, username: str = "madhuaravind21"):
    dataset_file = os.path.join(os.path.dirname(__file__), "..", "datasets", "patentintel_large_dataset_1000000.json")

    if not os.path.exists(dataset_file):
        dataset_file = os.path.join(os.path.dirname(__file__), "..", "datasets", "patentintel_master_dataset_50000.json")

    if not os.path.exists(dataset_file):
        print(f"[ERROR] No dataset file found in datasets/ directory.")
        print("   Run `python scripts/fetch_real_million_patent_dataset.py --samples 1000000` first.")
        return

    full_repo_id = f"{username}/{repo_name}"
    file_size_mb = os.path.getsize(dataset_file) / (1024 * 1024)

    print("=" * 75)
    print(f"Uploading PatentIntel Dataset to Hugging Face Hub")
    print(f"   Target Repo ID: {full_repo_id}")
    print(f"   Dataset File: {os.path.abspath(dataset_file)} ({file_size_mb:.2f} MB)")
    print("=" * 75)

    try:
        from huggingface_hub import HfApi, create_repo
        
        api = HfApi(token=token if token else None)
        print(f"\n1. Ensuring Hugging Face Hub Dataset Repository exists ({full_repo_id})...")
        
        try:
            create_repo(repo_id=full_repo_id, repo_type="dataset", token=token if token else None, exist_ok=True)
            print("   Repo verified on Hugging Face Hub!")
        except Exception as e:
            print(f"   Repo existence check notice: {e}")

        print(f"\n2. Uploading {file_size_mb:.2f} MB dataset to Hugging Face Hub...")
        api.upload_file(
            path_or_fileobj=dataset_file,
            path_in_repo="patentintel_master_dataset.json",
            repo_id=full_repo_id,
            repo_type="dataset",
            token=token if token else None
        )

        print(f"\n[SUCCESS] Dataset successfully published on Hugging Face Hub!")
        print(f"   View live on Hugging Face: https://huggingface.co/datasets/{full_repo_id}")
        print(f"   You can now use this dataset for 1-click AutoTrain fine-tuning on Hugging Face!")

    except ImportError:
        print("\n[ERROR] `huggingface_hub` package not installed.")
        print("   Run: pip install huggingface_hub")
    except Exception as e:
        print(f"\n[ERROR] Upload failed: {e}")
        print("   Make sure you provide your Hugging Face Access Token (--token hf_...)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload dataset to Hugging Face Hub")
    parser.add_argument("--repo_name", default="patentintel-million-dataset", help="Name of HF dataset repo")
    parser.add_argument("--username", default="madhuaravind21", help="Hugging Face username")
    parser.add_argument("--token", default="", help="Hugging Face Access Token (hf_...)")
    args = parser.parse_args()
    upload_patent_dataset(args.repo_name, args.token, args.username)
