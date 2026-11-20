export const readinessThreshold = 75;
export const qualifyingAttempts = 2;

export const sqlJoinQuestions = [
  {
    id: "retain-unmatched",
    prompt: "A customers table has one row per customer. Which join keeps customers who placed no orders?",
    options: ["INNER JOIN orders", "LEFT JOIN orders from customers", "CROSS JOIN orders"],
    answer: 1,
    feedback: "A left join preserves rows from customers even when there is no matching order.",
  },
  {
    id: "duplicate-dimension-key",
    prompt: "A fact row joins to two dimension rows with the same key. How many result rows does that fact row produce?",
    options: ["Zero", "One", "Two"],
    answer: 2,
    feedback: "A join produces one row per matching pair. Duplicate dimension keys can inflate totals.",
  },
  {
    id: "preserve-optional-filter",
    prompt: "A report must keep every customer and include only paid orders in the joined data. Where should the paid filter go?",
    options: ["In the LEFT JOIN ON condition", "In WHERE orders.status = 'paid'", "In ORDER BY"],
    answer: 0,
    feedback: "Putting the right-table filter in ON preserves customers without a qualifying order.",
  },
  {
    id: "count-matches",
    prompt: "After a left join, which expression counts matching orders per customer and returns zero for no orders?",
    options: ["COUNT(*)", "COUNT(DISTINCT customers.id)", "COUNT(orders.id)"],
    answer: 2,
    feedback: "COUNT(orders.id) skips the null order ID from unmatched customers.",
  },
  {
    id: "find-missing-matches",
    prompt: "After left joining inventory to shipments, which filter finds inventory items without any shipment?",
    options: ["WHERE shipments.id IS NULL", "WHERE inventory.id IS NULL", "WHERE shipments.id IS NOT NULL"],
    answer: 0,
    feedback: "An unmatched inventory row has null values on the shipment side.",
  },
] as const;

export function hasCoverage(title: string) {
  return /^(?:sql joins?|(?:sql )?join operations)$/iu.test(title.trim()) &&
    new Set(sqlJoinQuestions.map(({ id }) => id)).size >= qualifyingAttempts + 2;
}
