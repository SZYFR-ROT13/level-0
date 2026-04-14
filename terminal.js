// TERMINAL ENGINE

const terminal = document.getElementById("terminal");
const hiddenInput = document.getElementById("hiddenInput");

// 🔥 BOOT SCREEN
let booted = false;

function showBootScreen(startCallback) {
  terminal.innerHTML = `
    <div style="text-align:center; margin-top:20vh;">
      <div>SYSTEM INITIALIZING...</div>
      <br>
      <div>PRESS ANY KEY TO START</div>
    </div>
  `;

  function start() {
    if (booted) return;
    booted = true;

    unlockAudio();

    terminal.innerHTML = "";

    document.removeEventListener("keydown", start);
    document.removeEventListener("click", start);

    if (startCallback) startCallback();
  }

  document.addEventListener("keydown", start);
  document.addEventListener("click", start);
}

let input = "";
let inputActive = false;
let isTyping = false;
let fastForward = false;

// 🔊 SOUND
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// 🔊 MASTER VOLUME (0.0 - 1.0)
let masterVolume = 10;

function playTone(frequency = 400, duration = 0.04, volume = 0.02) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = "square";
  oscillator.frequency.value = frequency;

  const finalVolume = volume * masterVolume;

  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(finalVolume, audioCtx.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

// 🔊 CYBER SOUNDS
function playClick() {
  playTone(900, 0.01, 0.004);
}

function playConfirm() {
  playTone(500, 0.05, 0.01);
  setTimeout(() => playTone(800, 0.05, 0.01), 60);
}

function playError() {
  playTone(150, 0.08, 0.02);
}

function playGlitch() {
  playTone(1200, 0.02, 0.01);
  setTimeout(() => playTone(300, 0.02, 0.01), 20);
}

function playTyping() {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  // clearer but still subtle click
  playTone(550 + Math.random() * 80, 0.01, 0.002);
}

// 🔽 SCROLL
function scrollToBottom() {
  const el = document.getElementById("terminal");
  el.scrollTop = el.scrollHeight;
}

// 🔽 TYPE EFFECT
function typeLines(lines, callback) {
  isTyping = true;
  hiddenInput.disabled = true;
  fastForward = false; // 🔥 reset na start

  let i = 0;  
  let j = 0;

  function type() {
    if (i < lines.length) {

      if (j < lines[i].length) {

        // ⚡ FAST FORWARD → cała linia od razu
        if (fastForward) {
          terminal.innerHTML += lines[i].slice(j);
          j = lines[i].length;
          playTyping()
          playTyping()
          fastForward = false; // 🔥 reset after skipping ONE line
          scrollToBottom();
          setTimeout(type, 0);
          return;
        }
        terminal.innerHTML += lines[i][j];
        // force layout update for smoother mobile rendering
        terminal.offsetHeight;
        if(Math.random() < 0.5) playTyping();

        scrollToBottom();
        j++;

        const delay = 12 + Math.random() * 18;
        setTimeout(type, delay + Math.random() * 10);

      } else {
        terminal.innerHTML += "<br>";
        scrollToBottom();
        i++;
        j = 0;

        setTimeout(type, fastForward ? 10 : 160);
      }

    } else {
      isTyping = false;
      fastForward = false; // 🔥 reset na koniec
      hiddenInput.disabled = false;

      if (callback) callback();
    }
  }

  type();
}

// 🔴 ERROR
function triggerErrorGlitch(duration = 200) {
  playError();
  playGlitch();
  document.body.classList.add("glitch-error");
  setTimeout(() => {
    document.body.classList.remove("glitch-error");
  }, duration);
}

// 🟢 SUCCESS
function triggerSuccess(duration = 200) {
  playConfirm();
  document.body.classList.add("glow-success");
  setTimeout(() => {
    document.body.classList.remove("glow-success");
  }, duration);
}

// ⚡ LEVEL UP
function triggerLevelUp(duration = 300) {
  playConfirm();
  setTimeout(() => playGlitch(), 120);

  document.body.classList.add("glitch-strong");
  document.body.classList.add("flash");

  setTimeout(() => {
    document.body.classList.remove("glitch-strong");
    document.body.classList.remove("flash");
  }, duration);
}

// 🔽 INPUT
function enableInput(onSubmit, promptText = "> ") {
  inputActive = true;
  input = "";
  terminal.innerHTML += promptText;
  hiddenInput.value = "";
  hiddenInput.focus();

  function updateInput() {
    // 🔥 usuń stare kursory
    terminal.innerHTML = terminal.innerHTML.replace(/<span class="cursor"><\/span>/g, "");

    const lines = terminal.innerHTML.split("<br>");
    lines[lines.length - 1] =
      promptText + input + '<span class="cursor"></span>';
    terminal.innerHTML = lines.join("<br>");
    scrollToBottom();
  }

  hiddenInput.oninput = () => {
    if (isTyping) return;
    input = hiddenInput.value;
    updateInput();
  };

  hiddenInput.onkeydown = (e) => {

    if (e.key.length === 1 || e.key === "Backspace") {
      playTyping();
    }

    if (e.key === "Enter") {

      // ⚡ jeśli typing → skip
      if (isTyping) {
        fastForward = true;
        return;
      } else {
        fastForward = false; // 🔥 KLUCZOWE FIX
      }

      playClick();
      e.preventDefault();
      inputActive = false;
      terminal.innerHTML += "<br>";
      onSubmit(input);
    }
  };

  updateInput();
}

// 🔽 START AUDIO
function unlockAudio() {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

document.addEventListener("click", () => {
  hiddenInput.focus();
  unlockAudio();
});

document.addEventListener("keydown", (e) => {
  unlockAudio();
}, { once: true });

// 🔽 GLOBAL ENTER (działa nawet gdy input disabled)
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && isTyping) {
    fastForward = true;
  }
});
function playPyramidAnimation(callback) {

  const frames = [
    [
      "        ▓                 ▓",
      "       ▓▓                 ▓▓",
      "      ▓▓▓                 ▓▓▓",
      "     ▓▓▓▓                 ▓▓▓▓",
      "    ▓▓▓▓▓                 ▓▓▓▓▓"
    ],
    [
      "        ▓             ▓",
      "       ▓▓             ▓▓",
      "      ▓▓▓             ▓▓▓",
      "     ▓▓▓▓             ▓▓▓▓",
      "    ▓▓▓▓▓             ▓▓▓▓▓"
    ],
    [
      "        ▓         ▓",
      "       ▓▓         ▓▓",
      "      ▓▓▓         ▓▓▓",
      "     ▓▓▓▓         ▓▓▓▓",
      "    ▓▓▓▓▓         ▓▓▓▓▓"
    ],
    [
      "        ▓       ▓",
      "       ▓▓       ▓▓",
      "      ▓▓▓       ▓▓▓",
      "     ▓▓▓▓       ▓▓▓▓",
      "    ▓▓▓▓▓       ▓▓▓▓▓"
    ],
    [
      "        ▓     ▓",
      "       ▓▓     ▓▓",
      "      ▓▓▓     ▓▓▓",
      "     ▓▓▓▓     ▓▓▓▓",
      "    ▓▓▓▓▓     ▓▓▓▓▓"
    ],
    [
      "        ▓   ▓",
      "       ▓▓   ▓▓",
      "      ▓▓▓   ▓▓▓",
      "     ▓▓▓▓   ▓▓▓▓",
      "    ▓▓▓▓▓   ▓▓▓▓▓"
    ],
    [
      "        ▓ ▓",
      "       ▓▓ ▓▓",
      "      ▓▓▓ ▓▓▓",
      "     ▓▓▓▓ ▓▓▓▓",
      "    ▓▓▓▓▓ ▓▓▓▓▓"
    ],
    [
      "        ▓▓",
      "       ▓▓▓▓",
      "      ▓▓▓▓▓▓",
      "     ▓▓▓▓▓▓▓▓",
      "    ▓▓▓▓▓▓▓▓▓▓"
    ]
  ];

  let i = 0;

  const anim = document.createElement("pre");
  anim.style.margin = "20px 0";
  terminal.appendChild(anim);

  function nextFrame() {
    if (i === frames.length - 1) {
      // pokaż ostatnią klatkę
      anim.textContent = frames[i].join("\n");
      scrollToBottom();

      // 🔥 FINALNY EFEKT dokładnie w momencie zamknięcia
      playGlitch();
      setTimeout(() => playTone(80, 0.12, 0.03), 40);

      setTimeout(() => {
        document.body.classList.add("glitch-strong");
        document.body.classList.add("flash");
        document.body.classList.add("shake-strong");

        setTimeout(() => {
          document.body.classList.remove("glitch-strong");
          document.body.classList.remove("flash");
          document.body.classList.remove("shake-strong");

          if (callback) callback();
        }, 250);

      }, 20);

      return;
    }

    anim.textContent = frames[i].join("\n");
    scrollToBottom();

    i++;
    setTimeout(nextFrame, 90);
  }

  nextFrame();
}

// 🔽 LEVEL TRANSITION
function goToLevel(nextLevelUrl) {
  triggerLevelUp();

  playPyramidAnimation(() => {
    setTimeout(() => {
      window.location.href = nextLevelUrl;
    }, 300);
  });
}
// Optional helper to set master volume
function setMasterVolume(v) {
  masterVolume = Math.max(0, Math.min(1, v));
}
