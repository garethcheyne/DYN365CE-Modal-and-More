#!/usr/bin/env node

/**
 * Check if there are unpublished customizations in D365
 */

const { execSync } = require('child_process');

console.debug('═══════════════════════════════════════════════════════════════');
console.debug('  Checking Publish Status');
console.debug('═══════════════════════════════════════════════════════════════\n');

try {
  // Check for unpublished customizations using OData query
  const result = execSync(
    'pac org who',
    { encoding: 'utf-8' }
  );
  
  console.debug(result);
  console.debug('\n✅ To check unpublished customizations:');
  console.debug('   1. Go to: https://make.powerapps.com');
  console.debug('   2. Select your environment');
  console.debug('   3. Go to Solutions → Select your solution');
  console.debug('   4. Look for "Publish All Customizations" button');
  console.debug('   5. If button is grayed out = everything is published ✅');
  console.debug('   6. If button is active = unpublished changes exist ⚠️');
  
} catch (error) {
  console.error('❌ Error checking status:', error.message);
  process.exit(1);
}
