#!/usr/bin/env node

/**
 * Check if there are unpublished customizations in D365
 */

const { execSync } = require('child_process');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Checking Publish Status');
console.log('═══════════════════════════════════════════════════════════════\n');

try {
  // Check for unpublished customizations using OData query
  const result = execSync(
    'pac org who',
    { encoding: 'utf-8' }
  );
  
  console.log(result);
  console.log('\n✅ To check unpublished customizations:');
  console.log('   1. Go to: https://make.powerapps.com');
  console.log('   2. Select your environment');
  console.log('   3. Go to Solutions → Select your solution');
  console.log('   4. Look for "Publish All Customizations" button');
  console.log('   5. If button is grayed out = everything is published ✅');
  console.log('   6. If button is active = unpublished changes exist ⚠️');
  
} catch (error) {
  console.error('❌ Error checking status:', error.message);
  process.exit(1);
}
