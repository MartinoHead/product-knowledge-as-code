const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {
    eventPath: process.env.GITHUB_EVENT_PATH || '',
    output: path.join(__dirname, 'pr-impact-input.json'),
  };

  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--event') {
      args.eventPath = argv[i + 1] || args.eventPath;
      i += 1;
      continue;
    }

    if (argv[i] === '--output') {
      args.output = argv[i + 1] || args.output;
      i += 1;
    }
  }

  return args;
}

function loadGithubEvent(eventPath) {
  if (!eventPath || !fs.existsSync(eventPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(eventPath, 'utf8'));
}

function normalizeBody(body) {
  return String(body || '').trim();
}

function buildPayloadFromEvent(event) {
  const pr = event?.pull_request;
  const title = normalizeBody(pr?.title);
  const body = normalizeBody(pr?.body);
  const description = [title, body].filter(Boolean).join('\n\n');

  return {
    filesChanged: ['M src/unknown-changes-from-pr-event.txt'],
    description: description || 'No PR title/body available in event payload.',
  };
}

function main() {
  const args = parseArgs(process.argv);
  const event = loadGithubEvent(args.eventPath);

  const payload = event
    ? buildPayloadFromEvent(event)
    : {
        filesChanged: ['M src/local-run.txt'],
        description: 'Local run without GitHub event payload.',
      };

  const outputPath = path.resolve(process.cwd(), args.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Prepared PR impact input: ${path.relative(process.cwd(), outputPath)}`);
}

main();
