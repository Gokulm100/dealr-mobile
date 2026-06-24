/** Client-side fallback when API has not returned `caution` yet (mirrors backend rules). */

export function getChatTrustCautionFromProfile(profile) {
  if (!profile) return { show: false, reason: null };
  if (profile.caution) return profile.caution;

  const trustScore = profile.trustScore ?? 50;
  const ratingAvg = profile.ratingAvg || 0;
  const reviewCount = profile.reviewCount || 0;
  const badgeLevel = profile.badges?.[0]?.level;

  const hasCautionBadge = badgeLevel === 'caution';
  const lowTrust = trustScore < 40;
  const lowRating = reviewCount >= 1 && ratingAvg <= 2.5;

  if (!hasCautionBadge && !lowTrust && !lowRating) {
    return { show: false, reason: null };
  }

  if (lowRating) {
    return {
      show: true,
      reason: `Rated ${ratingAvg.toFixed(1)}★ from past deals — proceed carefully.`,
    };
  }

  if (lowTrust) {
    return {
      show: true,
      reason: 'Very low trust score — meet in public and pay only after inspecting the item.',
    };
  }

  if (hasCautionBadge) {
    return {
      show: true,
      reason: 'This account has raised trust concerns.',
    };
  }

  return { show: false, reason: null };
}
