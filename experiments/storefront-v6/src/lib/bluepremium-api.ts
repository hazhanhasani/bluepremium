/**
 * Read-only adapter for the existing BluePremium Worker.
 * This frontend cannot create orders, transfer money or trigger fulfillment.
 *
 * The live adapter is opt-in at build time AND same-origin, to prevent leaking
 * signed Telegram initData to any other website, CDN or preview deployment.
 */
export interface PremiumPlan {
  id: number;
  months: number;
  title: string;
  price_toman: number;
}
export interface MarketItem {
  sku: string;
  kind: string;
  title: string;
  quantity?: number;
  price_toman: number;
  target_type?: string;
  catalog_key?: string | null;
}
export interface StoreOrder {
  code?: string;
  order_code?: string;
  title?: string;
  kind?: string;
  months?: number;
  status: string;
  price_toman: number;
  created_at?: string;
}
export interface CustomerAccount {
  display_name: string;
  username: string;
  balance_toman: number;
  referral_count: number;
  transactions: Array<{ id: number; delta_toman: number; reason: string; created_at: string }>;
  orders: StoreOrder[];
}
export interface StorefrontSession {
  state: 'guest' | 'loading' | 'member' | 'join_required' | 'error';
  user: CustomerAccount | null;
  marketOrders: StoreOrder[];
  error?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
        BackButton?: { show: () => void; hide: () => void; onClick: (fn: () => void) => void; offClick: (fn: () => void) => void };
      }
    };
  }
}

function safeOrigin(): string | null {
  if (import.meta.env.VITE_ENABLE_LIVE_READS !== 'true') return null;
  const configured = String(import.meta.env.VITE_API_ORIGIN || '').trim();
  if (!configured) return null;
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' || url.origin !== window.location.origin) return null;
    return url.origin;
  } catch { return null; }
}

export function hasTrustedSameOriginApi(): boolean { return safeOrigin() !== null; }

function telegramInitData(): string {
  return String(window.Telegram?.WebApp?.initData || '');
}

async function getJSON<T>(path: string, signal: AbortSignal, needsTelegram: boolean): Promise<T> {
  const origin = safeOrigin();
  if (!origin) throw new Error('preview_mode');
  if (!/^\/api\/(?:plans|market\/catalog\?kind=stars|me|market\/my-orders)$/.test(path)) {
    throw new Error('endpoint_not_allowed');
  }
  const headers: HeadersInit = { Accept: 'application/json' };
  if (needsTelegram) {
    const auth = telegramInitData();
    if (!auth) throw new Error('telegram_auth_required');
    headers['X-Telegram-Init-Data'] = auth;
  }
  const response = await fetch(origin + path, {
    method: 'GET',
    headers,
    cache: 'no-store',
    credentials: 'same-origin',
    redirect: 'error',
    signal,
  });
  if (!response.ok) throw new Error(response.status === 401 ? 'telegram_auth_required' : 'request_failed');
  const result: unknown = await response.json();
  if (!result || typeof result !== 'object' || !('ok' in result) || result.ok !== true) {
    throw new Error('invalid_api_response');
  }
  return result as T;
}

export async function loadPlans(signal: AbortSignal): Promise<PremiumPlan[]> {
  const response = await getJSON<{ok: true; plans?: unknown}>('/api/plans', signal, false);
  if (!Array.isArray(response.plans)) throw new Error('invalid_api_response');
  return response.plans
    .filter((p): p is PremiumPlan => p !== null && typeof p === 'object'
      && Number.isSafeInteger(p.id) && Number.isInteger(p.months)
      && typeof p.title === 'string' && Number.isSafeInteger(p.price_toman)
      && p.price_toman > 0)
    .slice(0, 12);
}

export async function loadStars(signal: AbortSignal): Promise<{enabled:boolean; products:MarketItem[]}> {
  const response = await getJSON<{ok:true; enabled?: unknown; products?:unknown}>('/api/market/catalog?kind=stars', signal, false);
  if (typeof response.enabled !== 'boolean' || !Array.isArray(response.products)) {
    throw new Error('invalid_api_response');
  }
  return {
    enabled: response.enabled,
    products: response.products.filter((p): p is MarketItem => Boolean(p)
      && typeof p === 'object' && typeof p.sku === 'string'
      && typeof p.title === 'string' && Number.isSafeInteger(p.price_toman)
      && p.price_toman > 0).slice(0, 30),
  };
}

export async function loadMember(signal: AbortSignal): Promise<StorefrontSession> {
  if (!telegramInitData()) return {state:'guest',user:null,marketOrders:[]};
  const data = await getJSON<{ok:true; user?: CustomerAccount; required_channels?: unknown}>('/api/me', signal, true);
  if (!data.user || typeof data.user !== 'object' || !Array.isArray(data.required_channels)) {
    throw new Error('invalid_api_response');
  }
  if (data.required_channels.length) return {state:'join_required',user:null,marketOrders:[]};
  if (!Number.isFinite(data.user.balance_toman)) throw new Error('invalid_api_response');
  let marketOrders: StoreOrder[] = [];
  try {
    const market = await getJSON<{ok:true; orders?:StoreOrder[]}>('/api/market/my-orders',signal,true);
    if (Array.isArray(market.orders)) marketOrders = market.orders.slice(0,40);
  } catch (e) {
    if (signal.aborted) throw e;
    // Premium wallet remains readable if market history fails.
  }
  return {state:'member',user:data.user,marketOrders};
}

export const formatToman = (number: number): string =>
  new Intl.NumberFormat('fa-IR').format(number) + ' تومان';
