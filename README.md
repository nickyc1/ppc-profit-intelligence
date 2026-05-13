# PPC Profit Intelligence

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)

A free agent prompt + Apps Script for connecting Google Ads spend to real profit data — not Google-reported ROAS.

The opinion: Google's reported ROAS is correlation, not causation. It claims credit for conversions that happen anyway through email, organic, and direct. The only number that should drive paid-ads budget decisions is profit-to-spend computed from your own data.

This repo is the simplest possible version of that pipeline. Two files:

- [`ppc-profit-intelligence.md`](ppc-profit-intelligence.md) — the agent prompt + setup guide
- [`ppc-intelligence-apps-script.js`](ppc-intelligence-apps-script.js) — a Google Apps Script that joins your Google Ads data to your order data in a Sheet
- [`index.html`](index.html) — the marketing landing page
- [`ppc-profit-intelligence-guide.pdf`](ppc-profit-intelligence-guide.pdf) — printable version of the guide

## What this is

A starter kit for the profit-first principle. If you want the full version, see [`attribution-modeling`](https://github.com/nickyc1/attribution-modeling).

## Use this when

- You're running Google Ads and you want to know if you're actually profitable
- You don't have BigQuery or a data warehouse and need something that runs in a Google Sheet
- You're spending under $20K/month and the full attribution pipeline is overkill

## Use [`attribution-modeling`](https://github.com/nickyc1/attribution-modeling) instead when

- You're spending $20K+/month
- You have a real warehouse (BigQuery, Snowflake, Postgres)
- You want incrementality testing, server-side conversions, multi-platform joins

## Related skills

| Skill | Relationship |
|---|---|
| [`paid-ads-context`](https://github.com/nickyc1/paid-ads-context) | Section 4 (Attribution & data) is the spec; this is one implementation |
| [`google-ads-manager`](https://github.com/nickyc1/google-ads-manager) | Consumes the profit data this guide produces |
| [`attribution-modeling`](https://github.com/nickyc1/attribution-modeling) | The full, opinionated version of what this guide bootstraps |
| [`weekly-ops-review`](https://github.com/nickyc1/weekly-ops-review) | Rolls up the profit data into a weekly health check |

## License

MIT — see [LICENSE](LICENSE).

Built by [Nick Christensen](https://github.com/nickyc1).
