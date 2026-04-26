/**
 * backend/utils/dynamicPricing.js
 *
 * Realistic dynamic pricing for GaanBajna.
 *
 * Demand depends on:
 * 1. Percent of tickets already sold
 * 2. Days remaining before the concert
 *
 * Behavior:
 * - Early days + low demand: slight early-bird discount
 * - Moderate demand: small increase
 * - High demand + close event date: stronger increase
 * - Price is capped so it does not look unrealistic
 */

const MIN_MULTIPLIER = 0.9;
const MAX_MULTIPLIER = 1.65;

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundToNearest10(value) {
  return Math.round(Number(value || 0) / 10) * 10;
}

function getDaysLeft(eventDate) {
  if (!eventDate) return 999;

  const event = new Date(eventDate);
  if (Number.isNaN(event.getTime())) return 999;

  const now = new Date();

  const eventDay = new Date(event.getFullYear(), event.getMonth(), event.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.ceil((eventDay.getTime() - today.getTime()) / 86400000);
}

function getDemandMultiplier(soldPercent) {
  if (soldPercent >= 95) return 1.42;
  if (soldPercent >= 90) return 1.35;
  if (soldPercent >= 80) return 1.26;
  if (soldPercent >= 70) return 1.18;
  if (soldPercent >= 55) return 1.11;
  if (soldPercent >= 40) return 1.06;
  if (soldPercent >= 25) return 1.02;
  if (soldPercent <= 12) return 0.96;
  return 1.0;
}

function getTimeMultiplier(daysLeft, soldPercent) {
  if (daysLeft < 0) return 1.0;

  if (daysLeft <= 1) return soldPercent >= 60 ? 1.18 : 1.1;
  if (daysLeft <= 3) return soldPercent >= 55 ? 1.14 : 1.08;
  if (daysLeft <= 7) return soldPercent >= 45 ? 1.1 : 1.05;
  if (daysLeft <= 14) return soldPercent >= 40 ? 1.06 : 1.02;
  if (daysLeft >= 45 && soldPercent <= 20) return 0.95;
  if (daysLeft >= 30 && soldPercent <= 15) return 0.97;

  return 1.0;
}

function getDemandLevel(soldPercent, daysLeft) {
  if (soldPercent >= 90) return 'extreme';
  if (soldPercent >= 75 && daysLeft <= 7) return 'very_high';
  if (soldPercent >= 65) return 'high';
  if (soldPercent >= 40) return 'moderate';
  if (soldPercent <= 15 && daysLeft >= 30) return 'low';
  return 'normal';
}

// function computeDynamicPrice(basePrice, sold, total, eventDate) {
//   const base = toNumber(basePrice);
//   const capacity = Math.max(0, Math.floor(toNumber(total)));
//   const soldCount = Math.max(0, Math.floor(toNumber(sold)));

//   if (!base || !capacity) {
//     return {
//       dynamicPrice: base,
//       basePrice: base,
//       multiplier: 1,
//       demandRate: 0,
//       soldPercent: 0,
//       daysLeft: getDaysLeft(eventDate),
//       priceChange: 'stable',
//       percentChange: 0,
//       demandLevel: 'normal',
//       reason: 'Base price used',
//     };
//   }

//   const soldPercent = clamp((soldCount / capacity) * 100, 0, 100);
//   const demandRate = soldPercent / 100;
//   const daysLeft = getDaysLeft(eventDate);

//   const demandMultiplier = getDemandMultiplier(soldPercent);
//   const timeMultiplier = getTimeMultiplier(daysLeft, soldPercent);

//   let multiplier = demandMultiplier * timeMultiplier;

//   if (soldPercent >= 80 && daysLeft <= 7) {
//     multiplier += 0.06;
//   }

//   multiplier = clamp(multiplier, MIN_MULTIPLIER, MAX_MULTIPLIER);

//   const dynamicPrice = Math.max(10, roundToNearest10(base * multiplier));
//   const percentChange = Math.round(((dynamicPrice - base) / base) * 100);

//   const priceChange =
//     percentChange > 1 ? 'increased' : percentChange < -1 ? 'decreased' : 'stable';

//   const demandLevel = getDemandLevel(soldPercent, daysLeft);

//   let reason = 'Stable demand';
//   if (priceChange === 'increased') {
//     reason = `${Math.round(soldPercent)}% sold and ${daysLeft} day(s) left`;
//   } else if (priceChange === 'decreased') {
//     reason = `Early-bird adjustment: ${Math.round(soldPercent)}% sold and ${daysLeft} day(s) left`;
//   }

//   return {
//     dynamicPrice,
//     basePrice: base,
//     multiplier: Number(multiplier.toFixed(2)),
//     demandRate: Number(demandRate.toFixed(3)),
//     soldPercent: Math.round(soldPercent),
//     daysLeft,
//     priceChange,
//     percentChange,
//     demandLevel,
//     reason,
//   };
// }


function computeDynamicPrice(basePrice, sold, capacity, eventDate) {
  const base = Number(basePrice || 0);
  const soldCount = Number(sold || 0);
  const totalCapacity = Number(capacity || 0);

  if (!base || base <= 0) {
    return {
      dynamicPrice: 0,
      basePrice: base,
      multiplier: 1,
      priceChange: 'stable',
      percentChange: 0,
      soldPercent: 0,
      daysLeft: null,
      demandLevel: 'none',
      reason: 'Invalid base price',
    };
  }

  if (!totalCapacity || totalCapacity <= 0) {
    return {
      dynamicPrice: base,
      basePrice: base,
      multiplier: 1,
      priceChange: 'stable',
      percentChange: 0,
      soldPercent: 0,
      daysLeft: null,
      demandLevel: 'normal',
      reason: 'No capacity found. Base price applied.',
    };
  }

  const soldPercent = Math.min(100, Math.max(0, (soldCount / totalCapacity) * 100));

  let daysLeft = null;
  if (eventDate) {
    const today = new Date();
    const event = new Date(eventDate);
    const diffMs = event.getTime() - today.getTime();
    daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  // IMPORTANT FIX:
  // No ticket sold means no demand, so price must stay base price.
  if (soldCount <= 0) {
    return {
      dynamicPrice: Math.round(base),
      basePrice: base,
      multiplier: 1,
      priceChange: 'stable',
      percentChange: 0,
      soldPercent: 0,
      daysLeft,
      demandLevel: 'normal',
      reason: 'No ticket sold yet. Base price applied.',
    };
  }

  let multiplier = 1;
  let demandLevel = 'normal';

  // Demand-based pricing only after at least 1 ticket is sold
  if (soldPercent >= 90) {
    multiplier = 1.5;
    demandLevel = 'very_high';
  } else if (soldPercent >= 75) {
    multiplier = 1.35;
    demandLevel = 'high';
  } else if (soldPercent >= 50) {
    multiplier = 1.2;
    demandLevel = 'medium';
  } else if (soldPercent >= 25) {
    multiplier = 1.1;
    demandLevel = 'rising';
  }

  // Time urgency should only affect price after demand exists
  if (soldCount > 0 && daysLeft !== null && daysLeft >= 0) {
    if (daysLeft <= 1 && soldPercent >= 50) {
      multiplier += 0.15;
    } else if (daysLeft <= 3 && soldPercent >= 40) {
      multiplier += 0.1;
    } else if (daysLeft <= 7 && soldPercent >= 30) {
      multiplier += 0.05;
    }
  }

  // Safety cap
  multiplier = Math.min(multiplier, 1.6);

  const dynamicPrice = Math.round(base * multiplier);
  const percentChange = Math.round(((dynamicPrice - base) / base) * 100);

  return {
    dynamicPrice,
    basePrice: base,
    multiplier,
    priceChange: dynamicPrice > base ? 'increased' : dynamicPrice < base ? 'decreased' : 'stable',
    percentChange,
    soldPercent: Math.round(soldPercent),
    daysLeft,
    demandLevel,
    reason:
      dynamicPrice > base
        ? `Price increased because ${Math.round(soldPercent)}% tickets are sold.`
        : 'Base price applied.',
  };
}

module.exports = { computeDynamicPrice };


function applyDynamicPricingToEvent(event) {
  const result = { ...event };

  for (const n of [1, 2, 3]) {
    const base = toNumber(event[`tier${n}_price`]);
    const total = toNumber(event[`tier${n}_quantity`]);
    const sold = toNumber(event[`tier${n}_sold`]);

    if (!total) {
      result[`dynamic_tier${n}`] = null;
      continue;
    }

    result[`dynamic_tier${n}`] = computeDynamicPrice(
      base,
      sold,
      total,
      event.date || event.event_date
    );
  }

  return result;
}

module.exports = {
  computeDynamicPrice,
  applyDynamicPricingToEvent,
  getDaysLeft,
};
