const fs = require('fs');
const path = require('path');

const RULE_ID_PATTERN = /[A-Z]{3}-\d{3}/;

function normalizeRuleText(text) {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseMarkdownRules(content) {
  const rules = new Map();
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/-\s*([A-Z]{3}-\d{3})\s*:\s*(.+)$/);
    if (match) {
      rules.set(match[1], match[2].trim());
    }
  }

  return rules;
}

function parseYamlRules(content) {
  const rules = new Map();
  const lines = content.split(/\r?\n/);

  let currentId = null;
  for (const line of lines) {
    const idMatch = line.match(/^\s*-\s*id\s*:\s*([A-Z]{3}-\d{3})\s*$/);
    if (idMatch) {
      currentId = idMatch[1];
      continue;
    }

    const titleMatch = line.match(/^\s*title\s*:\s*(.+)\s*$/);
    if (titleMatch && currentId) {
      rules.set(currentId, titleMatch[1].trim().replace(/^['"]|['"]$/g, ''));
      currentId = null;
    }
  }

  return rules;
}

function parseGherkinRules(content) {
  const rules = new Map();
  const lines = content.split(/\r?\n/);

  let pendingIds = [];
  for (const line of lines) {
    const tagMatches = [...line.matchAll(/@([A-Z]{3}-\d{3})/g)].map((item) => item[1]);
    if (tagMatches.length) {
      pendingIds = tagMatches;
      continue;
    }

    const scenarioMatch = line.match(/^\s*Scenario:\s*(.+)$/);
    if (scenarioMatch && pendingIds.length) {
      for (const id of pendingIds) {
        rules.set(id, scenarioMatch[1].trim());
      }
      pendingIds = [];
    }
  }

  return rules;
}

function findFeatureFiles(knowledgeDir) {
  const files = fs.readdirSync(knowledgeDir);
  const features = new Map();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.md', '.yaml', '.yml', '.feature'].includes(ext)) {
      continue;
    }

    const name = path.basename(file, ext);
    const entry = features.get(name) || { md: null, yaml: null, gherkin: null };

    if (ext === '.md') {
      entry.md = file;
    }
    if (ext === '.yaml' || ext === '.yml') {
      entry.yaml = file;
    }
    if (ext === '.feature') {
      entry.gherkin = file;
    }

    features.set(name, entry);
  }

  return features;
}

function readRulesByFormat(knowledgeDir, featureName, fileName, format) {
  if (!fileName) {
    return new Map();
  }

  const content = fs.readFileSync(path.join(knowledgeDir, fileName), 'utf8');
  if (format === 'md') {
    return parseMarkdownRules(content);
  }
  if (format === 'yaml') {
    return parseYamlRules(content);
  }
  return parseGherkinRules(content);
}

function loadKnowledgeBundle(knowledgeDir) {
  const features = findFeatureFiles(knowledgeDir);
  const bundle = [];

  for (const [featureName, files] of features.entries()) {
    bundle.push({
      featureName,
      files,
      rulesByFormat: {
        md: readRulesByFormat(knowledgeDir, featureName, files.md, 'md'),
        yaml: readRulesByFormat(knowledgeDir, featureName, files.yaml, 'yaml'),
        gherkin: readRulesByFormat(knowledgeDir, featureName, files.gherkin, 'gherkin'),
      },
    });
  }

  return bundle.sort((a, b) => a.featureName.localeCompare(b.featureName));
}

function verifyKnowledgeSync(knowledgeDir) {
  const issues = [];
  const bundle = loadKnowledgeBundle(knowledgeDir);

  for (const feature of bundle) {
    const missingFormats = [];
    if (!feature.files.md) {
      missingFormats.push('md');
    }
    if (!feature.files.yaml) {
      missingFormats.push('yaml');
    }
    if (!feature.files.gherkin) {
      missingFormats.push('gherkin');
    }

    if (missingFormats.length) {
      issues.push(
        `${feature.featureName}: missing knowledge formats (${missingFormats.join(', ')})`
      );
      continue;
    }

    const idsByFormat = {
      md: new Set(feature.rulesByFormat.md.keys()),
      yaml: new Set(feature.rulesByFormat.yaml.keys()),
      gherkin: new Set(feature.rulesByFormat.gherkin.keys()),
    };

    const allIds = new Set([
      ...idsByFormat.md.values(),
      ...idsByFormat.yaml.values(),
      ...idsByFormat.gherkin.values(),
    ]);

    for (const id of allIds) {
      const inMd = idsByFormat.md.has(id);
      const inYaml = idsByFormat.yaml.has(id);
      const inGherkin = idsByFormat.gherkin.has(id);

      if (!(inMd && inYaml && inGherkin)) {
        issues.push(
          `${feature.featureName}: ${id} missing in ${[
            !inMd ? 'md' : null,
            !inYaml ? 'yaml' : null,
            !inGherkin ? 'gherkin' : null,
          ]
            .filter(Boolean)
            .join(', ')}`
        );
        continue;
      }

      const mdText = normalizeRuleText(feature.rulesByFormat.md.get(id));
      const yamlText = normalizeRuleText(feature.rulesByFormat.yaml.get(id));
      const gherkinText = normalizeRuleText(feature.rulesByFormat.gherkin.get(id));

      if (!(mdText === yamlText && yamlText === gherkinText)) {
        issues.push(`${feature.featureName}: ${id} rule text mismatch across formats`);
      }
    }
  }

  return { issues, bundle };
}

function getFeatureRules(feature) {
  const source = feature.rulesByFormat.md.size
    ? feature.rulesByFormat.md
    : feature.rulesByFormat.yaml.size
    ? feature.rulesByFormat.yaml
    : feature.rulesByFormat.gherkin;

  return [...source.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

module.exports = {
  RULE_ID_PATTERN,
  getFeatureRules,
  loadKnowledgeBundle,
  normalizeRuleText,
  verifyKnowledgeSync,
};
