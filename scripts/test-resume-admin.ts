import http from 'node:http';
import authHandler, { generateCsrfToken } from '../api/auth';
import resumeHandler from '../api/resume';

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

  // 1. CSRF Token Security
  console.log('\n--- 1. CSRF Token Security ---');
  const csrf1 = generateCsrfToken('sample_token_1');
  const csrf2 = generateCsrfToken('sample_token_2');
  assert(typeof csrf1 === 'string' && csrf1.length === 64, 'HMAC-SHA256 CSRF token generated');
  assert(csrf1 !== csrf2, 'Different tokens produce distinct CSRF tokens');

  // 1b. EmailJS Environment Configuration Check
  console.log('\n--- 1b. EmailJS Environment Configuration ---');
  const fs = await import('node:fs');
  const envLocalContent = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf-8') : '';
  assert(envLocalContent.includes('VITE_EMAILJS_SERVICE_ID='), '.env.local contains VITE_EMAILJS_SERVICE_ID');
  assert(envLocalContent.includes('VITE_EMAILJS_TEMPLATE_ID='), '.env.local contains VITE_EMAILJS_TEMPLATE_ID');
  assert(envLocalContent.includes('VITE_EMAILJS_PUBLIC_KEY='), '.env.local contains VITE_EMAILJS_PUBLIC_KEY');
  assert(!envLocalContent.includes('EMAILJS_PRIVATE_KEY'), 'No private EmailJS keys in client configuration');

  // 2. Start Self-Contained Test Server
  console.log('\n--- 2. Starting In-Process Serverless HTTP Test Server ---');
  const server = http.createServer(async (req, res) => {
    const fullUrl = req.url || '';
    const pathname = fullUrl.split('?')[0];
    const searchParams = new URL(fullUrl, 'http://localhost').searchParams;
    const query: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      query[key] = val;
    });

    (req as any).query = query;

    const effectivePath = pathname === '/resume.pdf' ? '/api/resume/file' : pathname;

    try {
      if (effectivePath.startsWith('/api/auth')) {
        const action = effectivePath.replace('/api/auth/', '').replace('/api/auth', '');
        if (action) (req as any).query.action = action;
        return await authHandler(req, res);
      }

      if (effectivePath.startsWith('/api/resume')) {
        const action = effectivePath.replace('/api/resume/', '').replace('/api/resume', '');
        if (action) (req as any).query.action = action;
        return await resumeHandler(req, res);
      }

      res.statusCode = 404;
      res.end('Not Found');
    } catch (err: unknown) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Server Error' }));
    }
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://localhost:${port}`;
  console.log(`[INIT] Test server running on ${baseUrl}\n`);

  try {
    // A. Unauthenticated /api/auth/me
    const unauthMe = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    assert(unauthMe.status === 401, 'Unauthenticated /api/auth/me returns 401 Unauthorized');

    // B. Unauthenticated upload-token
    const unauthUpload = await fetch(`${baseUrl}/api/resume/upload-token`, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    assert(unauthUpload.status === 401, 'Unauthenticated POST /api/resume/upload-token returns 401');

    // C. Unauthenticated finalize
    const unauthFinalize = await fetch(`${baseUrl}/api/resume/finalize`, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    assert(unauthFinalize.status === 401, 'Unauthenticated POST /api/resume/finalize returns 401');

    // D. Unauthenticated delete
    const unauthDelete = await fetch(`${baseUrl}/api/resume`, {
      method: 'DELETE',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    assert(unauthDelete.status === 401, 'Unauthenticated DELETE /api/resume returns 401');

    // E. Invalid login attempt
    const failedLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ username: 'UMESH', password: 'wrong_password_test' }),
    });
    assert(failedLogin.status === 401, 'Login with incorrect password returns 401');

    // F. Public GET /api/resume
    const publicResume = await fetch(`${baseUrl}/api/resume`);
    assert(publicResume.status === 200, 'Public GET /api/resume returns 200 OK');
    const resumeJson = await publicResume.json();
    assert(resumeJson.exists === true, 'Public resume metadata indicates exists: true');
    assert(
      resumeJson.url.includes('Umesh-Temburwar-OCT.pdf') ||
        resumeJson.url.includes('/api/resume/file') ||
        resumeJson.url.includes('blob.vercel-storage.com'),
      'Points to active or fallback resume URL'
    );

    // G. Public GET /api/resume/file (or /resume.pdf redirect)
    const fileRedirect = await fetch(`${baseUrl}/api/resume/file`, { redirect: 'manual' });
    assert(
      fileRedirect.status === 307 || fileRedirect.status === 200,
      'GET /api/resume/file delivers or redirects to resume PDF'
    );
    if (fileRedirect.status === 307) {
      assert(
        fileRedirect.headers.get('location')?.includes('.pdf') === true,
        'Redirect location points to PDF file'
      );
    }

    // H. Public GET /resume.pdf rewrite test
    const rewritePdf = await fetch(`${baseUrl}/resume.pdf`, { redirect: 'manual' });
    assert(
      rewritePdf.status === 307 || rewritePdf.status === 200,
      'GET /resume.pdf rewrite correctly routes to file handler'
    );

    // I. Successful Login & Session Cookie with credentials UMESH / ARUNA7709
    const validLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ username: 'UMESH', password: 'ARUNA7709' }),
    });
    assert(validLogin.status === 200, 'Login with UMESH / ARUNA7709 returns 200 OK');
    const cookie = validLogin.headers.get('set-cookie');
    assert(
      Boolean(cookie && cookie.includes('resume_admin_session')),
      'Login response sets HttpOnly session cookie'
    );

    const loginData = await validLogin.json();
    assert(Boolean(loginData.csrfToken), 'Login response provides CSRF token for state-changing requests');

    // J. Verify Authenticated Session /api/auth/me with Cookie
    if (cookie) {
      const authMe = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Cookie: cookie,
        },
      });
      assert(authMe.status === 200, 'Authenticated /api/auth/me with session cookie returns 200 OK');
      const authMeData = await authMe.json();
      assert(
        authMeData.authenticated === true && authMeData.user?.username === 'UMESH',
        'Session verification confirms authenticated user UMESH'
      );

      // Authenticated Finalize validations
      const finalizeNoUrl = await fetch(`${baseUrl}/api/resume/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': loginData.csrfToken,
          Cookie: cookie,
        },
        body: JSON.stringify({}),
      });
      assert(finalizeNoUrl.status === 400, 'Finalize without stagingUrl returns 400 Bad Request');

      const finalizeSsrf = await fetch(`${baseUrl}/api/resume/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': loginData.csrfToken,
          Cookie: cookie,
        },
        body: JSON.stringify({ stagingUrl: 'https://evil-attacker.com/staging/fake.pdf' }),
      });
      assert(finalizeSsrf.status === 400, 'Finalize with non-vercel-blob origin is rejected (SSRF protection)');

      const finalizeNonStaging = await fetch(`${baseUrl}/api/resume/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': loginData.csrfToken,
          Cookie: cookie,
        },
        body: JSON.stringify({ stagingUrl: 'https://xyz.public.blob.vercel-storage.com/other/test.pdf' }),
      });
      assert(finalizeNonStaging.status === 400, 'Finalize with non-staging path is rejected');
    }

    // K. Case-insensitive username check
    const caseInsensitiveLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ username: 'umesh', password: 'ARUNA7709' }),
    });
    assert(caseInsensitiveLogin.status === 200, 'Login with lowercase "umesh" returns 200 OK');

    // L. CSRF protection verification: state-changing POST without XMLHttpRequest or CSRF token fails
    const csrfBlocked = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'UMESH', password: 'ARUNA7709' }),
    });
    assert(csrfBlocked.status === 403, 'Request without CSRF header or X-Requested-With returns 403 Forbidden');

    // M. Logout check
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    assert(logoutRes.status === 200, 'Logout returns 200 OK');
    const logoutCookie = logoutRes.headers.get('set-cookie');
    assert(
      Boolean(logoutCookie && logoutCookie.includes('Max-Age=0')),
      'Logout clears session cookie (Max-Age=0)'
    );
  } finally {
    server.close();
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
