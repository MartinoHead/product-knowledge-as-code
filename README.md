# Behaviour-driven-architecture

# Product Knowledge as Code

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
│
├── knowledge/
│   ├── registration.md
│   ├── checkout.md
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
