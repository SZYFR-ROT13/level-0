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
const commandHistory = [];
let historyIndex = 0;
const progressKey = "terminalGameMaxUnlockedLevel";

function getLevelFromUrl(url = window.location.pathname) {
  const fileName = url.split("/").pop() || "index.html";
  if (fileName === "index.html" || fileName === "") return 0;

  const match = fileName.match(/^level-(\d+)\.html$/);
  return match ? Number(match[1]) : 0;
}

function getLevelUrl(level) {
  return level === 0 ? "index.html" : `level-${level}.html`;
}

function getMaxUnlockedLevel() {
  return Number(localStorage.getItem(progressKey) || 0);
}

function unlockLevel(level) {
  const maxUnlockedLevel = getMaxUnlockedLevel();
  if (level > maxUnlockedLevel) {
    localStorage.setItem(progressKey, String(level));
  }
}

function guardLevelAccess() {
  const currentLevel = getLevelFromUrl();
  const maxUnlockedLevel = getMaxUnlockedLevel();

  if (currentLevel > maxUnlockedLevel) {
    window.location.replace(getLevelUrl(maxUnlockedLevel));
  }
}

guardLevelAccess();

function getCommonPrefix(values) {
  if (!values.length) return "";

  return values.reduce((prefix, value) => {
    let index = 0;
    while (index < prefix.length && index < value.length && prefix[index].toLowerCase() === value[index].toLowerCase()) {
      index++;
    }
    return prefix.slice(0, index);
  });
}

// 🔊 SOUND
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// 🔊 MASTER VOLUME (0.0 - 1.0)
let masterVolume = 3;

function escapeHTML(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

function updateViewportSize() {
  const viewport = window.visualViewport;
  const height = viewport ? viewport.height : window.innerHeight;
  const keyboardOffset = viewport
    ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
    : 0;

  document.documentElement.style.setProperty("--app-height", `${height}px`);
  document.documentElement.style.setProperty("--keyboard-offset", `${keyboardOffset}px`);

  setTimeout(scrollToBottom, 50);
}

updateViewportSize();

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
          terminal.innerHTML += escapeHTML(lines[i].slice(j));
          j = lines[i].length;
          playTyping()
          playTyping()
          fastForward = false; // 🔥 reset after skipping ONE line
          scrollToBottom();
          setTimeout(type, 0);
          return;
        }
        terminal.innerHTML += escapeHTML(lines[i][j]);
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
      escapeHTML(promptText) + escapeHTML(input) + '<span class="cursor"></span>';
    terminal.innerHTML = lines.join("<br>");
    scrollToBottom();
  }

  hiddenInput.oninput = () => {
    if (isTyping) return;
    input = hiddenInput.value;
    updateInput();
  };

  hiddenInput.onkeydown = (e) => {

    if (e.key === "Tab") {
      e.preventDefault();

      if (typeof getAutocompleteOptions === "function") {
        const matches = getAutocompleteOptions(input);
        const completion = getCommonPrefix(matches);

        if (completion && completion.length > input.length) {
          input = completion;
          hiddenInput.value = input;
          playTyping();
          updateInput();
        }
      }

      return;
    }

    if (e.key === "ArrowUp" && commandHistory.length) {
      e.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      input = commandHistory[historyIndex];
      hiddenInput.value = input;
      updateInput();
      return;
    }

    if (e.key === "ArrowDown" && commandHistory.length) {
      e.preventDefault();
      historyIndex = Math.min(commandHistory.length, historyIndex + 1);
      input = commandHistory[historyIndex] || "";
      hiddenInput.value = input;
      updateInput();
      return;
    }

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
      if (input.trim() && commandHistory[commandHistory.length - 1] !== input) {
        commandHistory.push(input);
      }
      historyIndex = commandHistory.length;
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

// 📱 Auto scroll when keyboard opens (mobile)
window.addEventListener("resize", updateViewportSize);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", updateViewportSize);
  window.visualViewport.addEventListener("scroll", updateViewportSize);
}

// 📱 Tap screen to fast-forward typing
terminal.addEventListener("touchstart", () => {
  if (isTyping) {
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
  unlockLevel(getLevelFromUrl(nextLevelUrl));
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
