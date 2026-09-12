"""
PatentIntel.AI - Large-Scale Patent Instruction Dataset Generator
===================================================================
Generates a comprehensive dataset (`datasets/patentintel_master_dataset.json`) 
containing hundreds of instruction-input-output training samples formatted for 
fine-tuning Hugging Face models (Llama 3.1, Qwen 2.5, Mistral, DeepSeek-R1).

Domains Covered:
  - 35 U.S.C. § 101 Statutory Subject-Matter Eligibility (Section 3(k))
  - 35 U.S.C. § 102 Novelty & Prior Art Overlap
  - 35 U.S.C. § 103 TSM Multi-Document Obviousness Combination
  - ColPali Multimodal Schematic Figure & Topology Matching
  - Technical Element & Inter-Component Execution Graph Extraction
  - Audit-Ready Patent Claim Narrowing & Strategy Formulation

Usage:
  python scripts/generate_large_patent_dataset.py
"""

import os
import json
import random

DOMAINS = [
    "IoT Edge Computing & Wireless Telemetry",
    "Artificial Intelligence & Machine Learning Hardware",
    "Zero-Knowledge Cryptography & Cybersecurity",
    "Autonomous Robotics & UAV Navigation",
    "Clean Energy Battery Storage & Grid Telemetry",
    "Biomedical Wearable Diagnostics & Microfluidics",
    "Quantum Key Distribution & Encrypted Telemetry"
]

TECHNICAL_PROBLEMS = [
    "High latency and excessive packet loss in distributed wireless telemetry environments under noisy channel conditions.",
    "Susceptibility of cloud neural network models to adversarial prompt injection and edge feature degradation.",
    "Lack of verifiable zero-knowledge hardware authentication in untrusted micro-controller transceivers.",
    "Thermal runaway risks and non-linear battery degradation in electric vehicle grid storage arrays.",
    "High false-positive rate in real-time cardiac arrhythmia detection using single-lead photoplethysmography (PPG).",
    "Obviousness rejection risks under Section 103 when combining single-node RF transceivers with generic cloud analytics."
]

HARDWARE_COMPONENTS = [
    "ARM Cortex-M4 microcontroller transceiver",
    "FPGA neural inference accelerator card",
    "LiDAR optical beam steering sensor array",
    "Hardware Security Module (HSM) enclave",
    "Solid-state battery thermal management loop",
    "MEMS capacitive pressure transducer",
    "Edge node cryptographic key rotation engine"
]

STATUTORY_REASONS = [
    "PASS: Claims recite physical hardware transceivers and edge sensor microcontrollers, satisfying the 35 U.S.C. § 101 Alice Step 2B transformation test.",
    "WARNING (Abstract Idea): Claims recite pure data processing without specific hardware limitations. Must be amended to tie algorithm to physical sensor acquisition.",
    "PASS (Section 3(k) Compliance): Recites concrete hardware apparatus with dedicated cryptographic hardware enclave, exceeding generic computer implementation threshold."
]

def generate_dataset_sample(idx: int) -> dict:
    domain = DOMAINS[idx % len(DOMAINS)]
    prob = TECHNICAL_PROBLEMS[idx % len(TECHNICAL_PROBLEMS)]
    comp1 = HARDWARE_COMPONENTS[idx % len(HARDWARE_COMPONENTS)]
    comp2 = HARDWARE_COMPONENTS[(idx + 2) % len(HARDWARE_COMPONENTS)]
    stat_reason = STATUTORY_REASONS[idx % len(STATUTORY_REASONS)]
    is_pass = "PASS" in stat_reason

    task_type = idx % 5

    if task_type == 0:
        # Technical Extraction Task
        instruction = "Extract structured technical components, functions, and inter-component execution relationships from the R&D proposal disclosure."
        input_text = f"Domain: {domain}\nTechnical Disclosure: A system for addressing {prob.lower()} comprising a {comp1} coupled to a {comp2} configured to execute continuous feedback telemetry."
        output_text = json.dumps({
            "components": [
                {"term": comp1, "category": "COMPONENT", "importance": "CORE"},
                {"term": comp2, "category": "COMPONENT", "importance": "CORE"},
                {"term": "continuous feedback telemetry loop", "category": "PROCESS", "importance": "SUPPORTING"}
            ],
            "relationships": [
                {"fromTerm": comp1, "toTerm": comp2, "relationshipType": "feeds data to", "description": f"{comp1} transmits real-time telemetry to {comp2}."}
            ]
        }, indent=2)

    elif task_type == 1:
        # Section 101 Statutory Eligibility Screening
        instruction = "Perform 35 U.S.C. § 101 / Section 3(k) statutory subject-matter eligibility gatekeeper analysis."
        input_text = f"Claim Disclosure: A system comprising a {comp1} and a {comp2} for {prob.lower()}"
        output_text = json.dumps({
            "statutoryStatus": "PASS" if is_pass else "WARNING",
            "sectionRef": "35 U.S.C. § 101 / Section 3(k)",
            "reasoning": stat_reason,
            "recommendedAmendments": "Recast method claims into physical system apparatus claims with explicit hardware interface bindings." if not is_pass else "Maintain current apparatus structure."
        }, indent=2)

    elif task_type == 2:
        # Section 103 TSM Obviousness Analysis
        instruction = "Simulate Patent Office Section 103 obviousness combination attack vectors under the TSM (Teaching-Suggestion-Motivation) framework."
        input_text = f"Innovation Disclosure: Combining {comp1} with {comp2} to solve {prob.lower()}"
        score = random.randint(35, 75)
        output_text = json.dumps({
            "obviousnessScore": score,
            "riskLevel": "HIGH" if score > 65 else "MODERATE" if score > 45 else "LOW",
            "combinedAttackVectors": [
                {
                    "ref1": f"US Patent 10,{100000 + idx}B2 ({comp1})",
                    "ref2": f"OpenAlex Paper W{300000 + idx} ({comp2})",
                    "motivationReason": f"A person having ordinary skill in the art (PHOSITA) would be motivated to combine Ref 1 with Ref 2 to optimize {domain} efficiency."
                }
            ]
        }, indent=2)

    elif task_type == 3:
        # ColPali Multimodal Schematic Verification
        instruction = "Execute ColPali vision-RAG visual topology structural comparison between uploaded R&D schematic diagrams and global patent visual repositories."
        input_text = f"Schematic FIG. 3A block diagram showing interaction between {comp1} and {comp2}."
        similarity = round(random.uniform(0.65, 0.92), 2)
        output_text = json.dumps({
            "figureId": "FIG 3A",
            "matchedPriorArtPatentId": f"US11604{100 + idx}B2",
            "visualSimilarityScore": similarity,
            "topologyFinding": f"{similarity * 100}% visual structural similarity identified against cited prior-art patent diagram."
        }, indent=2)

    else:
        # Grounded Differentiator Recommendation
        instruction = "Generate 3 audit-ready non-obvious technical claim differentiators to overcome prior-art collisions."
        input_text = f"Domain: {domain}\nTarget Innovation: {comp1} coupled with {comp2}."
        output_text = json.dumps([
            {
                "title": f"Dynamic Expiry-Driven Coupling for {comp1}",
                "description": f"Tie the predicted degradation metric of {comp1} directly to the execution pipeline of {comp2}.",
                "priorArtGap": "Retrieved prior art fails to disclose dynamic closed-loop feedback between these specific hardware modules."
            },
            {
                "title": "Zero-Knowledge Hardware Enclave Isolation",
                "description": "Incorporate ZKP verification on the physical hardware enclave before dispatching telemetry streams.",
                "priorArtGap": "Existing patents disclose central server authentication, not edge node ZKP hardware verification."
            }
        ], indent=2)

    return {
        "instruction": instruction,
        "input": input_text,
        "output": output_text
    }

import argparse

def build_master_dataset(total_samples: int = 5000):
    print("=" * 70)
    print(f"Generating Master PatentIntel Patent Training Dataset ({total_samples:,} samples)...")
    print("=" * 70)

    dataset = [generate_dataset_sample(i) for i in range(total_samples)]

    output_dir = os.path.join(os.path.dirname(__file__), "..", "datasets")
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, f"patentintel_master_dataset_{total_samples}.json")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)

    file_size_mb = os.path.getsize(output_file) / (1024 * 1024)
    print(f"\n[SUCCESS] Dataset successfully generated and saved to: {os.path.abspath(output_file)}")
    print(f"   Total Training Records: {len(dataset):,}")
    print(f"   File Size: {file_size_mb:.2f} MB")
    print(f"   Ready for Hugging Face Hub Upload & AutoTrain Fine-Tuning!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate large-scale patent datasets")
    parser.add_argument("--samples", type=int, default=5000, help="Number of instruction training samples (e.g. 5000, 10000, 50000)")
    args = parser.parse_args()
    build_master_dataset(args.samples)
