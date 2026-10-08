import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const part=async n=>readFile(new URL('../src/parts/'+String(n).padStart(3,'0')+'.part',import.meta.url),'utf8');
const bot=await part(17),membership=await part(18);

function fakeUpdate(overrides={}){
  const events=[],verified=Boolean(overrides.verified);
  const api=async(_token,method,payload)=>{
    events.push({type:'api',method,payload});
    return {ok:true,result:true};
  };
  const gate=async(_env,chat,who)=>{
    events.push({type:'gate',chat,user:who?.id,verified});
    if(!verified)events.push({type:'join_prompt'});
    return verified;
  };
  const mainKeyboard=async()=>{events.push({type:'main_keyboard'});return {inline_keyboard:[[{text:'buy',callback_data:'buy'}]]}};
  const send=async(_env,_chat,text,extra={})=>{
    events.push({type:'message',text,extra});
    return {ok:true};
  };
  // Execute only these two functions, with deterministic fake implementations.
  const section=bot.slice(bot.indexOf('async function telegramWelcomeAfterJoin('));
  const fn=new Function(
    'getSetting','getProviderSecret','ensureTelegramBotPresentation','telegramBotApi',
    'telegramSessionClear','bpRegister','bpBotGate','telegramSendMessage','telegramMainKeyboard',
    section+';return handleTelegramBotUpdate;');
  const handler=fn(
    async(_db,k)=>k==='telegram_bot_enabled'?'1':'',
    async()=> '123456789:abcdefghijklmnopqrstuvwxyzABCDEFG12345',
    async()=>{},
    api,
    async()=>{events.push({type:'clear_session'})},
    async()=>{events.push({type:'register'})},
    gate,
    send,
    mainKeyboard
  );
  const env={DB:{}},origin='https://example.workers.dev';
  return {events,run:update=>handler(env,update,origin,null)};
}
const user={id:123456789,first_name:'Guest',username:'guest_test'};

test('/start hides full menu and welcome until membership verified',async()=>{
  const t=fakeUpdate({verified:false});
  await t.run({message:{chat:{id:123456789},from:user,text:'/start'}});
  assert.equal(t.events.filter(x=>x.type==='main_keyboard').length,0);
  assert.equal(t.events.filter(x=>x.type==='message').length,0);
  assert.equal(t.events.filter(x=>x.type==='join_prompt').length,1);
  assert.equal(t.events.filter(x=>x.type==='gate').length,1);
});

test('/start referral does not bypass join gate',async()=>{
  const t=fakeUpdate({verified:false});
  await t.run({message:{chat:{id:123456789},from:user,text:'/start ref_1234567890'}});
  assert.equal(t.events.filter(x=>x.type==='main_keyboard').length,0);
  assert.equal(t.events.filter(x=>x.type==='join_prompt').length,1);
});

test('/start displays menu only after membership check succeeds',async()=>{
  const t=fakeUpdate({verified:true});
  await t.run({message:{chat:{id:123456789},from:user,text:'/start'}});
  const gate=t.events.findIndex(x=>x.type==='gate');
  const keyboard=t.events.findIndex(x=>x.type==='main_keyboard');
  const welcome=t.events.find(x=>x.type==='message');
  assert.ok(gate!==-1&&keyboard>gate);
  assert.match(welcome.text,/عضویت شما تأیید شد/);
  assert.equal(welcome.extra.reply_markup.inline_keyboard[0][0].callback_data,'buy');
});

test('verify join button denies unauthorised users without showing menu',async()=>{
  const t=fakeUpdate({verified:false});
  await t.run({callback_query:{id:'c1',data:'bp_verify_join',from:user,message:{chat:{id:123456789},message_id:41}}});
  assert.equal(t.events.filter(x=>x.type==='message').length,0);
  assert.equal(t.events.filter(x=>x.type==='main_keyboard').length,0);
  assert.equal(t.events.filter(x=>x.type==='join_prompt').length,1);
});

test('verify join success retires prompt and then displays menu',async()=>{
  const t=fakeUpdate({verified:true});
  await t.run({callback_query:{id:'c2',data:'bp_verify_join',from:user,message:{chat:{id:123456789},message_id:41}}});
  assert.ok(t.events.some(x=>x.method==='editMessageReplyMarkup'&&x.payload.message_id===41));
  assert.equal(t.events.filter(x=>x.type==='main_keyboard').length,1);
  assert.equal(t.events.filter(x=>x.type==='message').length,1);
});

test('old main menu buttons cannot bypass membership and are retired',async()=>{
  const t=fakeUpdate({verified:false});
  await t.run({callback_query:{id:'c3',data:'buy',from:user,message:{chat:{id:123456789},message_id:23}}});
  assert.equal(t.events.filter(x=>x.type==='main_keyboard').length,0);
  assert.equal(t.events.filter(x=>x.type==='message').length,0);
  assert.ok(t.events.some(x=>x.method==='editMessageReplyMarkup'&&x.payload.message_id===23));
});

test('channel verification fails closed for missing, left and API errors',async()=>{
  const membershipCode=membership.slice(membership.indexOf('async function bpMissingChannels('),
    membership.indexOf('function bpPrice('));
  const channels=[{id:1,chat_id:'@channel_test',title:'Announcement',invite_url:'https://t.me/channel_test'}];
  async function verify(status,is_member,ok=true){
    const missing=new Function('getProviderSecret','telegramBotApi',membershipCode+';return bpMissingChannels;')(
      async()=> '123456789:abcdefghijklmnopqrstuvwxyzABCDEFG12345',
      async()=>({ok,result:{status,is_member}})
    );
    const env={DB:{prepare:()=>({all:async()=>({results:channels})})}};
    return missing(env,'123456789');
  }
  assert.equal((await verify('left',false)).length,1);
  assert.equal((await verify('kicked',false)).length,1);
  assert.equal((await verify('restricted',false)).length,1);
  assert.equal((await verify('member',false,false)).length,1);
  assert.equal((await verify('member',true)).length,0);
  assert.equal((await verify('restricted',true)).length,0);
});
