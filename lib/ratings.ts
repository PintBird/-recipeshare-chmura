export type RatingSummary = {
  averageRating: number;
  ratingCount: number;
};

export function summarizeRatings(ratings: number[]): RatingSummary {
  if (ratings.length === 0) {
    return { averageRating: 0, ratingCount: 0 };
  }

  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return {
    averageRating: total / ratings.length,
    ratingCount: ratings.length,
  };
}

export function isRatingSummary(value: unknown): value is RatingSummary {
  if (typeof value !== "object" || value === null) return false;
  const summary = value as Record<string, unknown>;
  return (
    typeof summary.averageRating === "number" &&
    typeof summary.ratingCount === "number"
  );
}
