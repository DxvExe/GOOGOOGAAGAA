const http = require('http');

const tests = [
  { method: 'GET', path: '/', expectedStatus: 302, desc: 'Root Redirect' },
  { method: 'GET', path: '/home', expectedStatus: 200, desc: 'Home Page' },
  { method: 'GET', path: '/about', expectedStatus: 200, desc: 'About Page' },
  { method: 'GET', path: '/contact', expectedStatus: 200, desc: 'Contact Page' },
  { method: 'GET', path: '/random', expectedStatus: 404, desc: 'Invalid Route' },
  { method: 'GET', path: '/css/style.css', expectedStatus: 200, desc: 'CSS Stylesheet' },
  { method: 'GET', path: '/js/script.js', expectedStatus: 200, desc: 'Client Script' },
  { method: 'GET', path: '/images/hero-illustration.svg', expectedStatus: 200, desc: 'SVG Hero Graphic' },
  { method: 'GET', path: '/images/missing.png', expectedStatus: 404, desc: 'Missing Asset' },
  { method: 'POST', path: '/home', expectedStatus: 405, desc: 'Unsupported Method POST' }
];

function runTest(test) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: test.path,
      method: test.method
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const passed = res.statusCode === test.expectedStatus;
        const location = res.headers.location ? ` -> ${res.headers.location}` : '';
        const cType = res.headers['content-type'] || 'none';
        resolve({
          desc: test.desc,
          method: test.method,
          path: test.path,
          status: res.statusCode,
          expected: test.expectedStatus,
          passed,
          contentType: cType,
          location,
          bodySnippet: data.slice(0, 60).replace(/\r?\n/g, ' ')
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        desc: test.desc,
        method: test.method,
        path: test.path,
        status: 'ERROR',
        expected: test.expectedStatus,
        passed: false,
        error: err.message
      });
    });

    req.end();
  });
}

async function runAll() {
  console.log('Testing GOOGOOEXAMPLEGAAGAA routes:');

  let passedCount = 0;

  for (const t of tests) {
    const r = await runTest(t);
    const badge = r.passed ? 'PASS' : 'FAIL';
    if (r.passed) passedCount++;

    console.log(
      `[${badge}] ${r.method.padEnd(5)} ${r.path.padEnd(28)} Status: ${r.status}${r.location.padEnd(12)} (${r.contentType})`
    );
  }

  console.log(`\nResult: ${passedCount}/${tests.length} tests passed.`);
}

runAll();
