// =============================================================================
// TYPES — ANALYTICS
// =============================================================================

export interface AnalyticsSummary {
  total_views: number
  total_whatsapp_clicks: number
  total_inquiries: number
}

export interface DailyAnalytics {
  day: string          // "2026-11-07"
  views: number
  whatsapp_clicks: number
}

export interface TopProduct {
  product_id: string
  product_name: string
  product_slug: string
  views: number
  whatsapp_clicks: number
}