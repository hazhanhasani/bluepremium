import React,{useEffect,useRef,useState} from 'react';
import {formatToman,type MarketItem,type PremiumPlan} from '../../lib/bluepremium-api';
import {createMarketPurchase,createPremiumPurchase,humanCheckoutError,loadMarketCatalog,
  telegramInitData,type MarketKind,type CheckoutPayment,type CreatedOrder} from '../../lib/native-checkout';

type Choice = {type:'premium';plan:PremiumPlan}|{type:'market';product:MarketItem;kind:MarketKind};
export function NativePurchase({choice,resetPrices}:{choice:Choice;resetPrices:()=>void}) {
  const [target,setTarget]=useState('');
  const [payment,setPayment]=useState<CheckoutPayment>('blupal');
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');
  const [order,setOrder]=useState<CreatedOrder|null>(null);
  const locked=useRef(false);
  const product=choice.type==='market'?choice.product:null;
  const targetType=choice.type==='premium'?'username':String(product?.target_type||'username');
  const requiresTarget=targetType!=='none';
  const label=choice.type==='premium'?'نام کاربری تلگرام مقصد':
    targetType==='link'?'لینک مقصد':targetType==='player'?'شناسه بازیکن':
    targetType==='ton_wallet'?'آدرس کیف پول TON':
    targetType==='steam_login'?'حساب Steam':'نام کاربری تلگرام مقصد';
  const price=choice.type==='premium'?choice.plan.price_toman:choice.product.price_toman;
  const title=choice.type==='premium'?(choice.plan.title||choice.plan.months+' ماهه'):choice.product.title;
  const canUseWallet=Boolean(telegramInitData());
  const submit=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(locked.current||order)return;
    locked.current=true;setPending(true);setError('');
    try{
      const created=choice.type==='premium'
        ?await createPremiumPurchase(choice.plan,target,payment)
        :await createMarketPurchase(choice.product,choice.kind,target,payment);
      setOrder(created);
    }catch(e){
      const code=e instanceof Error?e.message:'request_failed';
      setError(humanCheckoutError(code));
      if(['price_changed','price_unavailable','plan_unavailable'].includes(code))resetPrices();
    }finally{setPending(false);locked.current=false}
  };
  const copy=async(value:string)=>{try{await navigator.clipboard.writeText(value)}catch{setError('کپی خودکار ممکن نشد؛ متن را دستی انتخاب کن.')}};
  return <section className="bp-native-checkout" aria-label="ثبت سفارش امن V6">
    <div className="bp-native-header"><span>ثبت سفارش در بلوپرمیوم</span><strong>{title}</strong></div>
    <div className="bp-native-price"><span>قیمت اعلام‌شده فروشگاه</span><strong>{formatToman(price)}</strong></div>
    {order? <div role="status" className="bp-native-success">
      <h3>سفارش دریافت شد</h3>
      <p>شماره سفارش: <b dir="ltr">{order.code}</b></p>
      <p>وضعیت: {order.status==='awaiting_payment'?'در انتظار پرداخت':order.status==='delivered'?'تحویل داده شده':'در حال بررسی'}</p>
      {order.payment_instructions
        ? <div className="bp-native-bank">
          <p>اطلاعات پرداخت این فاکتور</p>
          <label>شماره کارت مقصد</label>
          <div className="bp-native-copy"><b dir="ltr">{order.payment_instructions.card_number.replace(/(\d{4})(?=\d)/g,'$1 ')}</b><button type="button" onClick={()=>copy(order.payment_instructions!.card_number)}>کپی</button></div>
          <label>مبلغ دقیق قابل پرداخت</label>
          <div className="bp-native-copy"><b>{new Intl.NumberFormat('fa-IR').format(order.payment_instructions.amount_rial)} ریال</b><button type="button" onClick={()=>copy(String(order.payment_instructions!.amount_rial))}>کپی</button></div>
          <p className="bp-native-warning">فقط مبلغ دقیق همین فاکتور را واریز کن. برای پیگیری، شماره سفارش را نگه دار.</p>
        </div>
        : <p>برای مشاهده وضعیت نهایی به «سفارش‌ها» مراجعه کن. اگر درگاه خطا داد، سفارش تکراری نساز.</p>}
    </div>: <form onSubmit={submit} className="bp-native-form">
      {requiresTarget&&<label>{label}<input aria-label={label} value={target} onChange={e=>setTarget(e.target.value)}
        placeholder={targetType==='username'?'username':targetType==='link'?'https://...':'اطلاعات مقصد'}
        maxLength={targetType==='username'?33:160} autoCapitalize="off" autoCorrect="off" autoComplete="off" required dir="ltr"/></label>}
      <div className="bp-native-payment" role="group" aria-label="روش پرداخت">
        <button type="button" aria-pressed={payment==='blupal'} onClick={()=>setPayment('blupal')} disabled={pending}>اطلاعات کارت</button>
        <button type="button" aria-pressed={payment==='wallet'} onClick={()=>setPayment('wallet')} disabled={pending||!canUseWallet}>کیف پول</button>
      </div>
      {!canUseWallet&&<small className="bp-native-muted">خرید با کیف پول فقط داخل مینی‌اپ تلگرام فعال است.</small>}
      {error&&<p role="alert" className="bp-native-error">{error}</p>}
      <button type="submit" className="bp-native-submit" disabled={pending}>{pending?'در حال بررسی قیمت و ثبت سفارش…':'تأیید و ثبت سفارش'}</button>
      <small className="bp-native-muted">با تأیید این دکمه، سفارش واقعی ثبت می‌شود. مبلغ نهایی توسط سرور دوباره بررسی خواهد شد.</small>
    </form>}
  </section>;
}

export function CatalogLivePanel({kind,onBack}:{kind:'gift'|'catalog';onBack:()=>void}) {
  const [query,setQuery]=useState('');
  const [refresh,setRefresh]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(false);
  const [enabled,setEnabled]=useState(false);
  const [products,setProducts]=useState<MarketItem[]>([]);
  const [selected,setSelected]=useState<MarketItem|null>(null);
  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true);setError(false);setSelected(null);
    void loadMarketCatalog(kind,controller.signal,query).then(data=>{
      setProducts(data.products);setEnabled(data.enabled);setLoading(false);
    }).catch(()=>{if(!controller.signal.aborted){setError(true);setLoading(false)}});
    return ()=>controller.abort();
  },[kind,refresh,query]);
  return <section className="bp-inner bp-live" aria-label="فروشگاه دیجیتال V6">
    <button type="button" className="bp-native-back" onClick={onBack}>بازگشت به فروشگاه</button>
    <span className="bp-minor">BLUE PREMIUM STORE</span>
    <h2>{kind==='gift'?'هدایای تلگرام':'محصولات دیجیتال'}</h2>
    {kind==='catalog'&&<input aria-label="جستجوی محصولات" className="bp-native-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجوی برند یا محصول" maxLength={55}/>}
    {loading?<p role="status">در حال دریافت قیمت‌های معتبر…</p>:
      error?<div role="alert">دریافت محصولات ممکن نشد. <button type="button" className="bp-retry" onClick={()=>setRefresh(v=>v+1)}>تلاش دوباره</button></div>:
      !enabled?<p role="status">این بخش فعلاً توسط مدیریت غیرفعال است.</p>:
      !products.length?<p role="status">محصول قابل‌فروشی پیدا نشد.</p>:
      <div className="bp-live-products">{products.map(item=><button type="button" key={item.sku}
        aria-pressed={selected?.sku===item.sku} className={'bp-live-product '+(selected?.sku===item.sku?'selected':'')} onClick={()=>setSelected(item)}>
        <strong>{item.title}</strong><span>{formatToman(item.price_toman)}</span>
      </button>)}</div>}
    {selected&&<NativePurchase key={kind+selected.sku} choice={{type:'market',kind,product:selected}} resetPrices={()=>setRefresh(n=>n+1)}/>}
  </section>;
}
