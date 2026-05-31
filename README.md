# Product Knowledge as Code

## 30-Second Pitch

This repository demonstrates a simple but powerful shift:

- Product behavior in `knowledge/` is the source of truth.
- Tests in `tests/` are generated artifacts.
- AI agents (simulated here with scripts) analyze change impact and keep quality assets aligned.

Conference flow:

```text
PR -> Knowledge Update -> Test Generation -> Execution -> Feedback -> Knowledge Evolution
```

Quick demo:

```bash
cd template-project
npm install
npm run simulate:impact
npm run simulate:knowledge-update
npm run generate:md-tests
npm run demo:execute
```

Concept docs: `docs/pkac-conference-guide.md`

## Overview

This repository demonstrates an alternative approach to software quality management in the age of AI.

Instead of maintaining product knowledge in external test case management systems, the knowledge lives directly in the repository as version-controlled behavior specifications.

AI agents continuously maintain this knowledge, generate automated tests, execute them, and evolve the system over time.

The goal is to move from:

```text
Requirements
    ↓
Test Cases
    ↓
Execution
```

to:

```text
Product Knowledge
    ↓
AI Agents
    ↓
Generated Tests
    ↓
Execution
    ↓
Feedback
    ↓
Knowledge Update
```

---

# Core Principle

## Traditional Model

The test case is both:

* Product documentation
* Verification instruction

This creates several problems:

* Test cases become outdated
* Knowledge is duplicated
* Test repositories grow uncontrollably
* Manual maintenance becomes expensive

```text
Requirements
    ↓
TestRail
    ↓
Manual Test Cases
    ↓
Execution
```

---

## Proposed Model

The source of truth is product behavior.

Behavior definitions live inside the repository and evolve together with the codebase.

Knowledge can be authored in Markdown, YAML, and Gherkin. The three formats are validated for synchronization in CI so teams can work in the representation that best fits their workflow.

```text
Behavior Knowledge
    ↓
Generated Tests
    ↓
Execution
```

Tests become generated artifacts rather than manually maintained assets.

---

# Repository Structure

```text
repository/
│
├── src/
│
├── tests/
│   ├── playwright/
│   ├── api/
│
├── knowledge/
│   ├── registration.md
│   ├── registration.yaml
│   ├── registration.feature
│   ├── checkout.md
│   ├── checkout.yaml
│   ├── checkout.feature
│   ├── users.md
│
└── .github/
    └── workflows/
```

---

# Pull Request Flow

Every pull request triggers an AI-driven quality workflow.

```text
Developer Creates PR
          ↓
AI Agent Analyzes Changes
          ↓
AI Agent Identifies Impacted Features
          ↓
AI Agent Updates Product Knowledge
          ↓
AI Agent Generates New Tests
          ↓
Playwright Executes Tests
          ↓
Results Stored
```

---

# Example Knowledge File

registration.md

```md
# Registration

## Happy Path

User can register using:

- email
- password

Expected:

- account is created
- verification email is sent

## Validation Rules

Email:
- must be unique
- must be valid

Password:
- minimum length 8

```

This file describes behavior rather than implementation details.

---

# Test Generation

AI agents transform behavior definitions into executable Playwright tests.

```text
Knowledge Files
        ↓
AI Test Generator
        ↓
Playwright Tests
        ↓
Execution
```

Example:

```text
Rule:
Email must be unique

Generated Test:
Register with existing email
Verify error message
```

Before generation, synchronization checks verify that rule IDs and rule meanings are aligned across `.md`, `.yaml`, and `.feature` files.

---

# Production Feedback Loop

The system continuously learns from failures.

```text
Production Incident
          ↓
AI Root Cause Analysis
          ↓
Knowledge Update
          ↓
New Test Generation
          ↓
Regression Protection
```

This creates a self-improving quality system.

---

# Knowledge Lifecycle

```text
Requirements
      ↓
Knowledge Creation
      ↓
Implementation
      ↓
Generated Tests
      ↓
Execution
      ↓
Production Feedback
      ↓
Knowledge Evolution
```

---

# Vision

The long-term vision is to replace static test repositories with continuously evolving product knowledge.

Instead of maintaining thousands of individual test cases, teams maintain a structured understanding of system behavior.

AI agents become responsible for:

* knowledge maintenance
* impact analysis
* test generation
* test updates
* coverage gap detection

The repository becomes the single source of truth for both humans and AI systems.

---

# Key Idea

**Product Knowledge as Code**

Not:

```text
Requirements → Test Cases → Execution
```

But:

```text
Product Knowledge
        ↓
AI Agents
        ↓
Tests
        ↓
Execution
        ↓
Feedback
        ↓
Knowledge Evolution
```

---

# Starter Template

This repository includes a starter implementation in `template-project/` to bootstrap Product Knowledge as Code quickly.

## What is included

* Seed behavior knowledge files in `knowledge/` as `.md`, `.yaml`, and `.feature`
* Playwright UI tests in `tests/playwright/`
* API tests in `tests/api/`
* Rule parser, sync validator, coverage check, and test generation scripts in `scripts/`
* CI workflow in `.github/workflows/quality.yml`

## Quick start

1. Install dependencies:

```bash
cd template-project
npm install
```

2. Verify knowledge sync across formats:

```bash
npm run verify:sync
```

3. Generate tests from synchronized knowledge:

```bash
npm run generate:tests
```

4. Verify rule coverage and run tests:

```bash
npm run verify:coverage
npm run test:api
npm run test:ui
```

## Knowledge sync contract

Use feature-based folders. Each feature must exist in all three formats:

* `knowledge/<feature>/<feature>.md`
* `knowledge/<feature>/<feature>.yaml`
* `knowledge/<feature>/<feature>.feature`

Sync validation enforces:

* Matching rule IDs across all three formats
* Matching rule intent text across all three formats

## Skill Extensions

Additional repository skills are available under `.github/skills/`:

* `bda-knowledge-sync-governance`
* `bda-api-test-design-patterns`
* `bda-change-impact-analysis`
* `bda-incident-to-knowledge`
* `bda-quality-gates`
