'use strict';
// Experimental signal color estimator. Only analyzes the top portion of an object-detection box.
function estimateSignalColor(source, bbox) {
  const [x,y,w,h]=bbox;
  if(w<5||h<9)return {state:'unknown',confidence:0};
  const c=document.createElement('canvas');c.width=32;c.height=64;
  const g=c.getContext('2d',{willReadFrequently:true});
  try {g.drawImage(source,Math.max(0,x),Math.max(0,y),Math.max(1,w),Math.max(1,h),0,0,32,64);}catch{return {state:'unknown',confidence:0};}
  const data=g.getImageData(0,0,32,64).data, votes={red:0,amber:0,green:0};
  for(let i=0;i<data.length;i+=4){const r=data[i],gr=data[i+1],b=data[i+2],max=Math.max(r,gr,b),min=Math.min(r,gr,b);if(max<85||max-min<48)continue;
    if(r>gr*1.35&&r>b*1.45)votes.red++;
    else if(r>125&&gr>70&&r>gr*1.08&&gr>b*1.45)votes.amber++;
    else if(gr>r*1.25&&gr>b*1.15)votes.green++;
  }
  const ordered=Object.entries(votes).sort((a,b)=>b[1]-a[1]);const [state,count]=ordered[0];
  if(count<12||count<ordered[1][1]*1.8)return {state:'unknown',confidence:0};
  return {state,confidence:Math.min(1,count/100)};
}
