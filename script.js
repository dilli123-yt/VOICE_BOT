const recognition = new webkitSpeechRecognition();
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.continuous = false;

let recordedText = "";
let audioContext, analyser, microphone, animationId;

// START LISTENING
async function startListening() {
  recordedText = "";

  document.getElementById("micUI").classList.remove("hidden");
  document.getElementById("statusText").innerText = "🎧 Listening…";

  recognition.start();

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  microphone = audioContext.createMediaStreamSource(stream);
  microphone.connect(analyser);

  drawWave();
}

// CAPTURE SPEECH
recognition.onresult = e => {
  recordedText = e.results[0][0].transcript;
};

// CANCEL
function cancelListening() {
  recognition.stop();
  recordedText = "";
  stopWave();
  document.getElementById("micUI").classList.add("hidden");
  document.getElementById("statusText").innerText = "Click Speak and start talking";
}

// OK
function confirmListening() {
  recognition.stop();
  stopWave();
  document.getElementById("micUI").classList.add("hidden");

  if (recordedText.trim()) handleUserQuestion(recordedText);
}

// SEND TEXT
function sendText() {
  const input = document.getElementById("textInput");
  if (!input.value.trim()) return;
  handleUserQuestion(input.value.trim());
  input.value = "";
}

// BACKEND CALL
async function handleUserQuestion(text) {
  document.getElementById("userText").innerText = text;

  const res = await fetch("http://localhost:3000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  });

  const data = await res.json();
  speak(data.reply);
}

// VOICE + WORD HIGHLIGHT
function speak(text) {
  speechSynthesis.cancel();
  const ai = document.getElementById("aiText");

  const words = text.match(/\S+\s*/g) || [];
  ai.innerHTML = words.map(w => `<span>${w}</span>`).join("");

  const spans = ai.querySelectorAll("span");
  const u = new SpeechSynthesisUtterance(text);
  u.pitch = 0.85;
  u.rate = 0.95;

  let count = 0;
  const pos = words.map(w => (count += w.length) - w.length);

  u.onboundary = e => {
    if (e.name === "word") {
      spans.forEach(s => s.classList.remove("current-word"));
      spans[pos.findIndex((p,i)=>e.charIndex>=p && (!pos[i+1]||e.charIndex<pos[i+1]))]
        ?.classList.add("current-word");
    }
  };

  speechSynthesis.speak(u);
}

// REAL WAVE
function drawWave() {
  const canvas = document.getElementById("waveCanvas");
  const ctx = canvas.getContext("2d");
  const data = new Uint8Array(analyser.frequencyBinCount);

  function draw() {
    animationId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(data);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    data.forEach((v,i)=>{
      const h = v/3;
      ctx.fillStyle="#6366f1";
      ctx.fillRect(i*2, canvas.height-h, 1.5, h);
    });
  }
  draw();
}

function stopWave() {
  if (animationId) cancelAnimationFrame(animationId);
  if (audioContext) audioContext.close();
}
