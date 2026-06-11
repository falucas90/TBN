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
    searchId: row.search_id,
    date: row.date,
    carTitle: row.car_title,
    platform: row.platform,
    listingUrl: row.listing_url,
    priceOriginal: row.price_original,
    cc: row.cc,
    co2: row.co2,
    fuelType: row.fuel_type,
    ageYears: row.age_years,
    transportEst: row.transport_est,
    marketPrice: row.market_price,
    flags: row.flags ?? [],
    userStatus: row.user_status ?? 'new',
    createdAt: row.created_at,
  };
}

export function mapProfile(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    notifChannel: row.notif_channel,
    companyId: row.company_id,
    companyRole: row.company_role,
  };
}

export function mapCompany(row) {
  return {
    id: row.id,
    name: row.name,
    nif: row.nif,
    status: row.status,
    defaultTransportCost: row.default_transport_cost,
    minMargin: row.min_margin,
  };
}
