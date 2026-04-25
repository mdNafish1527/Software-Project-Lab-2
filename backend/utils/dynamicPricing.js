// /**
//  * ─────────────────────────────────────────────────────────────────────────────
//  * GaanBajna Dynamic Pricing — Bayesian Beta-Binomial Model
//  * ─────────────────────────────────────────────────────────────────────────────
//  *
//  * THEORY:
//  *   We model demand as a Beta-Binomial process.
//  *   Prior:     demand_rate ~ Beta(α₀, β₀)   [our belief before any sales]
//  *   Likelihood: tickets_sold ~ Binomial(n, demand_rate)
//  *   Posterior:  demand_rate | data ~ Beta(α₀ + sold, β₀ + remaining)
//  *
//  *   Posterior mean = (α₀ + sold) / (α₀ + β₀ + total)
//  *
//  *   Price is then scaled by:
//  *     1. Demand multiplier  — derived from posterior vs prior mean
//  *     2. Time multiplier    — scarcity as event date approaches
//  *     3. Velocity bonus     — recent purchase burst (optional)
//  *
//  * PRICE BOUNDS:
//  *   Final price is clamped between 0.7× and 2.0× the base price
//  *   so we never go below 70% or above 200% of original.
//  * ─────────────────────────────────────────────────────────────────────────────
//  */

// // ── Hyper-parameters (tune these) ────────────────────────────────────────────
// const ALPHA_0 = 2;   // prior pseudo-successes  (optimistic → raise to expect more demand)
// const BETA_0  = 8;   // prior pseudo-failures   (pessimistic → lower means expect high demand)
// const SENSITIVITY = 2.5; // how aggressively demand lifts price (1=mild, 3=aggressive)
// const MIN_MULTIPLIER = 0.70;  // never drop below 70% of base price
// const MAX_MULTIPLIER = 2.00;  // never exceed 200% of base price

// /**
//  * Compute posterior mean demand rate using Beta-Binomial conjugacy.
//  * @param {number} sold     - tickets sold so far for this tier
//  * @param {number} total    - total capacity for this tier
//  * @returns {number}        - posterior mean ∈ (0, 1)
//  */
// function posteriorDemandRate(sold, total) {
//   const alpha = ALPHA_0 + sold;
//   const beta  = BETA_0  + Math.max(0, total - sold);
//   return alpha / (alpha + beta);
// }

// /**
//  * Time-based multiplier: prices rise as event date approaches.
//  * Far future events get a small early-bird discount.
//  * @param {string|Date} eventDate
//  * @returns {number} multiplier
//  */
// function timeFactor(eventDate) {
//   const now       = Date.now();
//   const eventMs   = new Date(eventDate).getTime();
//   const daysUntil = (eventMs - now) / (1000 * 60 * 60 * 24);

//   if (daysUntil < 0)   return 1.00;  // event passed — no change
//   if (daysUntil <= 1)  return 1.60;  // last 24 hours: +60%
//   if (daysUntil <= 3)  return 1.40;  // last 3 days:   +40%
//   if (daysUntil <= 7)  return 1.25;  // last week:     +25%
//   if (daysUntil <= 14) return 1.10;  // 2 weeks out:   +10%
//   if (daysUntil <= 30) return 1.00;  // 1 month out:    base
//   return 0.90;                        // far future:    -10% early-bird
// }

// /**
//  * Demand multiplier derived from Bayesian posterior.
//  * @param {number} sold   - tickets sold
//  * @param {number} total  - total capacity
//  * @returns {number} multiplier
//  */
// function demandFactor(sold, total) {
//   const priorMean    = ALPHA_0 / (ALPHA_0 + BETA_0);   // = 0.20
//   const posteriorMean = posteriorDemandRate(sold, total);
//   const lift          = (posteriorMean - priorMean) * SENSITIVITY;
//   // lift ∈ roughly (-0.5, +1.5) → clamp to reasonable range
//   return 1 + Math.max(-0.30, Math.min(0.80, lift));
// }

// /**
//  * Main function: compute dynamic price for a single ticket tier.
//  *
//  * @param {number} basePrice   - original tier price in BDT (৳)
//  * @param {number} sold        - tickets sold so far for this tier
//  * @param {number} total       - total capacity for this tier
//  * @param {string} eventDate   - ISO date string of the event
//  * @returns {object} {
//  *   dynamicPrice: number,      // final rounded price in BDT
//  *   basePrice: number,         // original price
//  *   multiplier: number,        // combined multiplier applied
//  *   demandRate: number,        // posterior demand rate (0–1)
//  *   priceChange: string,       // 'increased' | 'decreased' | 'stable'
//  *   percentChange: number,     // e.g. +15 or -10
//  *   reason: string,            // human-readable explanation
//  * }
//  */
// function computeDynamicPrice(basePrice, sold, total, eventDate) {
//   // Free tickets stay free
//   if (!basePrice || basePrice === 0) {
//     return {
//       dynamicPrice: 0, basePrice: 0, multiplier: 1,
//       demandRate: 0, priceChange: 'stable', percentChange: 0,
//       reason: 'Free entry — no dynamic pricing applied',
//     };
//   }

//   const dFactor  = demandFactor(sold, total);
//   const tFactor  = timeFactor(eventDate);
//   const combined = dFactor * tFactor;

//   // Clamp final multiplier
//   const multiplier = Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, combined));

//   // Round to nearest ৳50 for clean display
//   const rawPrice     = basePrice * multiplier;
//   const dynamicPrice = Math.round(rawPrice / 50) * 50;

//   const percentChange  = Math.round((multiplier - 1) * 100);
//   const demandRate     = posteriorDemandRate(sold, total);
//   const soldPct        = total > 0 ? Math.round((sold / total) * 100) : 0;
//   const daysUntil      = Math.round((new Date(eventDate) - Date.now()) / (1000 * 60 * 60 * 24));

//   // Build human-readable reason
//   let reason = '';
//   if (multiplier > 1.3)       reason = `High demand (${soldPct}% sold) + ${daysUntil}d until event`;
//   else if (multiplier > 1.1)  reason = `Moderate demand (${soldPct}% sold)`;
//   else if (multiplier < 0.9)  reason = `Early-bird discount — ${daysUntil} days to go`;
//   else                        reason = `Stable pricing`;

//   return {
//     dynamicPrice,
//     basePrice,
//     multiplier:    Math.round(multiplier * 100) / 100,
//     demandRate:    Math.round(demandRate * 1000) / 1000,
//     priceChange:   percentChange > 2 ? 'increased' : percentChange < -2 ? 'decreased' : 'stable',
//     percentChange,
//     reason,
//   };
// }

// /**
//  * Apply dynamic pricing to all tiers of an event object.
//  * Mutates and returns the event with extra fields added per tier.
//  *
//  * @param {object} event - event row from DB (must have tier1_price, tier1_quantity, etc.)
//  * @returns {object}     - same event with dynamic_tier1, dynamic_tier2, dynamic_tier3 added
//  */
// function applyDynamicPricingToEvent(event) {
//   const result = { ...event };

//   for (const n of [1, 2, 3]) {
//     const base  = Number(event[`tier${n}_price`]    || 0);
//     const total = Number(event[`tier${n}_quantity`] || 0);

//     if (total === 0) {
//       result[`dynamic_tier${n}`] = null;
//       continue;
//     }

//     // Estimate tickets sold: total - remaining
//     // If you track sold separately, replace this with real data
//     const sold = Number(event[`tier${n}_sold`] || 0);

//     result[`dynamic_tier${n}`] = computeDynamicPrice(base, sold, total, event.date || event.event_date);
//   }

//   return result;
// }

// module.exports = { computeDynamicPrice, applyDynamicPricingToEvent, posteriorDemandRate, timeFactor };



/**
 * backend/utils/dynamicPricing.js
 * Computes dynamic ticket price based on demand and days remaining.
 */

function computeDynamicPrice(basePrice, sold, total, eventDate) {
  if (!basePrice || !total) {
    return { dynamicPrice: basePrice, priceChange: 'stable', percentChange: 0, demandRate: 0 };
  }

  const demandRate  = sold / total;                           // 0.0 – 1.0
  const daysLeft    = Math.max(0, (new Date(eventDate) - new Date()) / 86_400_000);

  // Demand multiplier: up to +40% when nearly sold out
  const demandMultiplier = 1 + demandRate * 0.4;

  // Urgency multiplier: up to +20% when under 3 days away
  const urgencyMultiplier = daysLeft < 3  ? 1.2
                          : daysLeft < 7  ? 1.1
                          : daysLeft < 14 ? 1.05
                          : 1.0;

  const rawPrice    = basePrice * demandMultiplier * urgencyMultiplier;
  const dynamicPrice = Math.round(rawPrice / 10) * 10;       // round to nearest 10

  const diff          = dynamicPrice - basePrice;
  const percentChange = Math.abs(Math.round((diff / basePrice) * 100));
  const priceChange   = diff > 0 ? 'increased' : diff < 0 ? 'decreased' : 'stable';

  return { dynamicPrice, priceChange, percentChange, demandRate };
}

function applyDynamicPricingToEvent(event, soldCounts) {
  return {
    ...event,
    tier1_price: computeDynamicPrice(event.tier1_price, soldCounts[1] || 0, event.tier1_quantity, event.date).dynamicPrice,
    tier2_price: computeDynamicPrice(event.tier2_price, soldCounts[2] || 0, event.tier2_quantity, event.date).dynamicPrice,
    tier3_price: computeDynamicPrice(event.tier3_price, soldCounts[3] || 0, event.tier3_quantity, event.date).dynamicPrice,
  };
}

module.exports = { computeDynamicPrice, applyDynamicPricingToEvent };
