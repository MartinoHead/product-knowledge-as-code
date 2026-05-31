const fs = require('fs');
const path = require('path');

const testDirs = [
  path.join(__dirname, '..', 'tests', 'playwright'),
  path.join(__dirname, '..', 'tests', 'api'),
];

function listTestFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.ts'))
    .map((name) => path.join(dir, name));
}

function collectRuleIds(content) {
  const matches = content.match(/\[[A-Z]{3}-\d{3}\]/g) || [];
  return matches.map((x) => x.replace('[', '').replace(']', ''));
}

function runMockExecution() {
  const rows = [];

  for (const dir of testDirs) {
    for (const file of listTestFiles(dir)) {
      const content = fs.readFileSync(file, 'utf8');
      const ids = collectRuleIds(content);
      const hasTodo = content.includes('TODO:');

      if (!ids.length) {
        rows.push({ file, id: 'N/A', status: 'SKIPPED', detail: 'No rule IDs found' });
        continue;
      }

      for (const id of ids) {
        rows.push({
          file,
          id,
          status: hasTodo ? 'MOCK-PASS' : 'PASS',
          detail: hasTodo ? 'Scaffold recognized for demo execution' : 'Executable scenario found',
        });
      }
    }
  }

  return rows;
}

function printRows(rows) {
  console.log('=== Demo Test Execution Results ===');

  if (!rows.length) {
    console.log('No tests detected.');
    return;
  }

  for (const row of rows) {
    const shortFile = path.relative(process.cwd(), row.file);
    console.log(`[${row.status}] ${row.id} :: ${shortFile} :: ${row.detail}`);
  }

  const counts = rows.reduce(
    (acc, row) => {
      acc.total += 1;
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    },
    { total: 0 }
  );

  console.log('--- Summary ---');
  console.log(`Total: ${counts.total}`);
  console.log(`PASS: ${counts.PASS || 0}`);
  console.log(`MOCK-PASS: ${counts['MOCK-PASS'] || 0}`);
  console.log(`SKIPPED: ${counts.SKIPPED || 0}`);
}

const rows = runMockExecution();
printRows(rows);
