---
name: "Sui Deep Research"
slug: sui-deep-research
version: 1.0.0
description: "Autonomous web scraping and analysis engine. Reads whitepapers, news, and protocol documentation to inform decisions."
author: SuiLoop Core
category: analysis
tags:
  - web-scraping
  - research
  - analysis
  - autonomous
permissions:
  - browser:control
  - network:fetch
  - notification:send
actions:
  scrape_url:
    name: "Scrape URL"
    description: "Extract text content from a specific URL for analysis."
    handler: browserActions.extractData
    parameters:
      url:
        type: string
        description: "Target URL to scrape"
        required: true
      selectors:
        type: object
        description: "CSS Selectors map for data extraction"
        required: true
  analyze_protocol:
    name: "Analyze Protocol"
    description: "Visit a protocol's landing page and docs to extract key metrics (TVL, APY, Risk)."
    handler: browserActions.scrapePools
    parameters:
      protocol:
        type: string
        description: "Name of the protocol (e.g., Cetus, Scallop)"
        required: true
---

# Sui Deep Research

The **Sui Deep Research** engine empowers your agent with the ability to browse the open web. Unlike standard blockchain agents limited to on-chain data, this unit can verify off-chain information, read governance proposals, and analyze competitor strategies.

## Capabilities

- **Autonomous Browsing**: Uses a headless browser to navigate complex dApps.
- **Content Extraction**: Parses HTML/JS rendered content to extract meaningful text.
- **Visual Verification**: Can take screenshots of UI states for debugging or confirmation.

## Usage

Assign this skill to an agent to enable the `browser:control` permission set. The agent will automatically use this capability when asked to "research" or "check" a website.
