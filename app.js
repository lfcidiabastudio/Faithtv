const SERVICES=[
 {day:0,start:[7,0],end:[9,0],title:"Sunday First Service",label:"First Service",time:"7:00 AM",endTime:"9:00 AM"},
 {day:0,start:[9,0],end:[12,30],title:"Sunday Second Service",label:"Second Service",time:"9:00 AM",endTime:"12:30 PM"},
 {day:3,start:[17,0],end:[19,0],title:"Wednesday Service",label:"Wednesday Service",time:"5:00 PM",endTime:"7:00 PM"}
];
const TZ="Africa/Lagos", CFG=window.FAITH_CONFIG||{}, $=id=>document.getElementById(id);
const SPOTIFY=CFG.SPOTIFY_URL||"https://open.spotify.com/show/3rQSg1gCTou5qL3T68jc6q";
let audio=null,isPlaying=false,streamLive=false,deferredPrompt=null,notifiedKey=null,healthTimer=null,lastState="";

function parts(d=new Date()){
 const a=new Intl.DateTimeFormat("en-US",{timeZone:TZ,weekday:"short",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).formatToParts(d),o={};
 a.forEach(x=>o[x.type]=x.value);
 return {year:+o.year,month:+o.month,day:+o.day,hour:+o.hour,minute:+o.minute,second:+o.second,weekday:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(o.weekday)};
}
function lagosDate(y,m,d,h,min=0){return new Date(Date.UTC(y,m-1,d,h-1,min,0))}
function dateLabel(d){return new Intl.DateTimeFormat("en-US",{timeZone:TZ,weekday:"long",month:"long",day:"numeric",year:"numeric"}).format(d)}
function shortDate(d){return new Intl.DateTimeFormat("en-US",{timeZone:TZ,weekday:"short",month:"short",day:"numeric"}).format(d)}
function timeLabel(d){return new Intl.DateTimeFormat("en-NG",{timeZone:TZ,hour:"numeric",minute:"2-digit",hour12:true}).format(d)}
function buildServiceDate(base,s){return {start:lagosDate(base.year,base.month,base.day,s.start[0],s.start[1]),end:lagosDate(base.year,base.month,base.day,s.end[0],s.end[1])}}
function currentService(now){
 const p=parts(now);
 for(const s of SERVICES){if(s.day!==p.weekday)continue;const d=buildServiceDate(p,s);if(now>=d.start&&now<d.end)return {...s,...d};}
 return null;
}
function justEndedService(now){
 const p=parts(now);
 for(const s of SERVICES){if(s.day!==p.weekday)continue;const d=buildServiceDate(p,s);const mins=(now-d.end)/60000;if(mins>=0&&mins<20)return {...s,...d,endedMinutes:Math.floor(mins)};}
 return null;
}
function nextService(now){
 const p=parts(now),base=new Date(Date.UTC(p.year,p.month-1,p.day)),a=[];
 for(const s of SERVICES){let delta=(s.day-p.weekday+7)%7;const today=lagosDate(p.year,p.month,p.day,s.start[0],s.start[1]);if(delta===0&&now>=today)delta=7;const d=new Date(base);d.setUTCDate(d.getUTCDate()+delta);const b={year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate()};const x=buildServiceDate(b,s);a.push({...s,...x});}
 a.sort((x,y)=>x.start-y.start);return a[0];
}
function demoState(now){
 const mode=new URLSearchParams(location.search).get("preview");
 if(mode==="live"){const p=parts(now),s=SERVICES[0],d=buildServiceDate(p,s);return {...s,...d};}
 return null;
}
function countdown(ms){
 let n=Math.max(0,Math.floor(ms/1000));const d=Math.floor(n/86400);n%=86400;const h=Math.floor(n/3600);n%=3600;const m=Math.floor(n/60),s=n%60;
 $("days").textContent=String(d).padStart(2,"0");$("hours").textContent=String(h).padStart(2,"0");$("minutes").textContent=String(m).padStart(2,"0");$("seconds").textContent=String(s).padStart(2,"0");
}
function setBodyState(state){document.body.classList.remove("is-live","is-starting","is-ended","is-upcoming");document.body.classList.add("state-"+state);if(state==="live")document.body.classList.add("is-live");if(state==="starting")document.body.classList.add("is-starting");if(state==="ended")document.body.classList.add("is-ended");if(state==="upcoming")document.body.classList.add("is-upcoming");}
function setHealth(type,text){const el=$("streamHealth");if(!el)return;el.className="stream-health "+type;const dot=el.querySelector("i");if(dot)dot.className="";$("streamHealthText").textContent=text;}
function setHeaderState(live){const el=$("status");if(el){el.className=live?"live-state live":"live-state";el.innerHTML=`<i></i><span>${live?"Live now":"Offline"}</span>`;}const badge=document.querySelector(".card-live-badge");if(badge){badge.classList.toggle("live",live);const t=$("cardLiveText");if(t)t.textContent=live?"LIVE NOW":"OFFLINE";}const hl=$("headerListenText");if(hl){hl.textContent=live?"Listen now":"Offline";hl.closest(".header-live-center").classList.toggle("offline",!live);}const hd=$("headerListenTextDesktop");if(hd){hd.textContent=live?"Listen now":"Offline";hd.closest(".header-live").classList.toggle("offline",!live);}}
function setButton(enabled,label="Listen now"){$("playerButton").disabled=!enabled;$("playText").textContent=label;$("playIcon").textContent=enabled?(isPlaying?"Ⅱ":"▶"):"○";}
function commonHero(s,label,date,sub){$("heroLabel").textContent=label;$("heroTitle").textContent=s.title;$("heroDate").textContent=date;$("heroService").textContent=sub;$("playerTitle").textContent=s.day===0?"Miracle Banquet Service":s.title;$("ngClock").textContent=new Intl.DateTimeFormat("en-NG",{timeZone:TZ,hour:"2-digit",minute:"2-digit"}).format(new Date());}
function setLive(s){
 setBodyState("live");setHeaderState(true);commonHero(s,"WE'RE LIVE",`${timeLabel(s.start)} – ${timeLabel(s.end)}`,`${s.label} · On air now`);
 $("earlyCopy").textContent="Tap below to listen to the service.";$("countdown").classList.add("hidden");$("calendarButton").style.display="none";$("notifyButton").style.display="none";
  $("playerState").textContent="LIVE AUDIO";$("playerDescription").textContent="Tap below to listen to the service.";$("pulse").classList.add("live");$("nowPlaying").classList.add("visible");$("nowPlayingText").textContent="FaithTV Live Service";
  $("listenerText").textContent=CFG.LISTENERS_URL?"Checking people listening…":"People are listening · live count unavailable";$("listenerBox").classList.toggle("available",false);
 setButton(true,isPlaying?"Pause":"Listen now");setHealth(CFG.STREAM_URL?"ready":"unconfigured",CFG.STREAM_URL?"Ready to connect to FaithTV live audio":"Live audio endpoint not connected yet");
 $("miniTitle").textContent="LIVE · "+s.title;$("miniSubtitle").textContent=`${timeLabel(s.start)} – ${timeLabel(s.end)}`;$("miniLiveDot").classList.add("on");
}
function setStarting(s,now){
 setBodyState("starting");setHeaderState(false);commonHero(s,"STARTING SOON",dateLabel(s.start),`${s.label} · ${s.time}`);
 const mins=Math.max(1,Math.ceil((s.start-now)/60000));$("earlyCopy").textContent=`Starting in ${mins} minute${mins===1?"":"s"}. Get ready to listen.`;$("countdown").classList.remove("hidden");countdown(s.start-now);$("calendarButton").style.display="inline-block";$("notifyButton").style.display="inline-block";
 $("playerState").textContent="STARTING SOON";$("playerDescription").textContent="The service is about to begin.";$("pulse").classList.remove("live");$("nowPlaying").classList.remove("visible");setButton(false,"Get ready to listen");setHealth("ready","Service starts soon");$("miniLiveDot").classList.remove("on");$("miniTitle").textContent="FaithTV";$("miniSubtitle").textContent=`Next: ${s.label} · ${s.time}`;maybeNotify(s,mins);
}
function setUpcoming(s,now){
 setBodyState("upcoming");setHeaderState(false);commonHero(s,"YOU'RE EARLY. WE'LL BE LIVE SOON.",dateLabel(s.start),`${s.label} · ${s.time}`);
 $("earlyCopy").textContent="Prepare your heart. Invite someone to listen with you.";$("countdown").classList.remove("hidden");countdown(s.start-now);$("calendarButton").style.display="inline-block";$("notifyButton").style.display="inline-block";
 $("playerState").textContent="NEXT BROADCAST";$("playerDescription").textContent=`Live church audio · ${s.time}`;$("pulse").classList.remove("live");$("nowPlaying").classList.remove("visible");setButton(false,"Listen when live");setHealth("ready","Waiting for the next service");$("miniLiveDot").classList.remove("on");$("miniTitle").textContent="FaithTV";$("miniSubtitle").textContent=`Next: ${s.label} · ${s.time}`;
}
function setEnded(s,now){
 setBodyState("ended");setHeaderState(false);commonHero(s,"SERVICE HAS ENDED",`${timeLabel(s.start)} – ${timeLabel(s.end)}`,`${s.label} · Ended ${s.endedMinutes} min ago`);
 $("earlyCopy").textContent="Thank you for worshipping with us. The next live service is shown below.";$("countdown").classList.add("hidden");$("calendarButton").style.display="none";$("notifyButton").style.display="none";
 $("playerState").textContent="MESSAGE AVAILABLE";$("playerDescription").textContent="Catch the message on Spotify.";$("pulse").classList.remove("live");$("nowPlaying").classList.remove("visible");setButton(false,"Service has ended");setHealth("ready","Live audio is offline");$("listenerText").textContent="Service ended · next live service below";$("miniLiveDot").classList.remove("on");$("miniTitle").textContent="FaithTV";$("miniSubtitle").textContent=`Next: ${nextService(now).label} · ${nextService(now).time}`;
}
function render(){
 const now=new Date();let active=demoState(now);let ended=null;if(!active)active=currentService(now);if(!active)ended=justEndedService(now);
 if(active){setLive(active)}else if(streamLive){setLive(nextService(now))}else if(ended){setEnded(ended,now)}else{const n=nextService(now);const mins=(n.start-now)/60000;if(mins>0&&mins<=10)setStarting(n,now);else setUpcoming(n,now);}
 $("year").textContent=new Date().getFullYear();updateWhatsapp(active||(streamLive?nextService(new Date()):null));updateScheduleHighlight(active,ended);if(lastState!==document.body.className){lastState=document.body.className;}
}
function updateScheduleHighlight(active,ended){document.querySelectorAll(".service-row").forEach((row,i)=>row.classList.remove("current","next"));if(active){const i=SERVICES.findIndex(x=>x.title===active.title);if(i>=0)document.querySelectorAll(".service-row")[i]?.classList.add("current");}else{const n=nextService(new Date());const i=SERVICES.findIndex(x=>x.title===n.title);if(i>=0)document.querySelectorAll(".service-row")[i]?.classList.add("next");}}
function updateWhatsapp(active){const n=active||nextService(new Date());const text=active?`🔴 FaithTV is LIVE now — ${active.title}. Join the service online: ${location.href}`:`Join FaithTV for ${n.title} — ${dateLabel(n.start)} at ${n.time}. Listen: ${location.href}`;$("whatsappButton").href="https://wa.me/?text="+encodeURIComponent(text);}

/* AUDIO */
function createAudio(){
 if(!CFG.STREAM_URL){setHealth("unconfigured","Live audio endpoint not connected yet");return null}if(audio)return audio;
 audio=new Audio();audio.preload="none";audio.crossOrigin="anonymous";audio.src=CFG.STREAM_URL;audio.volume=Number($("volume").value);
 audio.addEventListener("playing",()=>{isPlaying=true;setHeaderState(true);setButton(true,"Pause");$("miniPlayer").classList.add("visible");$("miniPlayer").classList.add("playing");setHealth("connected","Stream connected · Live audio playing")});
 audio.addEventListener("pause",()=>{isPlaying=false;setButton(!!currentService(new Date()),currentService(new Date())?"Listen now":"Listen when live");setHealth("paused","Audio paused");$("miniPlayer").classList.remove("playing");if(!currentService(new Date()))setHeaderState(false)});
 audio.addEventListener("waiting",()=>setHealth("buffering","Connection unstable · buffering…"));
 audio.addEventListener("stalled",()=>{setHealth("unstable","Connection unstable · reconnecting…");scheduleReconnect()});
 audio.addEventListener("error",()=>{isPlaying=false;setButton(!!currentService(new Date()),"Listen now");setHealth("error","Stream unavailable · reconnecting shortly…");if(!currentService(new Date()))setHeaderState(false);scheduleReconnect()});
 return audio;
}
function toggleAudio(){const a=createAudio();if(!a)return;if(a.paused){setHealth("connecting","Connecting to FaithTV live audio…");a.play().catch(()=>setHealth("error","Could not start stream · tap Listen again"));}else a.pause();}
function scheduleReconnect(){if(!CFG.STREAM_URL)return;setTimeout(()=>{if(audio&&!isPlaying){try{audio.load();audio.play().catch(()=>{})}catch(e){}}},Number(CFG.RECONNECT_MS||5000));}
$("playerButton").addEventListener("click",toggleAudio);$("miniPlay").addEventListener("click",toggleAudio);$("volume").addEventListener("input",e=>{if(audio)audio.volume=Number(e.target.value);$("miniVolume").value=e.target.value});$("miniVolume").addEventListener("input",e=>{const v=Number(e.target.value);$("volume").value=v;if(audio)audio.volume=v});$("miniClose").addEventListener("click",()=>$('miniPlayer').classList.remove('visible'));
function startListening(){if(!streamLive&&!currentService(new Date()))return;const a=createAudio();if(a&&a.paused)toggleAudio();else if(a)$("miniPlayer").classList.add("visible");}
document.querySelectorAll(".header-live,.mobile-menu a[href='#listen']").forEach(el=>el.addEventListener("click",startListening));

/* REAL BACKEND STATUS */
async function pollBackend(){
 if(CFG.STREAM_STATUS_URL){try{const r=await fetch(CFG.STREAM_STATUS_URL,{cache:"no-store"});if(!r.ok)throw Error();const d=await r.json();const src=d&&d.icestats&&d.icestats.source;const iceLive=!!(src&&typeof src==="object");const live=typeof d.live==="boolean"?d.live:iceLive;const isPreview=!!new URLSearchParams(location.search).get("preview");if(live){streamLive=true;setHeaderState(true);if(currentService(new Date()))setHealth("connected","Live stream confirmed");if(d.title)updateNowPlaying(d.title,d.artist||"FaithTV Live")}else{streamLive=false;if(!currentService(new Date())&&!isPlaying&&!isPreview)setHeaderState(false);if(currentService(new Date()))setHealth("error","Scheduled: LIVE · Stream: OFFLINE — we'll reconnect shortly.")}const srcArr=Array.isArray(src)?src:[src];const srcObj=srcArr.find(s=>s&&Number.isFinite(Number(s.listeners)));if(srcObj)setListeners(Number(srcObj.listeners));}catch(e){if(currentService(new Date()))setHealth("error","Unable to verify stream status")}}
 if(CFG.LISTENERS_URL){try{const r=await fetch(CFG.LISTENERS_URL,{cache:"no-store"});if(!r.ok)throw Error();const d=await r.json();if(Number.isFinite(Number(d.listeners)))setListeners(Number(d.listeners))}catch(e){}}
 if(CFG.NOW_PLAYING_URL){try{const r=await fetch(CFG.NOW_PLAYING_URL,{cache:"no-store"});const d=await r.json();if(d.title)updateNowPlaying(d.title,d.artist||"FaithTV Live")}catch(e){}}
}
function setListeners(n){$("listenerText").textContent=`${n.toLocaleString()} ${n===1?"person":"persons"} listening now`;$("listenerBox").classList.add("available");$("listenerBox").setAttribute("aria-label",`${n.toLocaleString()} ${n===1?"person":"persons"} listening now`);}
function updateNowPlaying(title,artist){$("nowPlayingText").textContent=artist?`${title} · ${artist}`:title;}
if(CFG.POLL_MS)healthTimer=setInterval(pollBackend,Number(CFG.POLL_MS));pollBackend();

/* CALENDAR / NOTIFICATIONS / SHARE */
async function requestNotifications(){if(!("Notification"in window)){alert("Your browser does not support notifications.");return}const p=await Notification.requestPermission();$("notifyButton").textContent=p==="granted"?"Notifications enabled ✓":"Enable notifications";}
$("notifyButton").addEventListener("click",requestNotifications);
function maybeNotify(service,mins){if(!('Notification'in window)||Notification.permission!=="granted")return;const key=service.start.toISOString();if(notifiedKey===key)return;notifiedKey=key;new Notification("FaithTV service starts soon",{body:`${service.label} starts in ${mins} minute${mins===1?"":"s"} · ${service.time}`});}
function calendarUrl(s){const start=s.start.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z"),end=s.end.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("FaithTV — "+s.title)}&dates=${start}/${end}&details=${encodeURIComponent("Listen live at "+location.href)}&location=${encodeURIComponent("FaithTV Online")}`;}
$("calendarButton").addEventListener("click",()=>window.open(calendarUrl(nextService(new Date())),"_blank","noopener"));
$("shareButton").addEventListener("click",async()=>{const s=currentService(new Date())||nextService(new Date());const text=currentService(new Date())?`🔴 FaithTV is LIVE — ${s.title}. Join the service: ${location.href}`:`Join FaithTV — ${s.title}, ${dateLabel(s.start)} at ${s.time}. Listen: ${location.href}`;try{if(navigator.share)await navigator.share({title:"FaithTV — "+s.title,text,url:location.href});else{await navigator.clipboard.writeText(text);$("shareButton").textContent="Link copied ✓"}}catch(e){}});

/* PWA */
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installButton").hidden=false;$("mobileInstall").hidden=false;$("installSectionButton").style.display="inline-flex"});
async function installPwa(){if(!deferredPrompt){location.href="./install.html";return}deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installButton").hidden=true;$("mobileInstall").hidden=true;}
$("installButton").addEventListener("click",installPwa);$("mobileInstall").addEventListener("click",installPwa);$("installSectionButton").addEventListener("click",installPwa);

/* MOBILE NAV */
const menu=$("menu"),drawer=$("mobileMenu");const openDrawer=v=>{drawer.classList.toggle("open",v);menu.setAttribute("aria-expanded",String(v));};menu.addEventListener("click",()=>openDrawer(!drawer.classList.contains("open")));$("menuBackdrop").addEventListener("click",()=>openDrawer(false));$("menuClose").addEventListener("click",()=>openDrawer(false));drawer.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>openDrawer(false)));

/* THEME */
const themeToggle=$("themeToggle"),themeMeta=document.querySelector('meta[name="theme-color"]');if(themeToggle){themeToggle.checked=document.documentElement.classList.contains("dark");themeToggle.addEventListener("change",()=>{const dark=themeToggle.checked;document.documentElement.classList.toggle("dark",dark);try{localStorage.setItem("faithtv-theme",dark?"dark":"light")}catch(e){}if(themeMeta)themeMeta.setAttribute("content",dark?"#121110":"#f5f3ef");});}

/* REVEAL */
const observer=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add("visible")),{threshold:.08});document.querySelectorAll(".reveal").forEach(e=>observer.observe(e));
if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("reduce-motion");
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
render();setInterval(render,1000);

/* SCRIPTURE CAROUSEL (auto-repeat, swipeable) */
(function(){
  const track=$("scriptureTrack"),viewport=$("scriptureViewport");
  if(!track||!viewport)return;
  const n=track.children.length;
  if(n<2)return;
  track.appendChild(track.children[0].cloneNode(true));
  const total=n+1;
  let idx=0,timer=null,dragX=null,dragDX=0;
  const restart=()=>{if(timer)clearInterval(timer);timer=setInterval(()=>step(1),6000);};
  const setPos=(i,anim)=>{track.classList.toggle("no-anim",!anim);track.style.transform=`translateX(-${i*100}%)`;};
  const go=i=>{idx=((i%n)+n)%n;setPos(idx,true);restart();};
  const step=dir=>{
    if(idx===0&&dir<0){
      setPos(total-1,false);void track.offsetWidth;idx=n-1;setPos(idx,true);
    }else if(idx===n-1&&dir>0){
      setPos(total-1,true);const done=()=>{if(track.style.transform!==`translateX(-${total-1}00%)`)return;setPos(0,false);idx=0;track.removeEventListener("transitionend",done);};
      track.addEventListener("transitionend",done);
    }else{go(idx+dir);}
    restart();
  };
  viewport.addEventListener("pointerdown",e=>{dragX=e.clientX;dragDX=0;track.style.transition="none";if(timer)clearInterval(timer);viewport.setPointerCapture(e.pointerId);});
  viewport.addEventListener("pointermove",e=>{if(dragX===null)return;dragDX=e.clientX-dragX;track.style.transform=`translateX(calc(${-idx*100}% + ${dragDX}px))`;});
  const up=()=>{if(dragX===null)return;const v=viewport.clientWidth||1;track.style.transition="";dragX=null;if(dragDX<-v/5)step(1);else if(dragDX>v/5)step(-1);else go(idx);};
  viewport.addEventListener("pointerup",up);
  viewport.addEventListener("pointercancel",up);
  restart();
})();
