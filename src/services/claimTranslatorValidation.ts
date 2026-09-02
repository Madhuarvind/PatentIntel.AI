import {
  claimTranslatorService,
  verifyNumericAndUnits,
  parseClaimStructure,
  detectAmbiguities,
} from './claimTranslatorService';

export async function runClaimTranslatorValidationSuite(): Promise<{
  allPassed: boolean;
  totalTests: number;
  passCount: number;
  testResults: { name: string; success: boolean; details: string }[];
}> {
  const testResults: { name: string; success: boolean; details: string }[] = [];

  // TEST 1: Chinese Claim Translation & Language Detection
  try {
    const cnClaim =
      '1. 一种自主车辆碰撞预警装置，其特征在于，包括：(a) 摄像头传感器，配置为在 20 kHz 下捕获视频帧；(b) 深度神经网络处理器，在 5 V 下运行。';
    const lang = claimTranslatorService.detectLanguage(cnClaim, 'auto');
    const session = await claimTranslatorService.translateClaim({
      claimText: cnClaim,
      sourceLanguage: 'auto',
      claimNumber: 1,
    });

    const isSuccess =
      lang.language === 'zh' &&
      session.translated_text.toLowerCase().includes('camera sensor') &&
      session.translated_text.includes('20 kHz') &&
      session.translated_text.includes('5 V');

    testResults.push({
      name: 'Chinese (CN) Claim Translation & Detection',
      success: isSuccess,
      details: `Detected: ${lang.label} (${lang.confidence * 100}%), Translation output verified.`,
    });
  } catch (err: any) {
    testResults.push({
      name: 'Chinese (CN) Claim Translation & Detection',
      success: false,
      details: `Error: ${err.message}`,
    });
  }

  // TEST 2: Japanese Claim Translation & Language Detection
  try {
    const jaClaim =
      '1. 自主運転車両のセンサ装置であって、20 kHz で画像を撮像する車載カメラセンサと、5 V で動作するニューラルネットワーク処理装置と、を備える装置。';
    const lang = claimTranslatorService.detectLanguage(jaClaim, 'auto');
    const session = await claimTranslatorService.translateClaim({
      claimText: jaClaim,
      sourceLanguage: 'auto',
      claimNumber: 1,
    });

    const isSuccess =
      lang.language === 'ja' &&
      session.translated_text.toLowerCase().includes('camera sensor') &&
      session.translated_text.includes('20 kHz') &&
      session.translated_text.includes('5 V');

    testResults.push({
      name: 'Japanese (JP) Claim Translation & Detection',
      success: isSuccess,
      details: `Detected: ${lang.label} (${lang.confidence * 100}%), Structure & terms verified.`,
    });
  } catch (err: any) {
    testResults.push({
      name: 'Japanese (JP) Claim Translation & Detection',
      success: false,
      details: `Error: ${err.message}`,
    });
  }

  // TEST 3: German Claim Translation & Language Detection
  try {
    const deClaim =
      '1. Ein autonomes Fahrzeug-Kollisionswarnsystem umfassend: (a) einen Kamerasensor bei 20 kHz; (b) ein neuronales Netzwerk-Steuergerät mit 5 V Versorgungsspannung.';
    const lang = claimTranslatorService.detectLanguage(deClaim, 'auto');
    const session = await claimTranslatorService.translateClaim({
      claimText: deClaim,
      sourceLanguage: 'auto',
      claimNumber: 1,
    });

    const isSuccess =
      lang.language === 'de' &&
      (session.translated_text.toLowerCase().includes('camera') || session.translated_text.toLowerCase().includes('kamera')) &&
      session.translated_text.includes('20 kHz') &&
      session.translated_text.includes('5 V');

    testResults.push({
      name: 'German (DE) Claim Translation & Detection',
      success: isSuccess,
      details: `Detected: ${lang.label} (${lang.confidence * 100}%), German terms parsed.`,
    });
  } catch (err: any) {
    testResults.push({
      name: 'German (DE) Claim Translation & Detection',
      success: false,
      details: `Error: ${err.message}`,
    });
  }

  // TEST 4: French Claim Translation & Language Detection
  try {
    const frClaim =
      "1. Un système d'avertissement de collision comprenant un capteur caméra optique fonctionnant à 20 kHz et un processeur réseau neuronal alimenté sous 5 V.";
    const lang = claimTranslatorService.detectLanguage(frClaim, 'auto');
    const session = await claimTranslatorService.translateClaim({
      claimText: frClaim,
      sourceLanguage: 'auto',
      claimNumber: 1,
    });

    const isSuccess =
      lang.language === 'fr' &&
      (session.translated_text.toLowerCase().includes('camera') || session.translated_text.toLowerCase().includes('caméra') || session.translated_text.toLowerCase().includes('optique')) &&
      session.translated_text.includes('20 kHz') &&
      session.translated_text.includes('5 V');

    testResults.push({
      name: 'French (FR) Claim Translation & Detection',
      success: isSuccess,
      details: `Detected: ${lang.label} (${lang.confidence * 100}%), French terms parsed.`,
    });
  } catch (err: any) {
    testResults.push({
      name: 'French (FR) Claim Translation & Detection',
      success: false,
      details: `Error: ${err.message}`,
    });
  }

  // TEST 5: Numerical / Unit Protection Test (5 V at 20 kHz)
  try {
    const orig = '5 V at 20 kHz';
    const validTrans = 'operating at 5 V at 20 kHz';
    const corruptedTrans = 'operating at 50 V at 20 MHz';

    const validCheck = verifyNumericAndUnits(orig, validTrans);
    const corruptedCheck = verifyNumericAndUnits(orig, corruptedTrans);

    const isSuccess = validCheck.isPreserved === true && corruptedCheck.isPreserved === false;

    testResults.push({
      name: 'Numerical & Unit Protection Verification',
      success: isSuccess,
      details: isSuccess
        ? 'Successfully passed exact match and flagged unit mismatch (50 V vs 5 V, 20 MHz vs 20 kHz).'
        : 'Unit check failure.',
    });
  } catch (err: any) {
    testResults.push({
      name: 'Numerical & Unit Protection Verification',
      success: false,
      details: `Error: ${err.message}`,
    });
  }

  // TEST 6: Claim Dependency Preservation Test
  try {
    const depClaimText = '3. The apparatus of claim 1, wherein the sensor operates at 5 V.';
    const parsed = parseClaimStructure(depClaimText, 3);

    const isSuccess = parsed.claimNumber === 3 && parsed.claimType === 'dependent' && parsed.dependsOn.includes(1);

    testResults.push({
      name: 'Claim Dependency Preservation Test',
      success: isSuccess,
      details: isSuccess ? 'Preserved dependent status and dependsOn: [1].' : 'Failed dependency parse.',
    });
  } catch (err: any) {
    testResults.push({
      name: 'Claim Dependency Preservation Test',
      success: false,
      details: `Error: ${err.message}`,
    });
  }

  // TEST 7: Ambiguity Detection & Flagging Test
  try {
    const ambText = '一种自主车辆控制单元与模块';
    const ambiguities = detectAmbiguities(ambText, 'zh');

    const isSuccess = ambiguities.length > 0 && ambiguities[0].alternatives.length > 0;

    testResults.push({
      name: 'Ambiguity Detection & Flagging Test',
      success: isSuccess,
      details: isSuccess
        ? `Flagged ${ambiguities.length} ambiguous term with ${ambiguities[0].alternatives.length} alternatives.`
        : 'Failed ambiguity check.',
    });
  } catch (err: any) {
    testResults.push({
      name: 'Ambiguity Detection & Flagging Test',
      success: false,
      details: `Error: ${err.message}`,
    });
  }

  const passCount = testResults.filter((r) => r.success).length;
  const totalTests = testResults.length;
  const allPassed = passCount === totalTests;

  return {
    allPassed,
    totalTests,
    passCount,
    testResults,
  };
}
