---
name: "Flash Loan Executor"
slug: flash-loan-executor
version: 2.1.0
description: "Execute atomic flash loans using the Hot Potato pattern. Supports DeepBook, Cetus, and custom pools."
author: SuiLoop Team
category: trading
tags:
  - flash-loan
  - defi
  - atomic
  - leverage
permissions:
  - blockchain:read
  - blockchain:write
actions:
  - name: executeFlashLoan
    description: "Execute an atomic flash loan"
    handler: flashLoan
---

# Flash Loan Executor

Execute atomic flash loans using the Hot Potato pattern. Supports DeepBook, Cetus, and custom pools.

## Installation

Installed from LoopHub Marketplace.

## Usage

This skill provides the following actions:

### executeFlashLoan

Execute an atomic flash loan

