import { useState } from 'react';
import { formatToman, type MarketItem, type PremiumPlan, type StoreOrder, type StorefrontSession } from '../../lib/bluepremium-api';
import type { RemoteState } from '../../lib/use-storefront';

function Loading() {return <div className="bp-live-message" role="status">در حال دریافت اطلاعات به‌روز…</div>;}
function Notice({text,onRetry}:{text:string;onRetry?:()=>void}) {
  return <div role="status" className="bp-live-message">{text}{onRetry&&<button className="bp-retry" onClick={onRetry}>تلاش دوباره</button>}</div>;
}
const money=(v:number)=>Number.isFinite(v)?formatToman(v):'نامشخص';
function SafeCheckout({goToExistingCheckout}:{goToExistingCheckout:()=>void}) {
  return <button className="bp-secure-checkout" type="button" onClick={goToExistingCheckout}>
    ادامه در فروشگاه اصلی <span aria-hidden="true">←</span>
  </button>;
}

export function PremiumLivePanel({data,onRetry,goToExistingCheckout}:{data:RemoteState<PremiumPlan[]>;onRetry:()=>void;goToExistingCheckout:()=>void}) {
  const [selection,setSelection]=useState<number|null>(null);
  const selected=data.status==='ready'?data.value.find(p=>p.id===selection):undefined;
  return <section className="bp-inner bp-live" aria-label="پلن‌های تلگرام پرمیوم">
    <span className="bp-minor">TELEGRAM PREMIUM</span><h2>تلگرام پرمیوم</h2>
    <p className="bp-inner-desc">قیمت و اعتبار هر پلن مستقیماً از فروشگاه دریافت می‌شود.</p>
    {data.status==='loading'||data.status==='idle'?<Loading/>:
      data.status==='error'?<Notice text={data.error} onRetry={onRetry}/>:
      !data.value.length?<Notice text="در حال حاضر پلن فعالی برای فروش موجود نیست."/>:
      <div className="bp-live-products">{data.value.map(p=><button type="button" aria-pressed={selection===p.id} className={"bp-live-product "+(selection===p.id?"selected":"")} key={p.id} onClick={()=>setSelection(p.id)}>
        <strong>{p.title || p.months+' ماهه'}</strong><span>{money(p.price_toman)}</span>
      </button>)}</div>}
    {selected&&<div className="bp-helper" role="status">پلن {selected.months} ماهه با قیمت {money(selected.price_toman)} انتخاب شد. خرید امن در صفحه اصلی تکمیل می‌شود و نیاز به انتخاب مجدد دارد.</div>}
    {data.status==='ready'&&data.value.length>0&&<SafeCheckout goToExistingCheckout={goToExistingCheckout}/>}
  </section>;
}

export function StarsLivePanel({data,onRetry,goToExistingCheckout}:{data:RemoteState<{enabled:boolean;products:MarketItem[]}>;onRetry:()=>void;goToExistingCheckout:()=>void}) {
  const [selection,setSelection]=useState<string|null>(null);
  const selected=data.status==='ready'?data.value.products.find(p=>p.sku===selection):undefined;
  return <section className="bp-inner bp-live" aria-label="بسته‌های استارز تلگرام">
    <span className="bp-minor">TELEGRAM STARS</span><h2>استارز تلگرام</h2>
    <p className="bp-inner-desc">بسته‌های فعال با قیمت معتبر نمایش داده می‌شوند.</p>
    {data.status==='loading'||data.status==='idle'?<Loading/>:
      data.status==='error'?<Notice text={data.error} onRetry={onRetry}/>:
      !data.value.enabled?<Notice text="فروش استارز فعلاً توسط مدیریت غیرفعال است."/>:
      !data.value.products.length?<Notice text="محصول قیمت‌گذاری‌شده‌ای در دسترس نیست."/>:
      <div className="bp-live-products">{data.value.products.map(p=><button type="button" aria-pressed={selection===p.sku} className={"bp-live-product "+(selection===p.sku?"selected":"")} key={p.sku} onClick={()=>setSelection(p.sku)}>
        <strong>{p.title}</strong><span>{money(p.price_toman)}</span>
      </button>)}</div>}
    {selected&&<div className="bp-helper" role="status">{selected.title} انتخاب شد. قیمت هنگام ثبت سفارش اصلی مجدداً بررسی می‌شود؛ لازم است در فروشگاه اصلی دوباره انتخابش کنی.</div>}
    {data.status==='ready'&&data.value.enabled&&data.value.products.length>0&&<SafeCheckout goToExistingCheckout={goToExistingCheckout}/>}
  </section>;
}

function StatusMessage({session,reload}:{session:StorefrontSession;reload:()=>void}) {
  switch(session.state){
    case 'loading':return <Loading/>;
    case 'guest':return <Notice text="برای مشاهده اطلاعات خود، مینی‌اپ را از داخل ربات تلگرام باز کن."/>;
    case 'join_required':return <Notice text="برای دسترسی به کیف پول و سفارش‌ها، ابتدا عضویت کانال‌های الزامی را از داخل ربات تأیید کن." onRetry={reload}/>;
    case 'error':return <Notice text={session.error||'اطلاعات حساب در دسترس نیست.'} onRetry={reload}/>;
    default:return null;
  }
}

export function AccountLivePanel({session,reload}:{session:StorefrontSession;reload:()=>void}) {
  const user=session.state==='member'?session.user:null;
  return <section className="bp-inner bp-account bp-live">
    <div className="bp-account-head"><div className="bp-account-avatar" aria-hidden="true">◈</div><div><h2>حساب کاربری</h2><p>{user?.display_name || 'اطلاعات تأییدشده تلگرام'}</p></div></div>
    {!user?<StatusMessage session={session} reload={reload}/>:<>
      <div className="bp-balance"><span>موجودی تأییدشده کیف پول</span><strong>{money(user.balance_toman)}</strong><small>مبلغ از حساب متصل به تلگرام خوانده شده است.</small></div>
      <div className="bp-account-links"><div>زیرمجموعه‌های ثبت‌شده <span>{new Intl.NumberFormat('fa-IR').format(user.referral_count||0)}</span></div></div>
      <h3 className="bp-subheading">آخرین تراکنش‌ها</h3>
      {!user.transactions?.length?<Notice text="هنوز تراکنشی در حساب ثبت نشده است."/>:
        <div className="bp-live-list">{user.transactions.slice(0,10).map((t,i)=><div key={t.id||i} className="bp-live-row"><div>{t.reason||'تراکنش'}</div><strong>{money(t.delta_toman)}</strong></div>)}</div>}
      <button type="button" onClick={reload} className="bp-secondary-btn bp-wide">بروزرسانی کیف پول</button>
    </>}
  </section>;
}
export function OrdersLivePanel({session,reload}:{session:StorefrontSession;reload:()=>void}) {
  const user=session.state==='member'?session.user:null;
  const rows:StoreOrder[]=user?[...(user.orders||[]),...session.marketOrders].sort((a,b)=>Date.parse(b.created_at||'')-Date.parse(a.created_at||'')).slice(0,40):[];
  return <section className="bp-inner bp-live">
    <span className="bp-minor">ORDER HISTORY</span><h2>سفارش‌های من</h2>
    <p className="bp-inner-desc">فقط سفارش‌های احراز هویت‌شده همین حساب نمایش داده می‌شوند.</p>
    {!user?<StatusMessage session={session} reload={reload}/>:
      !rows.length?<Notice text="هنوز سفارشی برای حساب تو ثبت نشده است."/>:
      <div className="bp-live-list">{rows.map((item,i)=><div className="bp-live-row" key={item.order_code||item.code||i}>
        <div><strong>{item.title|| (item.months?item.months+' ماه پرمیوم':item.kind||'سفارش')}</strong><small>{item.status||'در حال بررسی'}</small></div>
        <span>{money(item.price_toman)}</span>
      </div>)}</div>}
    {user&&<button type="button" className="bp-secondary-btn bp-wide" onClick={reload}>بروزرسانی سفارش‌ها</button>}
  </section>;
}
