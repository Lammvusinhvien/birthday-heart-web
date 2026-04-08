const music=document.getElementById("bgMusic");

const intro=document.getElementById("intro");
const video=document.getElementById("video");
const end=document.getElementById("end");

const toVideo=document.getElementById("toVideo");
const backIntro=document.getElementById("backIntro");
const toEnd=document.getElementById("toEnd");
const backHome=document.getElementById("backHome");

let started=false;

function show(screen){
  [intro,video,end].forEach(s=>s.classList.remove("active"));
  screen.classList.add("active");
}

function fadeOut(ms=300){
  const step=music.volume/(ms/30);
  const i=setInterval(()=>{
    music.volume=Math.max(0,music.volume-step);
    if(music.volume<=0){
      clearInterval(i);
      music.pause();
    }
  },30);
}

function fadeIn(ms=300){
  music.volume=0;
  music.play();
  const step=1/(ms/30);
  const i=setInterval(()=>{
    music.volume=Math.min(1,music.volume+step);
    if(music.volume>=1) clearInterval(i);
  },30);
}

document.addEventListener("click",()=>{
  if(!started){
    music.play();
    started=true;
  }
},{once:true});

toVideo.onclick=()=>{
  fadeOut(300);
  show(video);
};

backIntro.onclick=()=>{
  show(intro);
  fadeIn(300);
};

toEnd.onclick=()=>{
  show(end);
};

backHome.onclick=()=>{
  show(intro);
  fadeIn(300);
};