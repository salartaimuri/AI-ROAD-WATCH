'use strict';
const $extra=id=>document.getElementById(id);
let lastFix=null, snapshots=[], signalStates=new Map(), lastSignalEvent=0;
function updateLocationExtras(p){lastFix={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy};const a=$extra('location');if(a)a.textContent=`${lastFix.lat.toFixed(5)}, ${lastFix.lon.toFixed(5)} (±${Math.round(lastFix.accuracy)}m)`;const link=$extra('openMap');if(link)link.href=`https://www.openstreetmap.org/?mlat=${lastFix.lat}&mlon=${lastFix.lon}#map=17/${lastFix.lat}/${lastFix.lon}`;}
function signalAnalysis(detections, video){const lights=detections.filter(d=>d.class==='traffic light'&&d.score>.48);let best={state:'unknown',confidence:0};for(const d of lights){const r=estimateSignalColor(video,d.bbox);if(r.confidence>best.confidence)best=r;}
 const out=$extra('signalState');if(out)out.textContent=best.state==='unknown'?'Uncertain':best.state.toUpperCase()+' (experimental)';
 if(best.state!=='unknown'&&best.confidence>.24&&Date.now()-lastSignalEvent>10000){lastSignalEvent=Date.now();if(typeof eventLog==='function')eventLog('Signal estimate',`${best.state} — visual estimate only`)}
}
function takeSnapshot(){const v=$extra('video');if(!v||v.readyState<2){alert('Start the camera first.');return;}const c=document.createElement('canvas');c.width=Math.min(960,v.videoWidth);c.height=Math.round(c.width*v.videoWidth**-1*v.videoHeight);c.getContext('2d').drawImage(v,0,0,c.width,c.height);const a=document.createElement('a');a.download='roadwatch-snapshot-'+new Date().toISOString().replaceAll(':','-')+'.jpg';a.href=c.toDataURL('image/jpeg',.82);a.click();if(typeof eventLog==='function')eventLog('Snapshot','User saved a camera frame locally');}
function wireExtras(){const snap=$extra('snapshot');if(snap)snap.onclick=takeSnapshot;const map=$extra('openMap');if(map)map.onclick=e=>{if(!lastFix){e.preventDefault();alert('Wait for a GPS fix after starting the camera.');}};if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});}
window.addEventListener('DOMContentLoaded',wireExtras);
