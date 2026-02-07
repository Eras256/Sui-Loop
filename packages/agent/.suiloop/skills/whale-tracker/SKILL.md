---
name: "Whale Tracker"
slug: whale-tracker
version: 1.2.0
description: "Track large wallet movements on Sui. Get alerts when whales move funds, with sentiment analysis."
author: OnChainInsights
category: analysis
tags:
  - whale
  - tracking
  - analysis
  - alerts
permissions:
  - blockchain:read
  - notification:send
actions:
  - name: scanWhales
    description: "Manually scan for whale activity immediately"
    handler: scanWhalesNow
---

# Whale Tracker

Track large wallet movements on Sui. Get alerts when whales move funds, with sentiment analysis.

## Installation

Installed from LoopHub Marketplace.

## Usage

This skill provides the following actions:

### scanWhales

Manually scan for whale activity immediately

