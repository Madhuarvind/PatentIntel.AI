import test from 'node:test';
import assert from 'node:assert/strict';
import { extractProposalMetadata } from '../src/services/documentProposalExtractor.ts';

test('extractProposalMetadata correctly parses structured proposal document', () => {
  const sampleDocument = `
Project Title: Multi-Agent Edge IoT Telemetry & Quantum Security Mesh
Domain: Cybersecurity & Cryptography

Problem Statement:
Current edge IoT networks suffer from catastrophic single-point bottlenecks and post-quantum cryptographic decryption vulnerabilities across untrusted wireless relay nodes.

Proposed Solution Architecture:
We provide an autonomous edge cluster incorporating lattice-based key rotation (F1), decentralized MQTT brokers (F2), and a real-time anomaly detection neural network (F3).

Expected Technical Effect:
Reduces message propagation latency by 42% while guaranteeing post-quantum forward secrecy across 10,000 concurrent sensor channels.
  `.trim();

  const metadata = extractProposalMetadata(sampleDocument, 'quantum-mesh-proposal.pdf');

  assert.equal(metadata.title, 'Multi-Agent Edge IoT Telemetry & Quantum Security Mesh');
  assert.equal(metadata.domain, 'Cybersecurity & Cryptography');
  assert.match(metadata.technicalProblem, /post-quantum cryptographic decryption vulnerabilities/i);
  assert.match(metadata.proposedSolution, /lattice-based key rotation/i);
  assert.match(metadata.expectedTechnicalEffect, /Reduces message propagation latency by 42%/i);
  assert.ok(metadata.wordCount > 30);
  assert.ok(metadata.detectedKeywords.length > 0);
  assert.ok(metadata.detectedKeywords.includes('cryptography') || metadata.detectedKeywords.includes('quantum-resistant') || metadata.detectedKeywords.includes('mqtt broker'));
});

test('extractProposalMetadata handles unstructured research paper text and infers title and domain', () => {
  const paperText = `
Autonomous Optical Flow Drone Navigation in GPS-Denied Mine Shafts

Unmanned aerial vehicles (UAVs) operating underground fail to maintain stable positioning when GPS signals are obstructed, leading to severe hull collisions.
Our system introduces downward-facing multi-spectral optical flow sensors coupled with an inertial odometry Kalman filter and real-time obstacle avoidance throttling.
Achieves zero-drift hovering for over 45 minutes with collision probability reduced by 92%.
  `.trim();

  const metadata = extractProposalMetadata(paperText, 'drone_study.pdf');

  assert.equal(metadata.title, 'Autonomous Optical Flow Drone Navigation in GPS-Denied Mine Shafts');
  assert.equal(metadata.domain, 'Robotics & UAV Avionics');
  assert.ok(metadata.technicalProblem.length > 10);
  assert.ok(metadata.proposedSolution.length > 10);
  assert.ok(metadata.expectedTechnicalEffect.length > 10);
  assert.ok(metadata.detectedKeywords.includes('uav') || metadata.detectedKeywords.includes('drone') || metadata.detectedKeywords.includes('optical flow'));
});

test('extractProposalMetadata falls back gracefully on minimal input', () => {
  const empty = extractProposalMetadata('', 'Edge-Sensor-Network.pdf');
  assert.equal(empty.title, 'Edge Sensor Network');
  assert.equal(empty.wordCount, 0);
});

test('extractProposalMetadata identifies Smart Agriculture domain from agricultural keywords', () => {
  const agriText = `
Evaluation of ethylene gas sensors and spectral reflectance for produce shelf-life monitoring in cold supply chain logistics.
Limitation of conventional post-harvest inspection is manual sampling delay.
We deploy an array of optical spectral sensors with an edge micro-controller to predict storage rot.
Reduces produce spoilage rate by 34%.
  `.trim();

  const metadata = extractProposalMetadata(agriText, 'agriculture_paper.txt');
  assert.equal(metadata.domain, 'Smart Agriculture & IoT Systems');
  assert.ok(metadata.detectedKeywords.includes('shelf-life') || metadata.detectedKeywords.includes('produce') || metadata.detectedKeywords.includes('ethylene'));
});
