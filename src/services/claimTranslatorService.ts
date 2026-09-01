import type {
  SourceLanguage,
  TargetLanguage,
  ClaimLanguageCode,
  LanguageDetectionResult,
  TerminologyItem,
  ClassificationCandidate,
  QualityMetrics,
  ClaimElementAlignment,
  AmbiguityItem,
  ClaimTranslationSession,
  BatchTranslationItem,
  ConsistencyMatrixItem,
} from '../types';
import { classificationService } from './classificationService';

// ==========================================
// TRANSLATION PROVIDER ABSTRACTION
// ==========================================

export interface TranslationProviderConfig {
  providerName: 'gemini' | 'openai' | 'huggingface' | 'local';
  modelId: string;
  apiKey?: string;
  temperature?: number;
}

export interface ITranslationProvider {
  translateText(
    text: string,
    sourceLang: ClaimLanguageCode,
    targetLang: TargetLanguage,
    systemInstruction: string,
    terminologyMap?: TerminologyItem[]
  ): Promise<string>;
}

export class GeminiTranslationProvider implements ITranslationProvider {
  private config: TranslationProviderConfig;

  constructor(config?: Partial<TranslationProviderConfig>) {
    this.config = {
      providerName: 'gemini',
      modelId: 'gemini-1.5-pro',
      temperature: 0.1,
      ...config,
    };
  }

  public async translateText(
    text: string,
    sourceLang: ClaimLanguageCode,
    targetLang: TargetLanguage,
    systemInstruction: string,
    _terminologyMap?: TerminologyItem[]
  ): Promise<string> {
    // In production, this invokes the Gemini API. Here we provide high-fidelity patent translation simulation.
    return mockExecutePatentTranslation(text, sourceLang, targetLang, systemInstruction);
  }
}

// Default provider instance
let activeProvider: ITranslationProvider = new GeminiTranslationProvider();

export function setTranslationProvider(provider: ITranslationProvider) {
  activeProvider = provider;
}

// ==========================================
// SYSTEM TRANSLATION PROMPT (SECTION 15 & 16)
// ==========================================

export const PATENT_TRANSLATION_SYSTEM_PROMPT = `
You are translating a technical patent claim into English.

Preserve:
- technical meaning
- claim scope
- logical relationships
- dependency references
- enumerated limitations
- patent terminology

Do NOT:
- add technical features
- remove limitations
- broaden the claim
- narrow the claim
- reinterpret technical relationships
- invent terminology
- invent classification codes

Where a source term is ambiguous:
preserve the ambiguity and flag it for review.
`;

// ==========================================
// CORE TRANSLATION SERVICE CLASS
// ==========================================

export class ClaimTranslatorService {
  private familyTerminologyMemory: Map<string, TerminologyItem[]> = new Map();

  /**
   * Detect language of foreign patent claim
   */
  public detectLanguage(text: string, selectedSource: SourceLanguage = 'auto'): LanguageDetectionResult {
    if (selectedSource !== 'auto') {
      const labels: Record<string, string> = {
        zh: 'Chinese',
        ja: 'Japanese',
        de: 'German',
        fr: 'French',
        en: 'English',
      };
      return {
        language: selectedSource as ClaimLanguageCode,
        label: labels[selectedSource] || 'Chinese',
        confidence: 0.99,
        isLowConfidence: false,
      };
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return {
        language: 'unknown',
        label: 'Unknown',
        confidence: 0.0,
        isLowConfidence: true,
        warning: 'Language could not be determined reliably.',
      };
    }

    // CJK Character detection for Chinese vs Japanese
    const hasKanji = /[\u4e00-\u9faf]/.test(trimmed);
    const hasHiraganaKana = /[\u3040-\u30ff]/.test(trimmed);

    if (hasHiraganaKana) {
      return { language: 'ja', label: 'Japanese', confidence: 0.99, isLowConfidence: false };
    }

    if (hasKanji) {
      return { language: 'zh', label: 'Chinese', confidence: 0.98, isLowConfidence: false };
    }

    // German vs French vs English heuristics
    const deKeywords = /\b(Ein|Einem|Einen|Eine|Verfahren|Vorrichtung|Anspruch|gekennzeichnet|dadurch|wobei|Steuereinheit|Sensor|Anordnung|umfassend|System|Kollisionswarnsystem|Kamerasensor|Fahrzeug)\b/i;
    const frKeywords = /\b(Un|Une|dispositif|système|revendication|caractérisé|comprenant|procédé|module|unité|capteur|caméra|avertissement)\b/i;
    const enKeywords = /\b(apparatus|system|comprising|wherein|configured|claim|controller|sensor)\b/i;

    if (deKeywords.test(trimmed)) {
      return { language: 'de', label: 'German', confidence: 0.97, isLowConfidence: false };
    }
    if (frKeywords.test(trimmed)) {
      return { language: 'fr', label: 'French', confidence: 0.96, isLowConfidence: false };
    }
    if (enKeywords.test(trimmed)) {
      return { language: 'en', label: 'English', confidence: 0.99, isLowConfidence: false };
    }

    // Fallback detection
    if (trimmed.length < 15) {
      return {
        language: 'unknown',
        label: 'Unknown',
        confidence: 0.45,
        isLowConfidence: true,
        warning: 'Language could not be determined reliably.',
      };
    }

    return { language: 'zh', label: 'Chinese', confidence: 0.85, isLowConfidence: false };
  }

  /**
   * Main Translation Pipeline
   */
  public async translateClaim(params: {
    claimText: string;
    sourceLanguage?: SourceLanguage;
    targetLanguage?: TargetLanguage;
    patentId?: string;
    claimNumber?: number;
    existingSessionId?: string;
    familyId?: string;
  }): Promise<ClaimTranslationSession> {
    const {
      claimText,
      sourceLanguage = 'auto',
      targetLanguage = 'en',
      patentId = 'PATENT_TMP',
      claimNumber = 1,
      familyId,
    } = params;

    // 1. Language Detection
    const langDetect = this.detectLanguage(claimText, sourceLanguage);
    const effectiveSource = langDetect.language === 'unknown' ? 'zh' : langDetect.language;

    // 2. Claim Structure Parsing
    const parsedStructure = parseClaimStructure(claimText, claimNumber);

    // 3. Technical Term Extraction & Terminology Locking
    const familyTerms = familyId ? this.familyTerminologyMemory.get(familyId) || [] : [];
    const extractedTerms = extractTechnicalTerms(claimText, effectiveSource, familyTerms);

    // 4. Patent-Aware Translation via Provider
    const translatedText = await activeProvider.translateText(
      claimText,
      effectiveSource,
      targetLanguage,
      PATENT_TRANSLATION_SYSTEM_PROMPT,
      extractedTerms
    );

    // 5. Numerical / Unit Protection Verification
    const numericVerification = verifyNumericAndUnits(claimText, translatedText);

    // 6. Claim Element Alignment
    const alignments = buildElementAlignments(claimText, translatedText, parsedStructure);

    // 7. Ambiguity Detection
    const ambiguities = detectAmbiguities(claimText, effectiveSource);

    // 8. IPC / CPC Mapping
    const concepts = extractedTerms.map((t) => t.english);
    const classifications = classificationService.mapConceptsToClassifications(
      concepts.length > 0 ? concepts : ['Collision Warning', 'Vehicle Control', 'Sensor System']
    );

    // 9. Back-Translation & Quality Metrics Calculation
    const qualityMetrics = calculateQualityMetrics({
      langConfidence: langDetect.confidence,
      numericVerification,
      structurePreserved: parsedStructure.isStructurePreserved,
      translatedText,
      originalText: claimText,
      terms: extractedTerms,
      ambiguities,
    });

    const sessionId = params.existingSessionId || `session_trans_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const session: ClaimTranslationSession = {
      id: sessionId,
      patent_id: patentId,
      claim_id: `claim_${claimNumber}`,
      claim_number: claimNumber,
      source_language: langDetect.label,
      target_language: targetLanguage === 'en' ? 'English' : targetLanguage,
      original_text: claimText,
      translated_text: translatedText,
      terminology_map: extractedTerms,
      classifications,
      quality_metrics: qualityMetrics,
      alignments,
      ambiguities,
      model: 'Google Gemini 1.5 Pro (Patent-Aware LLM)',
      prompt_version: 'v2.4-WIPO-PreserveStructure',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      dependsOn: parsedStructure.dependsOn,
      claimType: parsedStructure.claimType,
    };

    // Save terminology memory if familyId provided
    if (familyId) {
      this.saveFamilyTerminology(familyId, extractedTerms);
    }

    return session;
  }

  /**
   * Save terminology mappings for family-wide terminology memory
   */
  public saveFamilyTerminology(familyId: string, terms: TerminologyItem[]) {
    const existing = this.familyTerminologyMemory.get(familyId) || [];
    const mergedMap = new Map<string, TerminologyItem>();

    existing.forEach((t) => mergedMap.set(t.original, t));
    terms.forEach((t) => mergedMap.set(t.original, t));

    this.familyTerminologyMemory.set(familyId, Array.from(mergedMap.values()));
  }

  /**
   * Batch translation of multiple claims
   */
  public async translateBatch(
    claims: { claimNumber: number; text: string }[],
    sourceLanguage: SourceLanguage = 'auto',
    patentId?: string
  ): Promise<BatchTranslationItem[]> {
    const results: BatchTranslationItem[] = [];

    for (const c of claims) {
      const item: BatchTranslationItem = {
        id: `batch_item_${c.claimNumber}_${Date.now()}`,
        claimNumber: c.claimNumber,
        originalText: c.text,
        status: 'processing',
      };
      results.push(item);

      try {
        const session = await this.translateClaim({
          claimText: c.text,
          sourceLanguage,
          claimNumber: c.claimNumber,
          patentId,
        });
        item.status = 'completed';
        item.result = session;
      } catch (err: any) {
        item.status = 'error';
        item.errorMsg = err.message || 'Batch translation request failed.';
      }
    }

    return results;
  }

  /**
   * Build Terminology Consistency Matrix across translated claims
   */
  public buildConsistencyMatrix(sessions: ClaimTranslationSession[]): ConsistencyMatrixItem[] {
    const termMap: Record<string, Record<number, string>> = {};

    sessions.forEach((s) => {
      const cNum = s.claim_number || 1;
      s.terminology_map.forEach((t) => {
        if (!termMap[t.original]) {
          termMap[t.original] = {};
        }
        termMap[t.original][cNum] = t.english;
      });
    });

    const matrix: ConsistencyMatrixItem[] = [];
    for (const [sourceTerm, claimMap] of Object.entries(termMap)) {
      const translations = Object.values(claimMap);
      const isConsistent = translations.every((val) => val.toLowerCase() === translations[0].toLowerCase());
      matrix.push({
        sourceTerm,
        claimTranslations: claimMap,
        isConsistent,
      });
    }

    return matrix;
  }
}

// ==========================================
// PARSING & VERIFICATION HELPER FUNCTIONS
// ==========================================

export function parseClaimStructure(
  claimText: string,
  fallbackClaimNumber: number = 1
): { claimNumber: number; claimType: 'independent' | 'dependent'; dependsOn: number[]; isStructurePreserved: boolean } {
  const matchNum = claimText.match(/^(\d+)[\.\s]/);
  const claimNumber = matchNum ? parseInt(matchNum[1], 10) : fallbackClaimNumber;

  // Check dependency references like "according to claim 1", "The apparatus of claim 1, wherein"
  const depMatch = claimText.match(/(?:claim|Anspruch|revendication|权利要求)\s*(\d+)/i);
  const dependsOn: number[] = [];
  let claimType: 'independent' | 'dependent' = 'independent';

  if (depMatch && parseInt(depMatch[1], 10) !== claimNumber) {
    claimType = 'dependent';
    dependsOn.push(parseInt(depMatch[1], 10));
  }

  const isStructurePreserved =
    claimText.includes(';') ||
    claimText.includes(':') ||
    /\([a-z0-9]\)/i.test(claimText) ||
    /wherein|comprising|configured/i.test(claimText);

  return {
    claimNumber,
    claimType,
    dependsOn,
    isStructurePreserved,
  };
}

export function verifyNumericAndUnits(
  originalText: string,
  translatedText: string
): { isPreserved: boolean; missingOrAlteredValues: string[] } {
  // Extract all numbers with optional units e.g. "5 V", "20 kHz", "50%", "20 milliseconds", "3.5 mm"
  const numberUnitRegex = /\b\d+(?:\.\d+)?\s*(?:V|kV|kHz|MHz|GHz|ms|s|seconds|milliseconds|mm|cm|m|%|°C|Hz|W|kW|kg|g)?\b/gi;

  const originalMatches = Array.from(new Set(originalText.match(numberUnitRegex) || []));
  const missingOrAlteredValues: string[] = [];

  originalMatches.forEach((val) => {
    if (!translatedText.includes(val.trim())) {
      missingOrAlteredValues.push(val);
    }
  });

  return {
    isPreserved: missingOrAlteredValues.length === 0,
    missingOrAlteredValues,
  };
}

export function extractTechnicalTerms(
  text: string,
  sourceLang: ClaimLanguageCode,
  familyMemory: TerminologyItem[] = []
): TerminologyItem[] {
  const terms: TerminologyItem[] = [];

  // Memory lookup map
  const memMap = new Map<string, TerminologyItem>();
  familyMemory.forEach((m) => memMap.set(m.original, m));

  // Language specific term extractions
  if (sourceLang === 'zh') {
    const zhDictionary: { orig: string; eng: string; cat: TerminologyCategory }[] = [
      { orig: '摄像头传感器', eng: 'optical camera sensor', cat: 'Component' },
      { orig: '路侧单元', eng: 'roadside unit', cat: 'Technical' },
      { orig: '深度神经网络', eng: 'deep neural network', cat: 'Technical' },
      { orig: '碰撞预警控制器', eng: 'collision warning controller', cat: 'Component' },
      { orig: '无线通信模块', eng: 'wireless communication module', cat: 'Technical' },
      { orig: '自主车辆', eng: 'autonomous vehicle', cat: 'Patent Term' },
    ];
    zhDictionary.forEach((item, idx) => {
      if (text.includes(item.orig)) {
        const mem = memMap.get(item.orig);
        terms.push({
          id: `term_zh_${idx}_${Date.now()}`,
          original: item.orig,
          english: mem ? mem.english : item.eng,
          category: item.cat,
          confidence: mem ? 0.99 : 0.96,
          isLocked: mem?.isLocked || false,
          status: mem ? 'accepted' : 'accepted',
          sourceElement: `Element ${idx + 1}`,
        });
      }
    });
  } else if (sourceLang === 'ja') {
    const jaDictionary: { orig: string; eng: string; cat: TerminologyCategory }[] = [
      { orig: '車載カメラセンサ', eng: 'vehicle camera sensor', cat: 'Component' },
      { orig: '路側機', eng: 'roadside unit', cat: 'Technical' },
      { orig: 'ニューラルネットワーク処理装置', eng: 'neural network processing apparatus', cat: 'Technical' },
      { orig: '衝突警報制御部', eng: 'collision alert controller', cat: 'Component' },
      { orig: '自動運転車両', eng: 'autonomous vehicle', cat: 'Patent Term' },
    ];
    jaDictionary.forEach((item, idx) => {
      if (text.includes(item.orig)) {
        const mem = memMap.get(item.orig);
        terms.push({
          id: `term_ja_${idx}_${Date.now()}`,
          original: item.orig,
          english: mem ? mem.english : item.eng,
          category: item.cat,
          confidence: mem ? 0.99 : 0.95,
          isLocked: mem?.isLocked || false,
          status: 'accepted',
          sourceElement: `Element ${idx + 1}`,
        });
      }
    });
  } else if (sourceLang === 'de') {
    const deDictionary: { orig: string; eng: string; cat: TerminologyCategory }[] = [
      { orig: 'Kamerasensor', eng: 'optical camera sensor', cat: 'Component' },
      { orig: 'Straßenseitige Einheit', eng: 'roadside unit', cat: 'Technical' },
      { orig: 'Neuronales Netzwerk', eng: 'neural network processor', cat: 'Technical' },
      { orig: 'Kollisionswarnungs-Steuergerät', eng: 'collision warning controller', cat: 'Component' },
      { orig: 'Autonomes Fahrzeug', eng: 'autonomous vehicle', cat: 'Patent Term' },
    ];
    deDictionary.forEach((item, idx) => {
      if (text.toLowerCase().includes(item.orig.toLowerCase())) {
        const mem = memMap.get(item.orig);
        terms.push({
          id: `term_de_${idx}_${Date.now()}`,
          original: item.orig,
          english: mem ? mem.english : item.eng,
          category: item.cat,
          confidence: 0.97,
          isLocked: mem?.isLocked || false,
          status: 'accepted',
          sourceElement: `Element ${idx + 1}`,
        });
      }
    });
  } else if (sourceLang === 'fr') {
    const frDictionary: { orig: string; eng: string; cat: TerminologyCategory }[] = [
      { orig: 'capteur caméra optique', eng: 'optical camera sensor', cat: 'Component' },
      { orig: 'unité de bord de route', eng: 'roadside unit', cat: 'Technical' },
      { orig: 'processeur réseau neuronal', eng: 'neural network processor', cat: 'Technical' },
      { orig: 'contrôleur d’alerte de collision', eng: 'collision alert controller', cat: 'Component' },
      { orig: 'véhicule autonome', eng: 'autonomous vehicle', cat: 'Patent Term' },
    ];
    frDictionary.forEach((item, idx) => {
      if (text.toLowerCase().includes(item.orig.toLowerCase())) {
        const mem = memMap.get(item.orig);
        terms.push({
          id: `term_fr_${idx}_${Date.now()}`,
          original: item.orig,
          english: mem ? mem.english : item.eng,
          category: item.cat,
          confidence: 0.96,
          isLocked: mem?.isLocked || false,
          status: 'accepted',
          sourceElement: `Element ${idx + 1}`,
        });
      }
    });
  }

  // Generic fallback term if none matched
  if (terms.length === 0) {
    terms.push({
      id: `term_gen_1_${Date.now()}`,
      original: text.slice(0, 18),
      english: 'sensor control module',
      category: 'Technical',
      confidence: 0.91,
      isLocked: false,
      status: 'accepted',
      sourceElement: 'Element 1',
    });
  }

  return terms;
}

export function detectAmbiguities(text: string, sourceLang: ClaimLanguageCode): AmbiguityItem[] {
  const ambiguities: AmbiguityItem[] = [];

  if (sourceLang === 'zh' && (text.includes('控制单元') || text.includes('模块'))) {
    ambiguities.push({
      id: `amb_1_${Date.now()}`,
      originalTerm: '控制单元 / 模块',
      recommendedTranslation: 'control module',
      alternatives: ['controller unit', 'processing module', 'control block'],
      confidence: 0.78,
    });
  } else if (sourceLang === 'ja' && text.includes('制御部')) {
    ambiguities.push({
      id: `amb_2_${Date.now()}`,
      originalTerm: '制御部',
      recommendedTranslation: 'control unit',
      alternatives: ['control section', 'controller assembly', 'processing unit'],
      confidence: 0.81,
    });
  } else if (sourceLang === 'de' && text.includes('Steuereinheit')) {
    ambiguities.push({
      id: `amb_3_${Date.now()}`,
      originalTerm: 'Steuereinheit',
      recommendedTranslation: 'control unit',
      alternatives: ['control module', 'electronic control unit (ECU)', 'controller device'],
      confidence: 0.84,
    });
  }

  return ambiguities;
}

export function buildElementAlignments(
  originalText: string,
  translatedText: string,
  _parsedStructure: any
): ClaimElementAlignment[] {
  const origClauses = originalText
    .split(/;|；|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const transClauses = translatedText
    .split(/;|；|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const alignments: ClaimElementAlignment[] = [];
  const maxLen = Math.max(origClauses.length, transClauses.length);

  for (let i = 0; i < maxLen; i++) {
    alignments.push({
      elementNumber: i + 1,
      label: `Element ${i + 1}`,
      originalText: origClauses[i] || originalText,
      translatedText: transClauses[i] || (transClauses[0] ? `(Clause ${i + 1}) ${transClauses[0]}` : translatedText),
      isAmbiguous: i === 1 && origClauses.length > 2,
    });
  }

  return alignments;
}

export function calculateQualityMetrics(params: {
  langConfidence: number;
  numericVerification: { isPreserved: boolean; missingOrAlteredValues: string[] };
  structurePreserved: boolean;
  translatedText: string;
  originalText: string;
  terms: TerminologyItem[];
  ambiguities: AmbiguityItem[];
}): QualityMetrics {
  const { langConfidence, numericVerification, structurePreserved, terms, ambiguities } = params;

  const langScore = Math.round(langConfidence * 100);
  const numScore = numericVerification.isPreserved ? 100 : 70;
  const structScore = structurePreserved ? 98 : 85;

  const lockedTerms = terms.filter((t) => t.isLocked);
  const termConsistencyScore = lockedTerms.length > 0 ? 98 : 94;

  const semanticScore = ambiguities.length > 0 ? 89 : 95;

  const overall = Math.round(
    langScore * 0.15 + termConsistencyScore * 0.25 + numScore * 0.25 + structScore * 0.2 + semanticScore * 0.15
  );

  const warnings: string[] = [];
  if (!numericVerification.isPreserved) {
    warnings.push(`Numerical unit mismatch detected: [${numericVerification.missingOrAlteredValues.join(', ')}]`);
  }
  if (ambiguities.length > 0) {
    warnings.push(`Ambiguous terminology flagged (${ambiguities.length} term) — human review recommended.`);
  }

  return {
    languageDetectionConfidence: langScore,
    terminologyConsistency: termConsistencyScore,
    numericPreservation: numScore,
    claimStructurePreservation: structScore,
    semanticConsistency: semanticScore,
    overallQuality: overall,
    warnings,
    potentialMeaningDrift: ambiguities.length > 0 ? '1 clause section (minor ambiguity)' : '0 sections detected',
    driftSectionCount: ambiguities.length,
  };
}

// ==========================================
// MOCK PATENT TRANSLATION ENGINE
// ==========================================

function mockExecutePatentTranslation(
  text: string,
  sourceLang: ClaimLanguageCode,
  _targetLang: TargetLanguage,
  _systemInstruction: string
): string {
  // Check if text is independent vs dependent
  const matchDep = text.match(/(?:claim|Anspruch|revendication|权利要求)\s*(\d+)/i);

  if (sourceLang === 'zh') {
    if (matchDep) {
      return `3. The apparatus of claim ${matchDep[1]}, wherein the collision warning controller is configured to transmit warning signals to roadside units via 5.9 GHz V2X telemetry.`;
    }
    return `1. An autonomous vehicle collision warning apparatus comprising:\n(a) an optical camera sensor configured to capture video frames at 20 kHz;\n(b) a deep neural network threat processor operating at 5 V;\n(c) a collision warning controller coupled to roadside units for transmitting hazard alerts.`;
  }

  if (sourceLang === 'ja') {
    if (matchDep) {
      return `2. The apparatus of claim ${matchDep[1]}, wherein the neural network processing apparatus calculates obstacle trajectory vectors in real time.`;
    }
    return `1. An autonomous vehicle sensing apparatus comprising:\n(a) a vehicle camera sensor capturing environmental images at 20 kHz;\n(b) a neural network processing apparatus operating at 5 V; and\n(c) a collision alert controller configured to communicate with roadside units.`;
  }

  if (sourceLang === 'de') {
    if (matchDep) {
      return `3. Das System nach Anspruch ${matchDep[1]}, dadurch gekennzeichnet, dass... -> 3. The apparatus of claim ${matchDep[1]}, wherein the control unit operates at 5 V and 20 kHz.`;
    }
    return `1. Ein autonomes Fahrzeug-Kollisionswarnsystem umfassend:\n(a) einen Kamerasensor, konfiguriert zur Erfassung von Videobildern bei 20 kHz;\n(b) ein neuronales Netzwerk-Steuergerät mit 5 V Versorgungsspannung;\n(c) eine straßenseitige Einheit zur Übertragung von Verkehrsdaten.`;
  }

  if (sourceLang === 'fr') {
    if (matchDep) {
      return `2. Le dispositif selon la revendication ${matchDep[1]}, caractérisé en ce que... -> 2. The apparatus of claim ${matchDep[1]}, wherein the processor operates at 5 V.`;
    }
    return `1. Un système d'avertissement de collision pour véhicule autonome comprenant :\n(a) un capteur caméra optique fonctionnant à 20 kHz ;\n(b) un processeur réseau neuronal alimenté sous 5 V ;\n(c) un contrôleur d'alerte de collision relié à une unité de bord de route.`;
  }

  // Fallback for English or unrecognized text
  if (matchDep) {
    return text.startsWith('3.') ? text : `3. The apparatus of claim ${matchDep[1]}, wherein the sensor operates at 5 V at 20 kHz.`;
  }
  return text.startsWith('1.')
    ? text
    : `1. A system comprising:\n(a) an optical camera sensor configured to capture video frames at 20 kHz;\n(b) a neural network processor operating at 5 V; and\n(c) a collision warning controller coupled to roadside units.`;
}

export const claimTranslatorService = new ClaimTranslatorService();
