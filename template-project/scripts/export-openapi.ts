/**
 * Generates docs/openapi.json from the TypeScript OpenAPI document factory.
 * Run via: tsx scripts/export-openapi.ts
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { createOpenApiDocument } from '../src/docs/openapi.js';

const outputPath = join(process.cwd(), 'docs', 'openapi.json');
const doc = createOpenApiDocument();
writeFileSync(outputPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
console.log(`OpenAPI document written: docs/openapi.json`);
