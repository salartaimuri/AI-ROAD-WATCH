(() => {
'use strict';
const $=id=>document.getElementById(id), video=$('video'), overlay=$('overlay'), ctx=overlay.getContext('2d');
let stream=null, model=null, running=false, processing=false, watchId=null, facing='environment', audio=false, audioCtx=null, lastInference=0, tracks=[], events=[], lastWarn=0, frame=0, nextTrackId=1;
const vehicles=new Set(['car','truck','bus','motorcycle','bicycle']);
const setText=(id,v)=>{$(id).textContent=v};
const status=s=>setText('camStatus',s);
function logEvent(kind,message){events.unshift({at:new Date().toISOString(),kind,message});events=events.slice(0,100);renderEvents();window.RoadWatchStore?.saveEvent(kind,message)}
function renderEvents(){const list=$('events');list.replaceChildren();for(const e of events.slice(0,25)){const li=document.createElement('li');li.textContent=`${new Date(e.at).toLocaleTimeString()} · ${e.message}`;list.appendChild(li)}}
function alertMessage(msg,red=false){$('alert').textContent=msg;$('alert').classList.toggle('red',red)}
async function loadModel(){if(model)return model;setText('modelStatus','Loading AI model…');if(!window.cocoSsd)throw new Error('AI library unavailable. Check internet connection and reload.');model=await cocoSsd.load({base:'lite_mobilenet_v2'});setText('modelStatus','AI model ready');return model}
function resize(){const w=video.videoWidth,h=video.videoHeight;if(w&&h&&(overlay.width!==w||overlay.height!==h)){overlay.width=w;overlay.height=h}}
async function start(){if(running)return;try{if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera requires HTTPS and a supported browser');stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:720}}});video.srcObject=stream;await video.play();running=true;$('start').disabled=true;$('stop').disabled=false;status('Camera active · loading AI');alertMessage('Monitoring: experimental object detection only');startGPS();try{await loadModel()}catch(e){status('Camera active · AI unavailable');alertMessage(e.message);return}status('Camera active · AI ready');requestAnimationFrame(loop)}catch(e){status('Camera error');alertMessage('Camera: '+e.message);stop()}}
function stop(){running=false;tracks=[];if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}video.srcObject=null;$('start').disabled=false;$('stop').disabled=true;ctx.clearRect(0,0,overlay.width,overlay.height);status('Camera stopped');alertMessage('Monitoring stopped')}
async function loop(t){if(!running)return;requestAnimationFrame(loop);if(processing||!model||t-lastInference<350||video.readyState<2)return;processing=true;lastInference=t;try{resize();const detections=await model.detect(video,15,.38);draw(detections);track(detections)}catch(e){setText('modelStatus','Inference error: '+e.message)}finally{processing=false}}
function draw(ds){ctx.clearRect(0,0,overlay.width,overlay.height);ctx.lineWidth=Math.max(2,overlay.width/450);ctx.font=`${Math.max(15,overlay.width/48)}px sans-serif`;let v=0,s=0,states=[];for(const d of ds){if(vehicles.has(d.class))v++;if(d.class==='traffic light'){s++;const c=signalColor(d.bbox);if(c!=='uncertain')states.push(c)}const [x,y,w,h]=d.bbox;ctx.strokeStyle=d.class==='traffic light'?'#ffd45b':'#44e0b4';ctx.strokeRect(x,y,w,h);ctx.fillStyle=ctx.strokeStyle;ctx.fillText(`${d.class} ${Math.round(d.score*100)}%`,x,Math.max(18,y-5))}setText('vehicles',v);setText('signals',s);setText('signalState',states.length?([...new Set(states)].join(', ')+' (?)'):'Uncertain')}
const sample=document.createElement('canvas');const sc=sample.getContext('2d',{willReadFrequently:true});
function signalColor(box){try{const [x,y,w,h]=box;if(w<7||h<15)return 'uncertain';sample.width=18;sample.height=36;sc.drawImage(video,Math.max(0,x),Math.max(0,y),Math.min(w,video.videoWidth-x),Math.min(h,video.videoHeight-y),0,0,18,36);const p=sc.getImageData(0,0,18,36).data;let r=0,a=0,g=0;for(let i=0;i<p.length;i+=4){const R=p[i],G=p[i+1],B=p[i+2];if(Math.max(R,G,B)<95)continue;if(R>G*1.45&&R>B*1.45)r++;else if(R>110&&G>80&&R>B*1.5&&G>B*1.3&&Math.abs(R-G)<105)a++;else if(G>R*1.35&&G>B*1.2)g++}const top=Math.max(r,a,g);return top<7?'uncertain':top===r?'red':top===a?'amber':'green'}catch{return 'uncertain'}}
function track(ds){
  // Stable IDs with size-normalized distance and intersection-over-union matching.
  // This does NOT compensate for camera motion or establish legal road direction.
  const curr=ds.filter(d=>vehicles.has(d.class)&&d.score>.45).map(d=>({cls:d.class,box:d.bbox,x:d.bbox[0]+d.bbox[2]/2,y:d.bbox[1]+d.bbox[3]/2}));
  const used=new Set(),next=[];
  function iou(a,b){const x=Math.max(a[0],b[0]),y=Math.max(a[1],b[1]),r=Math.min(a[0]+a[2],b[0]+b[2]),bt=Math.min(a[1]+a[3],b[1]+b[3]);const inter=Math.max(0,r-x)*Math.max(0,bt-y);return inter/(a[2]*a[3]+b[2]*b[3]-inter||1)}
  for(const c of curr){let best=-1,score=-Infinity;
    tracks.forEach((p,i)=>{if(used.has(i)||p.cls!==c.cls)return;const distance=Math.hypot(c.x-p.x,c.y-p.y);const scale=Math.max(45,(c.box[2]+p.box[2])/2);if(distance>Math.max(65,scale*1.4))return;const s=iou(c.box,p.box)*2-distance/scale;if(s>score){score=s;best=i}});
    if(best>=0){const prev=tracks[best];used.add(best);const dx=c.x-prev.x,dy=c.y-prev.y;
      const vx=prev.vx*.6+dx*.4,vy=prev.vy*.6+dy*.4;const age=prev.age+1;
      next.push({...c,id:prev.id,vx,vy,age});
      const f=$('flow').value;
      const opposing=(f==='left'&&vx< -12)||(f==='right'&&vx>12)||(f==='up'&&vy>12)||(f==='down'&&vy< -12);
      if(age>=3&&opposing&&Date.now()-lastWarn>12000){lastWarn=Date.now();const msg='Possible opposite SCREEN movement — not a verified wrong-way driver';alertMessage(msg,true);logEvent('motion',msg);beep()}
    }else next.push({...c,id:nextTrackId++,vx:0,vy:0,age:1});
  }
  tracks=next;
}
function beep(){if(!audio)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.connect(gain);gain.connect(audioCtx.destination);osc.frequency.value=740;gain.gain.value=.07;osc.start();osc.stop(audioCtx.currentTime+.2)}catch{}}
function gpsError(e){if(e.code===1&&watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null} const msgs={1:'Location permission denied. Enable Safari location permission in iPhone Settings.',2:'Position unavailable. Try outdoors with a clear sky.',3:'Location timed out. Try again outdoors.'};setText('gpsStatus',msgs[e.code]||e.message||'Location unavailable')}
function startGPS(){if(watchId!==null)return;if(!navigator.geolocation){setText('gpsStatus','Geolocation unavailable in this browser');return}setText('gpsStatus','Requesting GPS permission…');watchId=navigator.geolocation.watchPosition(p=>{const c=p.coords;setText('gpsStatus',`GPS active · accuracy ±${Math.round(c.accuracy)} m · updated ${new Date(p.timestamp).toLocaleTimeString()}`);setText('speed',c.speed==null?'—':(c.speed*3.6).toFixed(1));setText('heading',c.heading==null?'—':Math.round(c.heading));setText('location',`${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`);onGPS(p);window.RoadWatchStore?.onGPS(p);$('openMap').href=`https://www.openstreetmap.org/?mlat=${encodeURIComponent(c.latitude)}&mlon=${encodeURIComponent(c.longitude)}#map=17/${encodeURIComponent(c.latitude)}/${encodeURIComponent(c.longitude)}`},gpsError,{enableHighAccuracy:true,maximumAge:3000,timeout:15000})}
function stopGPS(){roadConsecutive=0;if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null}setText('gpsStatus','GPS stopped');setText('speed','—');setText('heading','—')}
function snapshot(){if(!video.videoWidth){alertMessage('Start the camera before saving a snapshot');return}const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);c.toBlob(b=>{if(!b)return;download(URL.createObjectURL(b),`roadwatch-${Date.now()}.jpg`)},'image/jpeg',.85)}
function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();if(url.startsWith('blob:'))setTimeout(()=>URL.revokeObjectURL(url),30000)}
// Optional, approximate OSM road-direction diagnostics for the PHONE's own travel only.
let roadEnabled=false,roadWays=[],roadFetchAt=0,roadFetchPos=null,roadBusy=false,roadConsecutive=0,roadLastWarn=0,roadRequest=0;
const rad=d=>d*Math.PI/180,deg=r=>(r*180/Math.PI+360)%360;
function meters(a,b){const dy=(a.lat-b.lat)*111195,dx=(a.lon-b.lon)*111195*Math.cos(rad((a.lat+b.lat)/2));return Math.hypot(dx,dy)}
function bearing(a,b){const y=Math.sin(rad(b.lon-a.lon))*Math.cos(rad(b.lat)),x=Math.cos(rad(a.lat))*Math.sin(rad(b.lat))-Math.sin(rad(a.lat))*Math.cos(rad(b.lat))*Math.cos(rad(b.lon-a.lon));return deg(Math.atan2(y,x))}
function diff(a,b){return Math.abs(((a-b+540)%360)-180)}
function segmentDistance(p,a,b){const cos=Math.cos(rad(p.lat)),ax=(a.lon-p.lon)*111195*cos,ay=(a.lat-p.lat)*111195,bx=(b.lon-p.lon)*111195*cos,by=(b.lat-p.lat)*111195;const vx=bx-ax,vy=by-ay,t=Math.max(0,Math.min(1,-(ax*vx+ay*vy)/(vx*vx+vy*vy||1)));return Math.hypot(ax+t*vx,ay+t*vy)}
function roadStatus(s){setText('roadStatus',s)}
function roadReset(){roadConsecutive=0;setText('roadName','—');setText('roadOneway','—');setText('roadBearing','—');setText('roadDistance','—');$('roadAlert').textContent='No map-direction assessment.';$('roadAlert').classList.remove('red')}
function disableRoad(){roadEnabled=false;roadRequest++;roadWays=[];roadFetchPos=null;roadReset();roadStatus('Road lookup off. Your location is not sent to a map server.');$('roadEnable').disabled=false;$('roadRefresh').disabled=true;$('roadDisable').disabled=true}
async function fetchRoads(lat,lon,force=false){if(!roadEnabled||roadBusy)return;const here={lat,lon};if(!force&&roadFetchPos&&meters(here,roadFetchPos)<250&&Date.now()-roadFetchAt<120000)return;
  roadBusy=true;const request=roadRequest;roadStatus('Fetching public OpenStreetMap ways near your position…');
  const q=`[out:json][timeout:12];way(around:220,${lat.toFixed(5)},${lon.toFixed(5)})[highway][highway!~"footway|path|cycleway|steps|pedestrian|construction|proposed"];out geom;`;
  try{const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),16000);
    let response;try{response=await fetch('https://overpass.kumi.systems/api/interpreter',{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'},signal:ctrl.signal})}finally{clearTimeout(timer)}
    if(!response.ok)throw new Error('Map server returned HTTP '+response.status);
    const data=await response.json();if(!roadEnabled||request!==roadRequest)return;
    roadWays=(data.elements||[]).filter(w=>w.type==='way'&&w.geometry?.length>=2).map(w=>({id:w.id,tags:w.tags||{},points:w.geometry.map(p=>({lat:p.lat,lon:p.lon}))}));roadFetchAt=Date.now();roadFetchPos=here;roadStatus(`Loaded ${roadWays.length} nearby road segments · OpenStreetMap community data · ${new Date().toLocaleTimeString()}`);
  }catch(e){if(roadEnabled)roadStatus('Road lookup unavailable: '+e.message+'. GPS and camera remain functional.')}finally{roadBusy=false}
}
function onGPS(p){if(!roadEnabled)return;const c=p.coords,here={lat:c.latitude,lon:c.longitude};
  if(!roadBusy)fetchRoads(here.lat,here.lon);
  let best=null;for(const way of roadWays){for(let i=0;i<way.points.length-1;i++){const a=way.points[i],b=way.points[i+1],distance=segmentDistance(here,a,b);if(!best||distance<best.distance)best={way,a,b,distance}}}
  if(!best){roadReset();return}
  const {way,a,b,distance}=best,tags=way.tags,oneway=tags.oneway==='yes'||tags.oneway==='1'||tags.oneway==='true'||tags.oneway==='-1'||tags.junction==='roundabout';
  const direction=tags.oneway==='-1'?-1:1,allowed=bearing(direction===1?a:b,direction===1?b:a);
  setText('roadName',tags.name||tags.ref||'Unnamed road');setText('roadOneway',oneway?'Mapped one-way':'Not one-way');setText('roadBearing',oneway?Math.round(allowed)+'°':'N/A');setText('roadDistance',Math.round(distance)+' m');
  const speed=c.speed,heading=c.heading,accuracy=c.accuracy;
  if(!oneway||distance>18||accuracy>15||speed==null||speed<3||heading==null||!Number.isFinite(heading)){
    roadConsecutive=0;$('roadAlert').textContent='Insufficient evidence: requires mapped one-way, ≤18 m centerline distance, ≤15 m GPS accuracy, speed ≥11 km/h and heading.';$('roadAlert').classList.remove('red');return;
  }
  const conflict=diff(heading,allowed)>135;
  roadConsecutive=conflict?roadConsecutive+1:0;
  if(conflict&&roadConsecutive>=3){$('roadAlert').textContent='POSSIBLE MAP-DIRECTION CONFLICT for your vehicle — verify road signs safely.';$('roadAlert').classList.add('red');if(Date.now()-roadLastWarn>30000){roadLastWarn=Date.now();logEvent('map-direction','Possible map-direction conflict for own vehicle (unverified)');beep()}}
  else{$('roadAlert').textContent=conflict?'Direction mismatch observed; waiting for repeated GPS updates.':'No map-direction conflict indicated (not a safety guarantee).';$('roadAlert').classList.remove('red')}
}
$('roadEnable').onclick=()=>{roadEnabled=true;$('roadEnable').disabled=true;$('roadRefresh').disabled=false;$('roadDisable').disabled=false;roadStatus('Enabled. Waiting for GPS; approximate coordinates will be sent to a public Overpass server.');startGPS()};
$('roadDisable').onclick=disableRoad;
$('roadRefresh').onclick=()=>{roadFetchAt=0;roadFetchPos=null;roadWays=[];roadReset();roadStatus('Waiting for GPS to fetch nearby roads…')};
$('start').onclick=start;$('stop').onclick=stop;$('switch').onclick=async()=>{facing=facing==='environment'?'user':'environment';if(running){stop();await start()}};$('sound').onclick=()=>{audio=!audio;$('sound').textContent=audio?'🔊 Audio enabled':'🔇 Enable audio';if(audio){audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume()}};$('snapshot').onclick=snapshot;$('gpsTest').onclick=startGPS;$('gpsStop').onclick=stopGPS;$('export').onclick=()=>download(URL.createObjectURL(new Blob([JSON.stringify(events,null,2)],{type:'application/json'})),`roadwatch-events-${Date.now()}.json`);$('clear').onclick=()=>{events=[];renderEvents()};$('openMap').onclick=e=>{if($('openMap').getAttribute('href')==='#')e.preventDefault()};window.addEventListener('pagehide',()=>{stop();stopGPS()});if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();