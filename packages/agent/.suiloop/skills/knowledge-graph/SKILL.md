---
name: "Knowledge Graph"
slug: knowledge-graph
version: 1.0.0
description: "Universal search engine and context builder. Understands why the market is moving."
author: SuiLoop Core
category: analysis
tags:
  - search
  - context
  - knowledge
  - tavily
permissions:
  - network:fetch
  - filesystem:read
actions:
  - name: search_knowledge
    description: "Perform a complex search query to answer questions."
    handler: knowledgeActions.search
  - name: explain_market_event
    description: "Lookup recent news to explain significant price movements."
    handler: knowledgeActions.explainEvent
---

# Knowledge Graph

Universal search engine and context builder. Understands why the market is moving.

## Installation

Installed from LoopHub Marketplace.

## Usage

This skill provides the following actions:

### search_knowledge

Perform a complex search query to answer questions.

### explain_market_event

Lookup recent news to explain significant price movements.

