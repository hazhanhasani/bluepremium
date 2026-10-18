/**
 * Native BluePremium V6 checkout: one-origin, explicit user gesture, server-authoritative
 * prices and existing production APIs. Never calls provider APIs directly.
 */
import {hasTrustedSameOriginApi, type MarketItem, type PremiumPlan} from './bluepremium-api';

export type MarketKind = 'stars'|'gift'|'catalog';
export type CheckoutPayment = 'blupal'|'wallet';
export type PaymentInstructions = {type:'card_transfer';card_number:string;amount_rial:number};
export type CreatedOrder = {
  code:string;
  status:string;
  title?:string;
  price_toman?:number;
  payment_instructions?:PaymentInstructions | null;
};

export function telegramInitData():string {
  return String(window.Telegram?.WebApp?.initData||'');
}
export function validateUsername(value:string):string {
  const name=value.trim().replace(/^@/,'');
  if(!/^[A-Za-z0-9_]{5,32}$/.test(name))throw Error('invalid_username');
  return name;
}
export function requireTrustedOrigin():void {
  if(!hasTrustedSameOriginApi())throw Error('preview_mode');
  if(location.protocol!=='https:')throw Error('invalid_origin');
}

function errorMessage(code:string):string {
  const messages:Record<string,string>={
    invalid_username:'نام کاربری تلگرام باید بین ۵ تا ۳۲ کاراکتر انگلیسی باشد.',
    invalid_target:'اطلاعات مقصد سفارش معتبر نیست.',
    telegram_auth_required:'برای این خرید، وب‌اپ را داخل ربات تلگرام باز کن.',
    join_required:'ابتدا در کانال‌های الزامی عضو شو و دوباره تلاش کن.',
    account_blocked:'حساب کاربری اجازه ثبت سفارش ندارد.',
    telegram_user_not_found:'حساب تلگرام مقصد پیدا نشد.',
    not_premium_eligible:'این حساب امکان فعال‌سازی پرمیوم ندارد.',
    price_changed:'قیمت تغییر کرده؛ لیست را بروزرسانی و دوباره تأیید کن.',
    price_unavailable:'قیمت معتبر این محصول فعلاً در دسترس نیست.',
    product_unavailable:'محصول انتخاب‌شده در دسترس نیست.',
    plan_unavailable:'پلن انتخاب‌شده در دسترس نیست.',
    insufficient_wallet_balance:'موجودی کیف پول کافی نیست.',
    payment_not_configured:'درگاه پرداخت فعلاً فعال نیست.',
    payment_details_unavailable:'اطلاعات پرداخت از سرویس‌دهنده دریافت نشد.',
    provider_not_configured:'سرویس‌دهنده در دسترس نیست.',
    invoice_create_failed:'ساخت فاکتور موفق نبود. از ثبت مجدد فوری خودداری کن.',
    network_error:'اتصال برقرار نشد. قبل از ثبت دوباره، سفارش‌های خود را بررسی کن.',
    invalid_api_response:'پاسخ سرویس معتبر نبود؛ وضعیت سفارش را بررسی کن.',
    preview_mode:'پرداخت در پیش‌نمایش غیرفعال است.',
  };
  return messages[code]||'ثبت سفارش ناموفق بود؛ وضعیت سفارش‌ها را بررسی کن.';
}
export function humanCheckoutError(code:string):string{return errorMessage(code)}

async function postOrder(path:string,payload:Record<string,unknown>,payment:CheckoutPayment):Promise<CreatedOrder> {
  requireTrustedOrigin();
  if(!['/api/orders','/api/me/wallet/purchase','/api/market/orders'].includes(path))
    throw Error('invalid_request');
  const init=telegramInitData();
  if(payment==='wallet'&&!init)throw Error('telegram_auth_required');
  const headers:Record<string,string>={'content-type':'application/json','accept':'application/json'};
  if(init)headers['X-Telegram-Init-Data']=init;
  let response:Response;
  try{
    response=await fetch(path,{
      method:'POST',headers,body:JSON.stringify(payload),
      cache:'no-store',credentials:'same-origin',redirect:'error'
    });
  }catch{throw Error('network_error')}
  let data:Record<string,unknown>;
  try{
    data=await response.json() as Record<string,unknown>;
  }catch{throw Error('invalid_api_response')}
  if(!response.ok||data.ok!==true) {
    throw Error(typeof data.error==='string'?data.error:'invalid_api_response');
  }
  const raw=(data.order && typeof data.order==='object'?data.order:data) as Record<string,unknown>;
  const code=String(raw.code||'');
  if(!/^BP-[A-Z0-9]{10,24}$/i.test(code))throw Error('invalid_api_response');
  const info=(data.payment_instructions||raw.payment_instructions) as Record<string,unknown>|null|undefined;
  let instructions:PaymentInstructions|null=null;
  if(info&&typeof info==='object'&&/^\d{16}$/.test(String(info.card_number||''))&&
     Number.isSafeInteger(Number(info.amount_rial))&&Number(info.amount_rial)>0) {
     instructions={type:'card_transfer',card_number:String(info.card_number),amount_rial:Number(info.amount_rial)};
  }
  return {code,status:String(raw.status||'processing'),title:String(raw.title||'').slice(0,120),
    price_toman:Number(raw.price_toman)||undefined,payment_instructions:instructions};
}

export async function createPremiumPurchase(plan:PremiumPlan,username:string,payment:CheckoutPayment):Promise<CreatedOrder> {
  const recipient=validateUsername(username);
  if(!Number.isSafeInteger(plan.id)||plan.id<=0||!Number.isSafeInteger(plan.price_toman)||plan.price_toman<=0)
    throw Error('invalid_request');
  if(payment==='wallet')
    return postOrder('/api/me/wallet/purchase',{plan_id:plan.id,username:recipient},payment);
  return postOrder('/api/orders',{plan_id:plan.id,username:recipient,device_id:'web-v6'},payment);
}

export async function createMarketPurchase(product:MarketItem,kind:MarketKind,target:string,payment:CheckoutPayment):Promise<CreatedOrder> {
  const value=target.trim();
  const targetType=String(product.target_type||'username');
  if(targetType!=='none'&&!value)throw Error('invalid_target');
  if(['stars','gift'].includes(kind))validateUsername(value);
  if(!product.sku||!Number.isSafeInteger(product.price_toman)||product.price_toman<=0)
    throw Error('price_unavailable');
  return postOrder('/api/market/orders',{
    kind,sku:product.sku,
    catalog_key:product.catalog_key||null,
    target:targetType==='none'?'':value,
    payment,expected_price_toman:product.price_toman
  },payment);
}

export async function loadMarketCatalog(kind:MarketKind,signal:AbortSignal,query=''):
  Promise<{enabled:boolean;products:MarketItem[]}> {
  requireTrustedOrigin();
  const q=kind==='catalog' ? query.trim().slice(0,55) : '';
  const url='/api/market/catalog?kind='+encodeURIComponent(kind)+(q?'&q='+encodeURIComponent(q):'');
  const response=await fetch(url,{method:'GET',cache:'no-store',credentials:'same-origin',
    redirect:'error',headers:{accept:'application/json'},signal});
  if(!response.ok)throw Error('request_failed');
  const data=await response.json() as Record<string,unknown>;
  if(data.ok!==true||typeof data.enabled!=='boolean'||!Array.isArray(data.products))
    throw Error('invalid_api_response');
  return {enabled:data.enabled,products:data.products.filter((v:unknown):v is MarketItem=>{
    if(!v||typeof v!=='object')return false;
    const p=v as Record<string,unknown>;
    return typeof p.sku==='string'&&typeof p.title==='string'&&
      Number.isSafeInteger(p.price_toman)&&Number(p.price_toman)>0;
  }).slice(0,50)};
}
