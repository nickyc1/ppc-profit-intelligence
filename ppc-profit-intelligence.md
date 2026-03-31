---
description: Build a PPC profit intelligence system that pulls real ad spend from APIs, joins it with real revenue, and calculates true profit per channel. Deploys as an n8n workflow with daily reports, anomaly detection, and pacing alerts to Slack.
---

# PPC Profit Intelligence — Agent Skill

> Give this to your coding agent (Claude Code, Cursor, Windsurf, etc.) and it will build you an automated workflow that answers: "Where did I actually make money yesterday?"

---

## PART 1: THE PROMPT

Build me an n8n workflow that answers one question every morning: "Where did I actually make money yesterday?"

Google Ads will tell me I got conversions. My bank account says otherwise. I need the real numbers.

Here's what I want:

### Trigger
Run every day at 7am.

### Step 1 — Pull Raw Spend
Hit the Google Ads API and pull yesterday's data:
- Campaign name, spend, clicks, impressions, CPC, CTR, conversions, conversion value
- Use GAQL:

```sql
SELECT campaign.name, campaign.id, metrics.cost_micros, metrics.clicks,
       metrics.impressions, metrics.average_cpc, metrics.ctr,
       metrics.conversions, metrics.conversions_value
FROM campaign
WHERE segments.date DURING YESTERDAY
```

- If I run Shopping ads, also pull product-level performance:

```sql
SELECT segments.product_title, segments.product_item_id,
       metrics.cost_micros, metrics.clicks,
       metrics.conversions, metrics.conversions_value
FROM shopping_performance_view
WHERE segments.date DURING YESTERDAY
```

### Step 2 — Pull Real Revenue
Hit my revenue source — this is the part Google doesn't have.

**[REPLACE THIS with your revenue API]:**
- Stripe charges, Shopify orders, your database, a Looker export, or whatever tracks actual settled revenue
- Minimum fields needed: product or campaign identifier, actual revenue collected, date
- This is NOT Google's "conversion value" — this is real money that hit your account

### Step 3 — Join and Calculate
Match spend to revenue on campaign ID or product ID. For each campaign/product calculate:
- **True profit** = real revenue - ad spend
- **True ROAS** = real revenue / ad spend
- **CPA** = ad spend / conversions
- **Profit margin** = true profit / real revenue

Flag anything where:
- Google's reported ROAS vs true ROAS differ by more than 20% (attribution gap)
- True ROAS is below 1.0 (losing money)
- Spend increased >30% day-over-day (budget spike)
- High CTR but low conversion rate (landing page problem)
- Strong true ROAS but low spend (scaling opportunity)

### Step 4 — Write to Google Sheets
Append yesterday's data as a new row in a "Daily Summary" sheet. Columns:
`date | total spend | total real revenue | true profit | true ROAS | top campaign | worst campaign`

Write product-level detail to a "Product Performance" tab.

### Step 5 — Send to Slack
Format a daily message:
- Yesterday's totals: spend | real revenue | true profit | true ROAS
- Top 3 most profitable campaigns (with true profit $)
- Bottom 3 money losers (with true loss $)
- Any flags from Step 3
- Keep it scannable. No walls of text.

### Bonus: Anomaly Detection
Add as a separate trigger, runs every 6 hours.

Compare current period spend/clicks/impressions to the same period yesterday. If anything swings more than 25%, pull the Google Ads Change History API to find what changed:

```sql
SELECT change_event.change_date_time,
       change_event.change_resource_type,
       change_event.user_email
FROM change_event
WHERE change_event.change_date_time DURING LAST_24_HOURS
```

Send a Slack alert with the anomaly and the change that likely caused it.

### Bonus: Hourly Pacing
Add as a separate trigger, runs hourly 9am–6pm.

Pull today's cumulative spend. Compare to expected hourly pacing (daily budget / hours elapsed). If 20%+ over or under pace, Slack alert with projected daily total at current run rate.

---

## PART 2: SETUP STEPS

### 1. Google Ads API Access
- Google Ads → Tools & Settings → API Center → apply for developer token
- "Basic" access is enough for your own data
- Google Cloud Console: create project → enable "Google Ads API" → create OAuth2 credentials (Web Application)
- You need: **developer token**, **OAuth2 client ID**, **client secret**, **customer ID** (10-digit number from your account URL)

### 2. Google Merchant Center API (if you run Shopping)
- Same GCP project → enable "Content API for Shopping"
- Same OAuth2 credentials
- You need: **Merchant Center ID** (in MC settings)

### 3. Your Revenue Source
This is the most important connection. Pick yours:

| Source | How to connect |
|---|---|
| **Stripe** | API key from dashboard.stripe.com/apikeys → pull charges or balance transactions |
| **Shopify** | Create a private app → pull orders via REST API |
| **WooCommerce** | REST API keys from WP admin → pull orders |
| **Database** | Direct query via n8n Postgres/MySQL/BigQuery node |
| **Looker / Tableau** | Schedule export to Sheets or use Looker API |
| **CSV / manual** | Upload to a Google Sheet daily, workflow reads from there |

**Minimum fields:** A way to match the sale back to a campaign or product (UTM, product ID, SKU), the revenue amount, and the date.

### 4. Google Sheets
- Create a spreadsheet with tabs: "Daily Summary" and "Product Performance"
- In n8n: connect via Google Sheets OAuth2 (same GCP project, enable Sheets API)

### 5. Slack
- api.slack.com/apps → Create New App → From Scratch
- Add `chat:write` bot scope → Install to workspace → copy Bot Token
- Create a channel like `#paid-media-alerts` and invite the bot

### 6. n8n
- Sign up at n8n.cloud (free tier works) or self-host
- Add credentials: Google Ads OAuth2, Google Sheets, Slack Bot Token
- Give your agent this file and point it at your n8n instance

---

## WHY THIS MATTERS

Google Ads reports conversions based on its own attribution model. Your bank account reports what actually happened. The gap between those two numbers is where money disappears.

This workflow closes that gap every morning — no dashboards to check, no spreadsheets to update. Spend comes from the ad platform API, revenue comes from your source of truth, and the math happens automatically.
