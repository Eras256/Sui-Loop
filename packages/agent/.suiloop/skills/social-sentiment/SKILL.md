---
name: "Social Sentiment"
slug: social-sentiment
version: 1.0.0
description: "Listen to the pulse of the market. Monitors Twitter/X for bullish/bearish trends."
author: SuiLoop Core
category: analysis
tags:
  - sentiment
  - social
  - twitter
  - trends
permissions:
  - network:fetch
  - notification:send
actions:
  - name: analyze_sentiment
    description: "Scan recent tweets for a specific keyword and calculate sentiment."
    handler: twitterActions.analyzeSentiment
  - name: get_trending_topics
    description: "Get current trending topics in the Sui ecosystem."
    handler: twitterActions.getTrending
---

# Social Sentiment

Listen to the pulse of the market. Monitors Twitter/X for bullish/bearish trends.

## Installation

Installed from LoopHub Marketplace.

## Usage

This skill provides the following actions:

### analyze_sentiment

Scan recent tweets for a specific keyword and calculate sentiment.

### get_trending_topics

Get current trending topics in the Sui ecosystem.

