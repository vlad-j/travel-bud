// ─── Travel Book Template ─────────────────────────────────────────────────────
// Assembles all sections into one HTML document.

import { renderCover, CoverData } from './CoverSection';
import { renderSummary, SummaryData } from './SummarySection';
import { renderMap, MapDestination } from './MapSection';
import { renderItinerary, DayData } from './ItinerarySection';
import { renderJournal, renderMoodTimeline, JournalEntryData } from './JournalSection';
import { renderBudget, BudgetData } from './BudgetSection';
import { renderStatistics, StatisticsData } from './StatisticsSection';

// Inline CSS — keeps PDF self-contained
const CSS = `
/* ─── Reset ─── */
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:#1A1A1A;background:#fff;font-size:14px;line-height:1.6}
.page-break{page-break-after:always;break-after:page}
.no-break{page-break-inside:avoid;break-inside:avoid}
.section{padding:32px 28px}
.section-title{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:20px;padding-bottom:8px;border-bottom:1px solid #E0E0E0}
/* Cover */
.cover{background:#1A1A2E;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 32px;text-align:center;color:white;position:relative}
.cover-emoji{font-size:96px;margin-bottom:32px}
.cover-trip-name{font-size:42px;font-weight:900;color:white;letter-spacing:-1px;margin-bottom:12px}
.cover-dates{font-size:16px;color:rgba(255,255,255,0.7);margin-bottom:8px;font-weight:500}
.cover-destinations{font-size:14px;color:rgba(255,255,255,0.5);margin-bottom:40px}
.cover-badge{display:inline-block;background:#4CAF50;color:white;font-size:12px;font-weight:700;padding:8px 20px;border-radius:20px;letter-spacing:1px;text-transform:uppercase}
.cover-footer{position:absolute;bottom:32px;font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:1px}
/* Stats */
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.stat-card{background:#F8F8F8;border-radius:12px;padding:16px 12px;text-align:center;border:1px solid #E0E0E0}
.stat-emoji{font-size:24px;display:block;margin-bottom:6px}
.stat-value{font-size:22px;font-weight:900;color:#1A1A1A;display:block}
.stat-label{font-size:10px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
/* Summary */
.summary-card{background:#1A1A2E;color:white;border-radius:12px;padding:24px;margin-bottom:20px}
.summary-card h2{font-size:24px;font-weight:900;margin-bottom:4px}
.summary-card .sub{font-size:13px;color:rgba(255,255,255,0.6);margin-bottom:20px}
.summary-row{display:flex;gap:16px;flex-wrap:wrap}
.summary-item{background:rgba(255,255,255,0.1);border-radius:8px;padding:10px 14px;font-size:13px;color:rgba(255,255,255,0.85)}
.summary-item-plain{background:#F8F8F8;border-radius:8px;padding:10px 14px;font-size:13px;color:#1A1A1A;border:1px solid #E0E0E0}
/* Route */
.route-wrap{display:flex;flex-direction:column;gap:0}
.route-stop{display:flex;align-items:flex-start;gap:16px;padding-bottom:20px}
.route-dot-col{display:flex;flex-direction:column;align-items:center;width:20px;flex-shrink:0}
.route-dot{width:12px;height:12px;border-radius:50%;background:#4CAF50;border:2px solid white;box-shadow:0 0 0 2px #4CAF50;flex-shrink:0;margin-top:4px}
.route-line{width:2px;flex:1;background:#E0E0E0;min-height:32px;margin-top:4px}
.route-info{flex:1}
.route-name{font-size:16px;font-weight:700;color:#1A1A1A}
.route-country{font-size:12px;color:#888;margin-top:2px}
.route-nights{font-size:12px;color:#4CAF50;font-weight:600;margin-top:4px}
.route-emoji{font-size:28px;flex-shrink:0}
/* Day cards */
.day-card{background:#F8F8F8;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #E0E0E0;page-break-inside:avoid}
.day-header{display:flex;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #E0E0E0}
.day-number{background:#1A1A2E;color:white;font-size:11px;font-weight:800;padding:4px 10px;border-radius:20px;letter-spacing:.5px}
.day-date{font-size:14px;font-weight:700;color:#1A1A1A}
.day-dest{font-size:12px;color:#888;margin-left:auto}
.day-activities{margin-bottom:12px}
.day-activity{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;color:#1A1A1A;border-bottom:1px solid #E0E0E0}
.day-activity:last-child{border-bottom:none}
.day-activity-time{font-size:11px;color:#888;width:36px;flex-shrink:0}
.day-activity-emoji{font-size:14px;width:20px}
.day-journal{background:white;border-radius:8px;padding:12px;margin-top:10px;border-left:3px solid #4CAF50}
.day-journal-mood{font-size:18px;margin-bottom:6px}
.day-journal-title{font-size:14px;font-weight:700;color:#1A1A1A;margin-bottom:4px}
.day-journal-content{font-size:12px;color:#555;line-height:1.6}
.day-journal-highlight{font-size:12px;color:#78350F;background:#FFFBEB;border-left:3px solid #F59E0B;padding:8px 10px;border-radius:4px;margin-top:8px}
.day-spending{display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-top:10px;font-size:12px;color:#888}
.day-spending-amount{font-weight:700;color:#4CAF50;font-size:14px}
/* Journal */
.journal-entry{background:white;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #E0E0E0;box-shadow:0 2px 8px rgba(0,0,0,0.08);page-break-inside:avoid}
.journal-entry-header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.journal-mood{font-size:28px}
.journal-title{font-size:18px;font-weight:800;color:#1A1A1A;flex:1}
.journal-date{font-size:11px;color:#888}
.journal-location{font-size:12px;color:#888;margin-bottom:12px}
.journal-content{font-size:13px;color:#444;line-height:1.7;margin-bottom:12px}
.journal-highlight{background:#FFFBEB;border-left:4px solid #F59E0B;padding:10px 14px;border-radius:4px;font-size:13px;color:#78350F;margin-bottom:12px}
.journal-meal{display:flex;align-items:center;gap:8px;font-size:12px;color:#888;margin-bottom:10px}
.journal-photos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.journal-photo{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px}
/* Mood */
.mood-timeline{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
.mood-item{display:flex;flex-direction:column;align-items:center;gap:4px;width:44px}
.mood-emoji-wrap{width:40px;height:40px;border-radius:50%;background:#F8F8F8;display:flex;align-items:center;justify-content:center;font-size:20px}
.mood-day{font-size:10px;font-weight:700;color:#888}
.mood-summary{display:flex;gap:16px;margin-top:16px;padding-top:16px;border-top:1px solid #E0E0E0}
.mood-summary-item{display:flex;align-items:center;gap:6px;font-size:13px;color:#888}
/* Budget */
.budget-hero{background:#1A1A2E;color:white;border-radius:12px;padding:24px;margin-bottom:20px}
.budget-total{font-size:36px;font-weight:900;margin-bottom:4px}
.budget-label{font-size:13px;color:rgba(255,255,255,0.6);margin-bottom:16px}
.budget-progress-bg{background:rgba(255,255,255,0.15);border-radius:4px;height:8px;margin-bottom:16px}
.budget-progress-fill{height:100%;background:#4CAF50;border-radius:4px}
.budget-stats{display:flex;gap:24px}
.budget-stat{text-align:center}
.budget-stat-value{font-size:18px;font-weight:800}
.budget-stat-label{font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase}
.category-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #E0E0E0}
.category-row:last-child{border-bottom:none}
.category-emoji{font-size:20px;width:28px}
.category-name{font-size:13px;font-weight:600;flex:1}
.category-bar-wrap{width:80px;height:6px;background:#F8F8F8;border-radius:3px;overflow:hidden}
.category-bar{height:100%;border-radius:3px}
.category-amount{font-size:13px;font-weight:700;width:60px;text-align:right}
.category-pct{font-size:11px;color:#888;width:30px;text-align:right}
/* Members */
.members-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
.member-chip{display:flex;align-items:center;gap:8px;background:#F8F8F8;border-radius:20px;padding:8px 14px;border:1px solid #E0E0E0}
.member-emoji{font-size:18px}
.member-name{font-size:13px;font-weight:600}
.member-role{font-size:10px;color:#888}
.generated-by{text-align:center;font-size:11px;color:#888;padding:24px;letter-spacing:.5px}
`;

export interface TravelBookData {
  cover: CoverData;
  summary: SummaryData;
  destinations: MapDestination[];
  days: DayData[];
  journalEntries: JournalEntryData[];
  budget: BudgetData;
  statistics: StatisticsData;
}

export function assembleTravelBook(data: TravelBookData): string {
  const sections = [
    renderCover(data.cover),
    renderSummary(data.summary),
    renderMap(data.destinations),
    renderStatistics(data.statistics),
    renderItinerary(data.days),
    renderMoodTimeline(data.journalEntries),
    renderJournal(data.journalEntries),
    renderBudget(data.budget),
    `<div class="generated-by">Generated by Ultimate Travel Buddy · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>`,
  ].filter(Boolean).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.cover.tripName} — Travel Book</title>
  <style>${CSS}</style>
</head>
<body>
  ${sections}
</body>
</html>`;
}
