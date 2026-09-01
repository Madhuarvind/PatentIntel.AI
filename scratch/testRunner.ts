import { runClaimTranslatorValidationSuite } from '../src/services/claimTranslatorValidation.ts';

async function main() {
  console.log('Running WIPO Multi-Language Claim Translator Validation Suite...\n');
  const results = await runClaimTranslatorValidationSuite();
  console.log(`Summary: ${results.passCount} / ${results.totalTests} tests passed.\n`);

  results.testResults.forEach((t, idx) => {
    const icon = t.success ? '✓ PASS' : '✗ FAIL';
    console.log(`[${icon}] Test #${idx + 1}: ${t.name}`);
    console.log(`         ${t.details}\n`);
  });

  if (!results.allPassed) {
    process.exit(1);
  }
}

main();
