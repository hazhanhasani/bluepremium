import { useEffect, useState } from 'react';
import {
  hasTrustedSameOriginApi, loadMember, loadPlans, loadStars,
  type MarketItem, type PremiumPlan, type StorefrontSession,
} from './bluepremium-api';

export type RemoteState<T> =
  | { status: 'idle' | 'loading'; value: null; error: '' }
  | { status: 'ready'; value: T; error: '' }
  | { status: 'error'; value: null; error: string };

const pending = <T,>(): RemoteState<T> => ({status:'loading',value:null,error:''});
const idle = <T,>(): RemoteState<T> => ({status:'idle',value:null,error:''});

export function useStorefrontLiveData(tab: string) {
  const live = hasTrustedSameOriginApi();
  const [plans,setPlans] = useState<RemoteState<PremiumPlan[]>>(()=>idle());
  const [stars,setStars] = useState<RemoteState<{enabled:boolean;products:MarketItem[]}>>(()=>idle());
  const [session,setSession] = useState<StorefrontSession>({state:'guest',user:null,marketOrders:[]});
  const [refresh,setRefresh] = useState(0);
  const reload = () => setRefresh(n => n+1);

  useEffect(() => {
    if (!live) return;
    const controller = new AbortController();
    let mounted=true;
    const isRelevant = (tab==='premium'||tab==='stars'||tab==='account'||tab==='orders');
    if (!isRelevant) return () => controller.abort();
    if(tab==='premium') {
      setPlans(pending());
      void loadPlans(controller.signal)
        .then(value => {if(mounted)setPlans({status:'ready',value,error:''})})
        .catch(() => {if(mounted&&!controller.signal.aborted)setPlans({status:'error',value:null,error:'دریافت پلن‌ها ممکن نشد.'})});
    }
    if(tab==='stars') {
      setStars(pending());
      void loadStars(controller.signal)
        .then(value => {if(mounted)setStars({status:'ready',value,error:''})})
        .catch(() => {if(mounted&&!controller.signal.aborted)setStars({status:'error',value:null,error:'دریافت بسته‌های استارز ممکن نشد.'})});
    }
    if(tab==='account'||tab==='orders') {
      setSession({state:'loading',user:null,marketOrders:[]});
      void loadMember(controller.signal)
        .then(value=>{if(mounted)setSession(value)})
        .catch(()=>{if(mounted&&!controller.signal.aborted)setSession({state:'error',user:null,marketOrders:[],error:'دریافت اطلاعات حساب ممکن نشد.'})});
    }
    return ()=>{mounted=false;controller.abort()};
  },[live,tab,refresh]);

  return {live,plans,stars,session,reload};
}
