const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

function resize(){
  const dpr = Math.min(window.devicePixelRatio || 1,2);
  canvas.width = window.innerWidth*dpr;
  canvas.height = window.innerHeight*dpr;
  canvas.style.width = window.innerWidth+"px";
  canvas.style.height = window.innerHeight+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
resize();
window.addEventListener("resize",resize);

const count = /Mobi|Android/i.test(navigator.userAgent)?1000:1800;

let particles=[];
let scale=1;

function heart(t){
  const x=16*Math.pow(Math.sin(t),3);
  const y=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));
  return{x,y};
}

for(let i=0;i<count;i++){
  const t=(i/count)*Math.PI*2;
  const pos=heart(t);
  particles.push({tx:pos.x,ty:pos.y,x:0,y:0});
}

function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  scale=1+Math.sin(Date.now()*0.006)*0.04;
  ctx.save();
  ctx.translate(canvas.width/2,canvas.height/2);
  ctx.scale(scale,scale);

  particles.forEach(p=>{
    const x=p.tx*15;
    const y=p.ty*15;
    const g=ctx.createRadialGradient(x,y,0,x,y,20);
    g.addColorStop(0,"#ff8ad4");
    g.addColorStop(1,"rgba(255,0,120,0)");
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.arc(x,y,20,0,Math.PI*2);
    ctx.fill();
  });

  ctx.restore();
  requestAnimationFrame(animate);
}
animate();