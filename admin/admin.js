const $=id=>document.getElementById(id);
const API="/api/content";

async function load(){
  try{const r=await fetch(API,{cache:"no-store"});if(!r.ok)throw 0;return await r.json();}
  catch(e){return{:"",wednesdayName:"",announcement:{enabled:false,type:"normal",text:""}};}
}

async function save(data){
  await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
}

function render(data){
  $("sundayName").value=data.sundayName||"";
  $("wednesdayName").value=data.wednesdayName||"";
  $("sundaySaved").textContent=data.sundayName?"Saved for both Sunday services":"";
  $("wednesdaySaved").textContent=data.wednesdayName?"Saved for the upcoming Wednesday service":"";
  $("announcementText").value=data.announcement?.text||"";
  $("announcementState").textContent=data.announcement?.enabled?"Published":"Hidden";
  $("previewSunday").textContent=data.sundayName||"Sunday First Service";
  $("previewSunday2").textContent=data.sundayName||"Sunday Second Service";
  $("previewWednesday").textContent=data.wednesdayName||"Wednesday Service";
  $("previewAnnouncement").hidden=!data.announcement?.enabled;
  $("previewAnnouncement").textContent=data.announcement?.text||"";
  document.querySelectorAll(".type").forEach(b=>b.classList.toggle("active",b.dataset.type===(data.announcement?.type||"normal")));
}

let currentType="normal";
let currentData=await load();
render(currentData);

document.querySelectorAll(".type").forEach(b=>b.addEventListener("click",()=>{
  currentType=b.dataset.type;
  document.querySelectorAll(".type").forEach(x=>x.classList.toggle("active",x===b));
}));

$("sundayForm").addEventListener("submit",async e=>{
  e.preventDefault();
  currentData.sundayName=$("sundayName").value.trim();
  await save(currentData);
  render(currentData);
  $("sundaySaved").textContent="Saved ✓";
});

$("wednesdayForm").addEventListener="submit",async e=>{
  e.preventDefault();
  currentData.wednesdayName=$("wednesdayName").value.trim();
  await save(currentData);
  render(currentData);
  $("wednesdaySaved").textContent="Saved ✓";
});

$("publish").addEventListener("click",async()=>{
  currentData.announcement={enabled:true,type:currentType,text:$("announcementText").value.trim()};
  await save(currentData);
  render(currentData);
  $("announcementSaved").textContent="Announcement published ✓";
});

$("hide").addEventListener("click",async()=>{
  currentData.announcement={enabled:false,type:currentType,text:$("announcementText").value.trim()};
  await save(currentData);
  render(currentData);
  $("announcementSaved").textContent="Announcement hidden ✓";
});
