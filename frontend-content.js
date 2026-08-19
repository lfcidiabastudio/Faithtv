window.FAITHTVContent=(function(){
  let _data={sundayName:"",wednesdayName:"",announcement:{enabled:false,type:"normal",text:""}};
  const $=id=>document.getElementById(id);

  async function fetchContent(){
    try{
      const r=await fetch("/api/content",{cache:"no-store"});
      if(!r.ok)throw 0;
      _data=await r.json();
      applyAnnouncement();
    }catch(e){}
  }

  function applyAnnouncement(){
    const box=$("announcementBanner");
    if(!box)return;
    const a=_data.announcement;
    if(!a||!a.enabled||!a.text){box.hidden=true;return;}
    box.hidden=false;
    box.dataset.type=a.type||"normal";
    const typeEl=$("announcementType");
    if(typeEl)typeEl.textContent=a.type==="important"?"IMPORTANT":"NOTICE";
    const textEl=$("announcementText");
    if(textEl)textEl.textContent=a.text;
    box.classList.toggle("important",a.type==="important");
  }

  function getSundayName(){return _data.sundayName||"";}
  function getWednesdayName(){return _data.wednesdayName||"";}
  function get(){return _data;}

  fetchContent();
  setInterval(fetchContent,10000);

  return{getSundayName,getWednesdayName,get,applyAnnouncement};
})();
