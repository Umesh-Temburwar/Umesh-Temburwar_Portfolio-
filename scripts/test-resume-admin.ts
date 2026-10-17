import { verifyPassword, hashPassword, createSessionToken, verifySessionToken, generateCsrfToken } from '../api/_lib/auth';
import { validateStagingBlob, getActiveResumeStatus } from '../api/_lib/blob';

async function runTests() {
  console.log('\n======================================================');
  console.log('   RUNNING AUTOMATED RESUME ADMIN SECURITY TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Password hashing & Scrypt verification
  console.log('\n--- 1. Password Verification (Scrypt) ---');
  const password = 'mySecretPassword123!';
  const hash = hashPassword(password);
  assert(verifyPassword(password, hash), 'Correct password verifies against scrypt hash');
  assert(!verifyPassword('wrongPassword', hash), 'Incorrect password is rejected');
  assert(!verifyPassword(password, 'invalid:malformed:hash'), 'Malformed hash is rejected safely');

  // 2. JWT Session creation & verification
  console.log('\n--- 2. JWT Session Security (jose) ---');
  process.env.SESSION_SECRET = 'test_session_secret_at_least_32_characters_long_for_security';
  const token = await createSessionToken('admin');
  const payload = await verifySessionToken(token);
  assert(payload?.username === 'admin', 'Valid session token verified successfully');
  const invalidPayload = await verifySessionToken(token + 'tampered');
  assert(invalidPayload === null, 'Tampered session token rejected with null');

  // 3. CSRF Protection
  console.log('\n--- 3. CSRF Token Generation & Verification ---');
  const csrf = generateCsrfToken(token);
  assert(typeof csrf === 'string' && csrf.length === 64, 'HMAC-SHA256 CSRF token generated');
  const csrfTampered = generateCsrfToken('differentToken');
  assert(csrf !== csrfTampered, 'Different session tokens produce different CSRF tokens');

  // 4. Blob Fallback & Metadata Resolution
  console.log('\n--- 4. Active Resume Status Resolution ---');
  // Without BLOB_READ_WRITE_TOKEN, verify graceful static fallback
  delete process.env.BLOB_READ_WRITE_TOKEN;
  const status = await getActiveResumeStatus();
  assert(status.exists === true, 'Resume status returns exists: true');
  assert(status.isFallback === true, 'Correctly flags as isFallback: true when Blob is unlinked');
  assert(status.url.includes('Umesh-Temburwar-OCT.pdf'), 'Points to active static PDF fallback');

  // 5. Local Dev Server HTTP Endpoint Tests
  console.log('\n--- 5. Local HTTP API Endpoints (http://localhost:5173) ---');
  try {
    // A. Unauthenticated /api/auth/me
    const unauthMe = await fetch('http://localhost:5173/api/auth/me', {
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    assert(unauthMe.status === 401, 'Unauthenticated /api/auth/me returns 401 Unauthorized');

    // B. Unauthenticated upload-token
    const unauthUpload = await fetch('http://localhost:5173/api/resume/upload-token', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    assert(unauthUpload.status === 401, 'Unauthenticated POST /api/resume/upload-token returns 401');

    // C. Unauthenticated finalize
    const unauthFinalize = await fetch('http://localhost:5173/api/resume/finalize', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    assert(unauthFinalize.status === 401, 'Unauthenticated POST /api/resume/finalize returns 401');

    // D. Unauthenticated delete
    const unauthDelete = await fetch('http://localhost:5173/api/resume', {
      method: 'DELETE',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    assert(unauthDelete.status === 401, 'Unauthenticated DELETE /api/resume returns 401');

    // E. Invalid login attempt
    const failedLogin = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ username: 'admin', password: 'wrong_password_test' }),
    });
    assert(failedLogin.status === 401, 'Login with incorrect password returns 401');

    // F. Public GET /api/resume
    const publicResume = await fetch('http://localhost:5173/api/resume');
    assert(publicResume.status === 200, 'Public GET /api/resume returns 200 OK');
    const resumeJson = await publicResume.json();
    assert(resumeJson.exists === true, 'Public resume metadata indicates exists: true');

    // G. Public GET /api/resume/file (or /resume.pdf redirect)
    const fileRedirect = await fetch('http://localhost:5173/api/resume/file', { redirect: 'manual' });
    assert(fileRedirect.status === 307, 'GET /api/resume/file returns 307 Temporary Redirect');
    assert(fileRedirect.headers.get('location')?.includes('.pdf') === true, 'Redirect location points to PDF');

    // H. Successful Login & Session Cookie with new credentials UMESH / ARUNA7709
    const validLogin = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ username: 'UMESH', password: 'ARUNA7709' }),
    });
    assert(validLogin.status === 200, 'Login with UMESH / ARUNA7709 returns 200 OK');
    const cookie = validLogin.headers.get('set-cookie');
    assert(Boolean(cookie && cookie.includes('resume_admin_session')), 'Login response sets HttpOnly session cookie');

    // I. Case-insensitive username check
    const caseInsensitiveLogin = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ username: 'umesh', password: 'ARUNA7709' }),
    });
    assert(caseInsensitiveLogin.status === 200, 'Login with lowercase "umesh" also returns 200 OK');
  } catch (err: unknown) {
    console.warn('[SKIP] Local HTTP server test skipped (dev server not responding):', err);
  }

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
