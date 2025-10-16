#!/bin/bash

# IndexNow URL Submission Script
# Submits URLs to Bing, Yandex, and other search engines instantly

API_KEY="28b0e531b2b3450baf1f16a15b700829"
HOST="inv.so"
KEY_LOCATION="https://inv.so/28b0e531b2b3450baf1f16a15b700829.txt"

# Submit all key pages
curl -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "host": "'$HOST'",
    "key": "'$API_KEY'",
    "keyLocation": "'$KEY_LOCATION'",
    "urlList": [
      "https://inv.so/",
      "https://inv.so/pricing",
      "https://inv.so/docs/AI.md",
      "https://inv.so/docs/faq.md",
      "https://inv.so/docs/getting-started.md",
      "https://inv.so/docs/comparison.md"
    ]
  }'

echo ""
echo "✅ URLs submitted to IndexNow!"
echo "Check Bing Webmaster Tools to verify receipt."
