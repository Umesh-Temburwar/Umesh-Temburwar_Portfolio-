import crypto from 'node:crypto';

/**
 * Script to generate secure scrypt password hash and session secret.
 * Usage:
 *   npx tsx scripts/hash-password.ts "YourSecurePasswordHere"
 */

function generateCredentials(password?: string) {
  const pwd = password || process.argv[2] || 'ChangeMeImmediately123!';
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(pwd, salt, 64);
  const hash = `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
  const sessionSecret = crypto.randomBytes(32).toString('hex');

  console.log('\n======================================================');
  console.log('   RESUME ADMIN PANEL - CREDENTIAL CONFIGURATION');
  console.log('======================================================\n');
  console.log(`Password Provided: ${pwd}`);
  console.log('\nAdd these lines to your .env.local file and Vercel Environment Variables:');
  console.log('------------------------------------------------------');
  console.log(`ADMIN_USERNAME=admin`);
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`SESSION_SECRET=${sessionSecret}`);
  console.log('------------------------------------------------------\n');
}

generateCredentials();
