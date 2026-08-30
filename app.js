const AURON_API="https://auron-api.otd1nwtsmzu1-unmarked357.workers.dev";
const $=id=>document.getElementById(id);
const address=$("address"),query=$("query"),homePage=$("homePage"),browser=$("browser"),frame=$("frame"),notice=$("notice"),status=$("status"),apiPanel=$("apiPanel"),apiTitle=$("apiTitle"),apiResult=$("apiResult"),external=$("external");

let historyStack=[];
let historyIndex=-1;
let currentUrl="";

function normalize(value){
  const v=value.trim();
  if(!v)return null;
  if(/^https?:\/\//i.test(v))return v;
  if(/^[\w.-]+\.[a-z]{2,}(?::\d+)?(?:\/.*)?$/i.test(v))return "https://"+v;
  return "https://www.google.com/search?q="+encodeURIComponent(v);
}

function showHome(){
  browser.classList.add("hidden");
  homePage.classList.remove("hidden");
  external.classList.add("hidden");
  status.textContent="Auron bereit";
  address.value="";
}

function openPage(raw,save=true){
  const u=normalize(raw);
  if(!u)return;
  if(save){
    historyStack=historyStack.slice(0,historyIndex+1);
    historyStack.push(u);
    historyIndex++;
  }
  currentUrl=u;
  address.value=u;
  homePage.classList.add("hidden");
  browser.classList.remove("hidden");
  external.classList.remove("hidden");
  notice.classList.remove("hidden");
  notice.textContent="Auron lädt "+u;
  frame.src=u;
  status.textContent=u;
  localStorage.setItem("auron.last",u);
}

async function api(path){
  const response=await fetch(AURON_API+path);
  const data=await response.json();
  if(!response.ok||data.ok===false)throw new Error(data.error||"Auron API Fehler");
  return data;
}

function pretty(value){
  return JSON.stringify(value,null,2);
}

async function runAuronCommand(raw){
  const v=raw.trim();
  if(!v)return false;
  const parts=v.split(/\s+/);
  const command=parts[0].toLowerCase();
  let data;

  if(command==="weather"||command==="wetter"){
    const city=v.replace(/^\S+\s*/,"").trim();
    if(!city)throw new Error("Bitte einen Ort angeben.");
    data=await api("/api/weather?city="+encodeURIComponent(city));
    apiTitle.textContent="Auron Wetter · "+city;
    apiResult.textContent=pretty(data);
  }else if(command==="wiki"||command==="wikipedia"){
    const q=v.replace(/^\S+\s*/,"").trim();
    if(!q)throw new Error("Bitte einen Suchbegriff angeben.");
    data=await api("/api/wikipedia?q="+encodeURIComponent(q));
    apiTitle.textContent="Auron Wikipedia · "+q;
    apiResult.textContent=(data.title?data.title+"\n\n":"")+(data.extract||"Keine Zusammenfassung gefunden.")+(data.url?"\n\n"+data.url:"");
  }else if(command==="github"){
    const q=v.replace(/^github\s*/i,"").trim();
    if(!q)throw new Error("Bitte einen GitHub-Suchbegriff angeben.");
    data=await api("/api/github?q="+encodeURIComponent(q));
    apiTitle.textContent="Auron GitHub · "+q;
    apiResult.textContent=(data.results||[]).map((r,i)=>
      (i+1)+". "+r.name+"\n★ "+r.stars+(r.language?" · "+r.language:"")+"\n"+(r.description||"Keine Beschreibung")+"\n"+r.url
    ).join("\n\n")||"Keine Repositories gefunden.";
  }else if(command==="country"||command==="land"){
    const q=v.replace(/^\S+\s*/,"").trim();
    if(!q)throw new Error("Bitte ein Land angeben.");
    data=await api("/api/country?q="+encodeURIComponent(q));
    apiTitle.textContent="Auron Länder · "+q;
    apiResult.textContent=pretty(data.results||[]);
  }else if(command==="convert"||command==="currency"||command==="währung"){
    const m=v.match(/^\S+\s+([0-9]+(?:\.[0-9]+)?)\s+([A-Za-z]{3})\s+([A-Za-z]{3})$/);
    if(!m)throw new Error("Format: convert 100 EUR USD");
    data=await api("/api/currency?from="+m[2]+"&to="+m[3]+"&amount="+m[1]);
    apiTitle.textContent="Auron Währung";
    apiResult.textContent=m[1]+" "+m[2].toUpperCase()+" = "+data.result+" "+m[3].toUpperCase()+"\nKurs: "+data.rate+"\nDatum: "+(data.date||"—");
  }else{
    return false;
  }

  apiPanel.classList.remove("hidden");
  homePage.classList.remove("hidden");
  browser.classList.add("hidden");
  status.textContent="Auron API · "+apiTitle.textContent;
  return true;
}

$("nav").onsubmit=async e=>{
  e.preventDefault();
  try{
    if(await runAuronCommand(address.value))return;
    openPage(address.value);
  }catch(err){
    apiPanel.classList.remove("hidden");
    apiTitle.textContent="Auron API Fehler";
    apiResult.textContent=err.message;
    status.textContent="Auron API Fehler";
  }
};

$("search").onsubmit=async e=>{
  e.preventDefault();
  try{
    if(await runAuronCommand(query.value))return;
    openPage(query.value);
  }catch(err){
    apiPanel.classList.remove("hidden");
    apiTitle.textContent="Auron API Fehler";
    apiResult.textContent=err.message;
    status.textContent="Auron API Fehler";
  }
};

$("back").onclick=()=>{
  if(historyIndex>0){
    historyIndex--;
    openPage(historyStack[historyIndex],false);
  }
};

$("forward").onclick=()=>{
  if(historyIndex<historyStack.length-1){
    historyIndex++;
    openPage(historyStack[historyIndex],false);
  }
};

$("reload").onclick=()=>{
  if(browser.classList.contains("hidden"))return;
  frame.src=currentUrl;
};

$("home").onclick=showHome;
$("new").onclick=showHome;

$("menu").onclick=()=>{
  alert("Auron Browser\n\nAuron API: online\nVersion: 1.0\n\nBefehle:\nweather Berlin\nwiki Deutschland\ngithub chromium\ncountry Germany\nconvert 100 EUR USD");
};

external.onclick=()=>{
  if(currentUrl)window.open(currentUrl,"_blank","noopener,noreferrer");
};

frame.onload=()=>{
  notice.classList.add("hidden");
  status.textContent=address.value||"Auron bereit";
};

frame.onerror=()=>{
  notice.classList.remove("hidden");
  notice.textContent="Diese Website konnte nicht eingebettet werden. Du kannst sie mit „Extern öffnen“ aufrufen.";
};

document.querySelectorAll("[data-command]").forEach(button=>{
  button.onclick=async()=>{
    query.value=button.dataset.command;
    try{
      await runAuronCommand(button.dataset.command);
    }catch(err){
      apiPanel.classList.remove("hidden");
      apiTitle.textContent="Auron API Fehler";
      apiResult.textContent=err.message;
    }
  };
});

const last=localStorage.getItem("auron.last");
if(last)status.textContent="Auron bereit · letzte Seite gespeichert";
