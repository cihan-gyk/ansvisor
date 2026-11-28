---
title: Track KPIs in the Action Center
route: /dashboard/action-center/kpis
keywords: [kpis, goals, targets, edit kpis, kpi status, goal reached, visibility score, out of 100, ai conversions, ai revenue, key events]
synonyms: [key metrics, objectives, set goals, performance targets]
plan: all
updated: 2026-11-28
last_checked: 2026-11-11
owner: Cihan
app_version: 0.3.0
approved: true
sources: [docs/guides/action-center.mdx]
---
**KPIs**, one of the views of the Action Center's **History** tab, tracks the goals you set for the brand. The page keeps the **History** title; **KPIs** is picked in the views below it. Each KPI shows its **Value**, **Change**, **Trend (7D)**, **Goal**, progress **vs Goal** and a **Status**. An action's Overview lists the KPIs it is linked to.

## KPIs you can track

AI Visibility, Citations, Mentions, Share of Voice, AI Referral Traffic, AI Conversions, AI Revenue and Positive Sentiment.

AI Visibility is your Visibility score over the KPI period (Today shows it for the latest run): a score out of 100, such as "29.9/100", not a percentage of prompts. Its goal is out of 100 too, and its change, here and in History results, is in points. Share of Voice and Positive Sentiment are percentages.

A brand that never had KPIs starts with a suggested set: AI Visibility, Citations, Mentions, Share of Voice and Positive Sentiment, plus AI Referral Traffic when Google Analytics is connected. Each aims 20% above its last 30 days, or starts from a default where there's no data yet. It is saved the first time an admin or manager opens KPIs.

## AI Conversions and AI Revenue

Both come from Google Analytics, as on the AI Traffic page. **AI Conversions** counts the key events in sessions referred by AI platforms; **AI Revenue** is those sessions' purchase revenue. They show only when Google Analytics is connected, so they aren't in the suggested set: add them with **Edit KPIs**, where they're marked **Needs Google Analytics**.

Revenue is in your Google Analytics property's own currency, shown as a whole number without a currency sign, and isn't converted. It needs e-commerce tracking: when Google Analytics reported no revenue in the period or the one before, the KPI says so instead of a status, and isn't counted as off track.

## KPI status

- **Goal Reached**: 100% of the goal or more.
- **On Track**: 70% or more, and not moving the wrong way.
- **At Risk**: 40 to 69%, or moving the wrong way before the goal is reached.
- **Off Track**: under 40%.

## Set a new goal

When a KPI passes its goal, **Goal passed · Set a new goal** shows under its status. Click it to see the next goal, 20% above where the KPI is now; change it if you like and click **Save goal**. Nothing changes until you save. Point at a goal to see its exact number, such as 21,356 behind "21.4K".

## Change your KPIs

Click **Edit KPIs** (or **Configure KPIs**) to open the framework. Pick a template (**AI Search Visibility**, **Brand Monitoring** or **Custom Framework**; **Content Performance** is marked coming soon), a time period (Weekly, Monthly or Quarterly) and a target for each KPI, then click **Save & Apply**. Only admins and managers can change KPIs.

## KPIs on an action

An action's Overview lists the KPIs it is linked to, each with its **Brand monthly goal** (or weekly, or quarterly, as the goal is set), such as "Brand monthly goal: 5k". That is the goal for the whole brand, written as on this page, not a goal for the action's own prompts.
