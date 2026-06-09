// DB row (snake_case) → frontend object (camelCase)

export function mapSearch(row) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    criteria: row.criteria ?? {},
    sources: row.sources ?? [],
    minMargin: row.min_margin,
    alertThreshold: row.alert_threshold,
    alertChannels: row.alert_channels ?? { whatsapp: true, email: false },
    dailySummary: row.daily_summary,
    matchesToday: row.matches_today,
    avgMargin: row.avg_margin,
    createdAt: row.created_at,
  };
}

export function mapAlert(row) {
  return {
    id: row.id,
    date: row.date,
    searchId: row.search_id ?? row.searchId,
    carTitle: row.car_title ?? row.carTitle,
    platform: row.platform,
    listingUrl: row.listing_url ?? row.listingUrl,
    priceOriginal: row.price_original ?? row.priceOriginal,
    cc: row.cc,
    co2: row.co2,
    fuelType: row.fuel_type ?? row.fuelType,
    ageYears: row.age_years ?? row.ageYears,
    transportEst: row.transport_est ?? row.transportEst,
    marketPrice: row.market_price ?? row.marketPrice,
    flags: row.flags ?? [],
    createdAt: row.created_at ?? row.createdAt,
  };
}

export function mapProfile(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    company: row.company,
    nif: row.nif,
    phone: row.phone,
    defaultTransportCost: row.default_transport_cost,
    minMargin: row.min_margin,
    notifChannel: row.notif_channel,
  };
}
