// ─── Budget Section ───────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { emoji: string; color: string; label: string }> = {
  food:          { emoji: '🍜', color: '#FF9800', label: 'Food' },
  transport:     { emoji: '🚗', color: '#2196F3', label: 'Transport' },
  accommodation: { emoji: '🏨', color: '#9C27B0', label: 'Accommodation' },
  activity:      { emoji: '🎯', color: '#4CAF50', label: 'Activities' },
  flight:        { emoji: '✈️', color: '#00BCD4', label: 'Flights' },
  shopping:      { emoji: '🛍️', color: '#F44336', label: 'Shopping' },
  other:         { emoji: '📦', color: '#888888', label: 'Other' },
};

export interface BudgetData {
  currency: string;
  totalBudget: number;
  totalSpent: number;
  expenses: Array<{ amount: number; category: string; title: string; date: string }>;
}

export function renderBudget(data: BudgetData): string {
  if (data.expenses.length === 0 && data.totalBudget === 0) return '';

  const pct = data.totalBudget > 0
    ? Math.min(Math.round((data.totalSpent / data.totalBudget) * 100), 100)
    : 0;

  // Category totals
  const catTotals: Record<string, number> = {};
  for (const e of data.expenses) {
    const cat = e.category ?? 'other';
    catTotals[cat] = (catTotals[cat] ?? 0) + Number(e.amount);
  }
  const categories = Object.entries(catTotals)
    .map(([name, spent]) => ({
      name,
      spent,
      percentage: data.totalSpent > 0 ? Math.round((spent / data.totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.spent - a.spent);

  const categoriesHtml = categories.map(cat => {
    const meta = CATEGORY_META[cat.name] ?? CATEGORY_META.other;
    return `
      <div class="category-row">
        <span class="category-emoji">${meta.emoji}</span>
        <span class="category-name">${meta.label}</span>
        <div class="category-bar-wrap">
          <div class="category-bar" style="width:${cat.percentage}%;background:${meta.color}"></div>
        </div>
        <span class="category-pct">${cat.percentage}%</span>
        <span class="category-amount">${data.currency} ${cat.spent.toFixed(0)}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="section page-break">
      <div class="section-title">Budget Recap</div>

      <div class="budget-hero">
        <div class="budget-total">${data.currency} ${data.totalSpent.toLocaleString()}</div>
        <div class="budget-label">total spent${data.totalBudget > 0 ? ` of ${data.currency} ${data.totalBudget.toLocaleString()} budget` : ''}</div>
        ${data.totalBudget > 0 ? `
          <div class="budget-progress-bg">
            <div class="budget-progress-fill" style="width:${pct}%;${pct > 90 ? 'background:#F44336' : ''}"></div>
          </div>
          <div class="budget-stats">
            <div class="budget-stat">
              <div class="budget-stat-value">${pct}%</div>
              <div class="budget-stat-label">Used</div>
            </div>
            <div class="budget-stat">
              <div class="budget-stat-value">${data.currency} ${Math.abs(data.totalBudget - data.totalSpent).toFixed(0)}</div>
              <div class="budget-stat-label">${data.totalSpent > data.totalBudget ? 'Over budget' : 'Remaining'}</div>
            </div>
            <div class="budget-stat">
              <div class="budget-stat-value">${data.expenses.length}</div>
              <div class="budget-stat-label">Expenses</div>
            </div>
          </div>
        ` : ''}
      </div>

      ${categories.length > 0 ? `
        <div class="section-title">By Category</div>
        ${categoriesHtml}
      ` : ''}
    </div>
  `;
}
