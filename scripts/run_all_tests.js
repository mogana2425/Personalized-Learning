const { runFrontendBuild } = require('./run_frontend_build');
const { runBackendApiTests } = require('./run_backend_api_tests');
const { runApiLoadTests } = require('./run_api_load_tests');
const { runE2ETests } = require('./run_e2e_tests');
const { consolidateReports } = require('./consolidate_reports');

async function runAllTests() {
  console.log('================================================================');
  console.log('🚀 Starting PLIS Unified E2E & Security Test Verification Pipeline');
  console.log('================================================================\n');

  console.log('--- Step 1: Verify Deployment & Frontend Build ---');
  await runFrontendBuild();
  console.log('\n--- Step 2: Backend API & Security Tests ---');
  await runBackendApiTests();
  console.log('\n--- Step 3: API Load & Concurrency Tests ---');
  await runApiLoadTests();
  console.log('\n--- Step 4: Mobile & Web Appium E2E Automation ---');
  await runE2ETests();
  console.log('\n--- Step 5: Consolidate & Verify Reports ---');
  await consolidateReports();

  console.log('\n================================================================');
  console.log('🎉 PLIS Unified Verification Pipeline Completed Successfully!');
  console.log('================================================================');
}

if (require.main === module) {
  runAllTests().catch(err => {
    console.error('Pipeline error:', err);
    process.exit(1);
  });
}

module.exports = { runAllTests };
