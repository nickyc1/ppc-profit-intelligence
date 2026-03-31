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

### Step 6 — Change History Review & Account Grading

This is a weekly/monthly trigger that audits every change made to the account, grades the person managing it, and recommends what should have been done differently.

**Trigger:** Run weekly (Friday 5pm) or monthly (1st of month).

**6A — Pull Full Change History**

Pull every change made to the account during the review period:

```sql
SELECT change_event.change_date_time,
       change_event.change_resource_type,
       change_event.changed_fields,
       change_event.old_resource,
       change_event.new_resource,
       change_event.user_email,
       change_event.client_type,
       campaign.name,
       ad_group.name
FROM change_event
WHERE change_event.change_date_time DURING LAST_7_DAYS
ORDER BY change_event.change_date_time DESC
```

This captures every bid adjustment, budget change, keyword add/pause, ad creation/edit, audience change, and campaign setting modification — along with WHO made the change and WHEN.

**6B — Categorize Every Change**

Group changes into categories:
- **Budget changes** — increases, decreases, shared budget modifications
- **Bid adjustments** — manual CPC changes, target CPA/ROAS changes, bid strategy switches
- **Keyword management** — new keywords added, keywords paused, negative keywords added, match type changes
- **Ad creative** — new ads created, ads paused, RSA asset changes, ad copy edits
- **Targeting changes** — audience additions/removals, location targeting, device bid adjustments, dayparting changes
- **Campaign structure** — new campaigns, paused campaigns, new ad groups, campaign setting changes
- **Automated vs manual** — flag which changes came from Google's auto-apply recommendations vs. human decisions

**6C — Measure Impact of Each Change**

For every change, pull performance data for the 7 days before and 7 days after:
- Compare spend, clicks, conversions, CPA, and true ROAS pre vs post change
- Calculate the delta: did this change improve or hurt performance?
- Flag changes that had no measurable impact (wasted effort)
- Flag changes that hurt performance (negative impact)
- Flag changes where Google's auto-apply made things worse

**6D — Grade the Account Manager**

Score the review period on a 0-100 scale across these dimensions:

| Dimension | Weight | What it measures |
|---|---|---|
| **Spend efficiency** | 25% | Did budget flow to the highest true-ROAS campaigns? Were losers cut? |
| **Optimization velocity** | 20% | How many meaningful changes were made? Were problems addressed quickly? |
| **Negative keyword hygiene** | 15% | Were wasteful search terms caught and negated? How much spend leaked? |
| **Creative testing** | 15% | Were new ads tested? Were underperformers rotated out? |
| **Bid strategy alignment** | 15% | Are bid strategies matched to campaign goals? Were bid adjustments data-driven? |
| **Missed opportunities** | 10% | Were there scaling opportunities (high ROAS + low spend) that went untouched? |

Output a letter grade (A through F) with a numerical score and a one-paragraph summary.

**6E — Generate Recommendations**

For each category, compare what WAS done against what SHOULD have been done based on the performance data:

- "Budget was increased 30% on Campaign X, but true ROAS was only 0.8x. Recommendation: This budget should have been shifted to Campaign Y which had 4.2x true ROAS and was spend-constrained."
- "No negative keywords were added despite 'free' appearing in 47 search terms costing $312. Recommendation: Add 'free' as a campaign-level negative immediately."
- "Google auto-applied a broad match recommendation that increased CPA by 22%. Recommendation: Revert to exact/phrase match and disable auto-apply for match type changes."
- "No new ad copy was tested in 30 days. Top performing RSA has been running since January. Recommendation: Launch 2 new RSA variants testing different value props."

**6F — Output**

Write the full review to a "Change History Reviews" tab in Google Sheets. Send a formatted Slack message with:
- Overall grade and score
- Top 3 best decisions made (with impact data)
- Top 3 worst decisions or missed opportunities
- Prioritized action items for next week
- A note on any Google auto-apply changes that should be disabled

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
