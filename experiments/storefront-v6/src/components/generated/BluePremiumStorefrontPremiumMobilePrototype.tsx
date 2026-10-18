import React, { useEffect, useRef, useState } from "react";
import "./BluePremiumStorefrontPremiumMobilePrototype.css";
import { useStorefrontLiveData } from "../../lib/use-storefront";
import { PremiumLivePanel, StarsLivePanel, OrdersLivePanel, AccountLivePanel } from "./LivePanels";
type Tab = "home" | "premium" | "stars" | "orders" | "account";
type Product = "premium" | "stars" | "gift" | "digital";
type Glyph = "home" | "shield" | "star" | "orders" | "user" | "wallet" | "arrow" | "chevron" | "close" | "check" | "lock";
function Icon({
  name,
  size = 22
}: {
  name: Glyph;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const
  };
  const paths: Record<Glyph, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M9 21v-8h6v8" /></>,
    shield: <><path d="m12 2 8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z" /><path d="m9 12 2.1 2.1L15.5 10" /></>,
    star: <path d="m12 2 3.1 6.4 7.1 1-5.1 5 .9 7.1-6-3.3-6.1 3.3 1-7.1-5.1-5 7.1-1z" />,
    orders: <><rect x="4" y="4" width="16" height="17" rx="3" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21c.4-4.5 3.2-7 7.5-7s7.1 2.5 7.5 7" /></>,
    wallet: <><path d="M3 8V6c0-1.1 1-2 2-2h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M3 9h18v8H3" /><path d="M16 13h2" /></>,
    arrow: <><path d="m7 17 10-10M9 7h8v8" /></>,
    chevron: <path d="m14 6-6 6 6 6" />,
    close: <path d="M5 5l14 14M19 5 5 19" />,
    check: <path d="m5 12 4.3 4.3L19 7" />,
    lock: <><rect x="5" y="10" width="14" height="12" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>
  };
  return <svg {...common}>{paths[name]}</svg>;
}
function Art({
  kind,
  hero = false
}: {
  kind: Product | "hero";
  hero?: boolean;
}) {
  const id = hero ? "hero" : kind;
  return <svg viewBox="0 0 148 148" className={"bp-art-svg bp-art-" + id} role="img" aria-label={kind === "premium" ? "نشان تلگرام پرمیوم" : kind === "stars" ? "ستاره طلایی" : kind === "gift" ? "جعبه هدیه" : "محصولات دیجیتال"}>
    <defs>
      <radialGradient id={"aura-" + id}><stop stopColor={kind === "stars" ? "#d69e45" : "#7588ff"} stopOpacity=".67" /><stop offset="1" stopColor="#161939" stopOpacity="0" /></radialGradient>
      <linearGradient id={"metal-" + id} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor={kind === "stars" ? "#fff8c8" : kind === "gift" ? "#ffc1e5" : "#e3faff"} />
        <stop offset=".42" stopColor={kind === "stars" ? "#ffc749" : kind === "gift" ? "#c85cae" : "#749dff"} />
        <stop offset="1" stopColor={kind === "stars" ? "#b87308" : kind === "gift" ? "#71309f" : "#6350d1"} />
      </linearGradient>
      <linearGradient id={"edge-" + id} x1="0" y1="0" x2="1" y2="1"><stop stopColor="white" stopOpacity=".9" /><stop offset="1" stopColor="white" stopOpacity=".04" /></linearGradient>
      <filter id={"glow-" + id} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6" /></filter>
      <filter id={"shadow-" + id} x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="10" stdDeviation="6" floodColor="#08091a" floodOpacity=".65" /></filter>
    </defs>
    <circle cx="74" cy="73" r="66" fill={"url(#aura-" + id + ")"} />
    <circle cx="72" cy="72" r="53" fill="none" stroke="#8198ff" strokeOpacity=".18" strokeWidth="1.3" strokeDasharray="5 8" />
    <ellipse cx="73" cy="120" rx="36" ry="8" fill="#86a3ff" opacity=".3" filter={"url(#glow-" + id + ")"} />
    {kind === "stars" || kind === "hero" ? <>
      <path d="M75 20 92 53 127 58 101 84 108 122 74 104 40 121 46 84 20 57 57 53Z" fill={"url(#metal-" + id + ")"} stroke={"url(#edge-" + id + ")"} strokeWidth="3" filter={"url(#shadow-" + id + ")"} />
      <path d="M75 30 89 59 117 63 96 85 101 112 75 98 49 111 54 85 33 64 62 59Z" fill="none" stroke="#fff" strokeOpacity=".34" strokeWidth="1.5" />
      {kind === "hero" && <path d="m58 75 48-25-12 49-13-16-12 13-2-20z" fill="#fff" opacity=".95" />}
    </> : null}
    {kind === "premium" ? <>
      <path d="M74 20c20 16 36 15 43 20v37c0 23-17 37-43 50-26-13-43-27-43-50V40c12-5 27-6 43-20Z" fill={"url(#metal-" + id + ")"} stroke="#e8e6ff" strokeOpacity=".73" strokeWidth="2.5" filter={"url(#shadow-" + id + ")"} />
      <path d="M74 32c18 12 28 12 31 14v32c0 17-12 28-31 38-20-10-31-21-31-38V46c11-4 20-7 31-14Z" fill="#263c88" opacity=".55" />
      <path d="m52 72 45-24-11 48-11-15-13 12-2-19z" fill="#fff" />
      <path d="M74 20c20 16 36 15 43 20" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2" />
    </> : null}
    {kind === "gift" ? <>
      <path d="M37 64h74v54a8 8 0 0 1-8 8H45a8 8 0 0 1-8-8z" fill={"url(#metal-" + id + ")"} stroke="#f3d4ff" strokeWidth="2" filter={"url(#shadow-" + id + ")"} />
      <path d="M27 50a7 7 0 0 1 7-7h80a7 7 0 0 1 7 7v20H27z" fill="#e394d4" stroke="#ffdafa" strokeWidth="2" />
      <path d="M67 45h15v81H67z" fill="#5a43ad" /><path d="M27 56h94" stroke="#f9e5ff" strokeOpacity=".6" />
      <path d="M74 44C52 38 46 18 58 17c10-1 17 11 16 27Zm0 0c22-6 28-26 16-27-10-1-17 11-16 27Z" fill="#b8acff" stroke="#e4e8ff" strokeWidth="2" />
    </> : null}
    {kind === "digital" ? <>
      <rect x="31" y="34" width="68" height="80" rx="15" fill={"url(#metal-" + id + ")"} transform="rotate(-10 65 70)" filter={"url(#shadow-" + id + ")"} />
      <rect x="49" y="44" width="68" height="80" rx="14" fill="#2873bd" stroke="#afeeff" strokeWidth="3" transform="rotate(9 83 84)" />
      <path d="M83 57 88 71 102 76 88 81 83 96 78 81 64 76 78 71z" fill="#efffff" filter={"url(#glow-" + id + ")"} />
      <path d="M83 57 88 71 102 76 88 81 83 96 78 81 64 76 78 71z" fill="#fff" />
    </> : null}
    <path d="M19 33v10M14 38h10M123 31v12M117 37h12M121 113v8M117 117h8" stroke="#d8ddff" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="30" cy="111" r="2.6" fill="#a7c0ff" /><circle cx="120" cy="88" r="2.7" fill="#ffd47c" />
  </svg>;
}
const offers: {
  kind: Product;
  title: string;
  desc: string;
  action: string;
  label: string;
}[] = [{
  kind: "premium",
  title: "تلگرام پرمیوم",
  desc: "اشتراک اختصاصی و امکانات بیشتر",
  action: "مشاهده اشتراک",
  label: "PREMIUM"
}, {
  kind: "stars",
  title: "استارز تلگرام",
  desc: "بسته‌های متنوع استارز تلگرام",
  action: "مشاهده استارز",
  label: "TELEGRAM STARS"
}, {
  kind: "gift",
  title: "هدایای تلگرام",
  desc: "هدیه‌های دیجیتال ویژه دوستان",
  action: "مشاهده هدایا",
  label: "TELEGRAM GIFTS"
}, {
  kind: "digital",
  title: "فروشگاه دیجیتال",
  desc: "گیفت‌کارت و خدمات منتخب",
  action: "مشاهده فروشگاه",
  label: "DIGITAL STORE"
}];
const nav: {
  id: Tab;
  name: string;
  icon: Glyph;
}[] = [{
  id: "home",
  name: "فروشگاه",
  icon: "home"
}, {
  id: "premium",
  name: "پرمیوم",
  icon: "shield"
}, {
  id: "stars",
  name: "استارز",
  icon: "star"
}, {
  id: "orders",
  name: "سفارش‌ها",
  icon: "orders"
}, {
  id: "account",
  name: "حساب من",
  icon: "user"
}];
export const BluePremiumStorefrontPremiumMobilePrototype = () => {
  const [tab, setTab] = useState<Tab>("home");
  const [details, setDetails] = useState<Product | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const remote = useStorefrontLiveData(tab);
  const openExistingCheckout = () => {
    if (remote.live) window.location.assign("/?from=telegram");
  };
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!details) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    modalRef.current?.querySelector<HTMLButtonElement>(".bp-close")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {event.preventDefault();setDetails(null);return;}
      if (event.key !== "Tab") return;
      const buttons=Array.from(modalRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')||[]);
      if (!buttons.length) return;
      if (event.shiftKey && document.activeElement===buttons[0]) {
        event.preventDefault();buttons[buttons.length-1].focus();
      } else if (!event.shiftKey && document.activeElement===buttons[buttons.length-1]){
        event.preventDefault();buttons[0].focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [details]);
  const openOffer = (kind: Product) => {
    setNotice("");
    if (kind === "premium") {
      setTab("premium");
      setSelected(null);
    } else if (kind === "stars") {
      setTab("stars");
      setSelected(null);
    } else setDetails(kind);
  };
  useEffect(()=>{
    const api=window.Telegram?.WebApp;
    if (!api || !remote.live) return;
    api.ready?.();
    api.expand?.();
    const back=api.BackButton;
    if (!back) return;
    const fn=()=>{if(details)setDetails(null);else setTab("home")};
    if (details || tab!=="home") {
      back.show();back.onClick(fn);
      return ()=>{back.offClick(fn);back.hide()};
    }
    back.hide();
  },[details,tab,remote.live]);
  const navigate = (id: Tab) => {
    setTab(id);
    setDetails(null);
    setNotice("");
    setSelected(null);
  };
  const choose = (v: string) => {
    setSelected(v);
    setNotice("این یک پروتوتایپ نمایشی است؛ قیمت‌گذاری و خرید واقعی متصل نیست.");
  };
  return <div className="bp-demo" dir="rtl" lang="fa">
    <div className="bp-demo-frame">
      <div className="bp-demo-banner"><span className="bp-pulse" /> PREVIEW / DESIGN LAB <span className="bp-banner-copy">فقط نمونه تعاملی · پرداخت غیرفعال</span></div>
      <header className="bp-top">
        <div className="bp-identity"><div className="bp-logo"><img src="https://bluepremium.hazhanhasani4268-0f9.workers.dev/brandmark.webp?v=8" alt="لوگوی رسمی بلوپرمیوم" loading="eager" width="54" height="54" /></div><div><strong>سلام، خوش اومدی 👋</strong><span>BLUE PREMIUM</span></div></div>
        <button type="button" className="bp-wallet" onClick={() => navigate("account")}><Icon name="wallet" size={17} /> کیف پول</button>
      </header>
      <main id="bp-demo-main" className="bp-main" key={tab}>
      {tab === "home" && <>
        <section className="bp-hero" aria-label="خدمات بلوپرمیوم"><div className="bp-hero-copy"><span className="bp-eyebrow">PREMIUM DIGITAL SERVICES</span><h1>دنیای سرویس‌های<br /><em>ویژه تلگرام</em></h1><p>خدمات دیجیتال را ساده‌تر انتخاب کن</p><button type="button" onClick={() => openOffer("premium")} className="bp-hero-link">مشاهده سرویس‌ها <Icon name="chevron" size={14} /></button></div><div className="bp-hero-image"><Art kind="hero" hero /></div><span className="bp-hero-sheen" /></section>
        <div className="bp-heading"><div><span className="bp-minor">EXPLORE SERVICES</span><h2>انتخاب سرویس</h2></div><span className="bp-muted-counter">۴ دسته منتخب</span></div>
        <section className="bp-grid" aria-label="سرویس‌ها">{offers.map(offer => <article key={offer.kind} className={"bp-card bp-card-" + offer.kind}><div className="bp-card-art"><Art kind={offer.kind} /></div><div className="bp-card-text"><span className="bp-card-kicker">{offer.label}</span><h3>{offer.title}</h3><p>{offer.desc}</p></div><button type="button" className="bp-card-cta" onClick={() => openOffer(offer.kind)}>{offer.action}<Icon name="chevron" size={16} /></button></article>)}</section>
        <div className="bp-heading bp-heading-secondary"><div><span className="bp-minor">WHY BLUE PREMIUM</span><h2>تجربه‌ای ساده‌تر</h2></div></div>
        <div className="bp-benefits"><span><Icon name="shield" size={18} /> پرداخت ایمن</span><span><Icon name="orders" size={18} /> پیگیری سفارش</span><span><Icon name="check" size={18} /> انتخاب شفاف</span></div>
      </>}
      {tab === "premium" && (remote.live ? <PremiumLivePanel data={remote.plans} onRetry={remote.reload} goToExistingCheckout={openExistingCheckout}/> : <section className="bp-inner"><div className="bp-inner-art premium"><Art kind="premium" /></div><span className="bp-minor">TELEGRAM PREMIUM</span><h2>اشتراک تلگرام پرمیوم</h2><p className="bp-inner-desc">پلن مناسب خودت را انتخاب کن. گزینه‌های زیر فقط برای نمایش طراحی هستند.</p><div className="bp-plan-grid">{["۳ ماهه", "۶ ماهه", "۱۲ ماهه"].map(x => <button className={"bp-plan " + (selected === x ? "is-selected" : "")} key={x} onClick={() => choose(x)}><span>{x}</span><small>نمونه نمایشی</small>{selected === x && <Icon name="check" size={18} />}</button>)}</div><div className="bp-helper" role="status">{notice || "قیمت نهایی باید از API معتبر فروشگاه دریافت شود."}</div><button type="button" className="bp-disabled-buy" disabled><Icon name="lock" size={17} /> خرید در نسخه نمایشی غیرفعال است</button></section>)}
      {tab === "stars" && (remote.live ? <StarsLivePanel data={remote.stars} onRetry={remote.reload} goToExistingCheckout={openExistingCheckout}/> : <section className="bp-inner"><div className="bp-inner-art stars"><Art kind="stars" /></div><span className="bp-minor">TELEGRAM STARS</span><h2>استارز تلگرام</h2><p className="bp-inner-desc">بسته‌های زیر نمایشی‌اند. در نسخه واقعی، موجودی و مبلغ باید از تأمین‌کننده خوانده شود.</p><div className="bp-plan-grid">{["۱۰۰ استارز", "۲۵۰ استارز", "۵۰۰ استارز"].map(x => <button className={"bp-plan " + (selected === x ? "is-selected" : "")} key={x} onClick={() => choose(x)}><span>{x}</span><small>نمونه نمایشی</small>{selected === x && <Icon name="check" size={18} />}</button>)}</div><div className="bp-helper" role="status">{notice || "این صفحه هیچ سفارش واقعی ثبت نمی‌کند."}</div><button type="button" className="bp-disabled-buy" disabled><Icon name="lock" size={17} /> پرداخت غیرفعال</button></section>)}
      {tab === "orders" && (remote.live ? <OrdersLivePanel session={remote.session} reload={remote.reload}/> : <section className="bp-empty-page"><div className="bp-empty-icon"><Icon name="orders" size={40} /></div><span className="bp-minor">ORDER HISTORY</span><h2>سفارش‌های من</h2><p>این نمونه به حساب تلگرام یا تاریخچه سفارش‌ها متصل نیست. در محصول اصلی فقط سفارش‌های احراز هویت‌شده نمایش داده می‌شوند.</p><button className="bp-secondary-btn" onClick={() => navigate("home")}>بازگشت به فروشگاه <Icon name="chevron" size={16} /></button></section>)}
      {tab === "account" && (remote.live ? <AccountLivePanel session={remote.session} reload={remote.reload}/> : <section className="bp-inner bp-account"><div className="bp-account-head"><div className="bp-account-avatar"><Icon name="user" size={32} /></div><div><h2>حساب کاربری</h2><p>نمایش اطلاعات پس از احراز هویت تلگرام</p></div></div><div className="bp-balance"><span>موجودی کیف پول</span><strong>—</strong><small>برای مشاهده موجودی، ورود امن در Mini App اصلی لازم است</small></div><div className="bp-account-links"><div><Icon name="shield" size={20} /> وضعیت حساب <span>نسخه نمایشی</span></div><div><Icon name="orders" size={20} /> سوابق تراکنش <span>بدون اطلاعات واقعی</span></div></div><button className="bp-secondary-btn" onClick={() => navigate("home")}>بازگشت به فروشگاه</button></section>)}
            </main>
      <nav className="bp-nav" aria-label="ناوبری اصلی">{nav.map(item => <button type="button" aria-current={tab === item.id ? "page" : undefined} className={tab === item.id ? "is-active" : ""} key={item.id} onClick={() => navigate(item.id)}><Icon name={item.icon} size={21} /><span>{item.name}</span><span className="bp-nav-indicator" /></button>)}</nav>
      {details && <div className="bp-modal-overlay" role="presentation" onMouseDown={e => {
        if (e.target === e.currentTarget) setDetails(null);
      }}><div ref={modalRef} className="bp-modal" role="dialog" aria-modal="true" aria-labelledby="bp-dialog-title"><div className="bp-modal-top"><div className="bp-modal-art"><Art kind={details} /></div><button aria-label="بستن" className="bp-close" onClick={() => setDetails(null)}><Icon name="close" size={19} /></button></div><span className="bp-minor">SERVICE OVERVIEW</span><h2 id="bp-dialog-title">{details === "gift" ? "هدایای تلگرام" : "فروشگاه دیجیتال"}</h2><p>این بخش برای بررسی تجربه کاربری ساخته شده است. کالاها، موجودی و امکان پرداخت باید پس از اتصال امن به API واقعی فعال شوند.</p><button onClick={() => setDetails(null)} className="bp-secondary-btn bp-wide">متوجه شدم <Icon name="check" size={18} /></button></div></div>}
    </div>
  </div>;
};