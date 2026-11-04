// ================= ULTIMATE POMODORO TIMER LOGIC =================

document.addEventListener('DOMContentLoaded', () => {
  let timerInterval = null;
  let isRunning = false;
  let timeLeft = 25 * 60; 
  let totalTime = 25 * 60;
  let currentMode = 'focus'; 
  let focusRounds = 0;
  let expectedTime = 0;

  const timeEl = document.getElementById('pomoTime');
  const startBtn = document.getElementById('pomoStart');
  const resetBtn = document.getElementById('pomoReset');
  const progressEl = document.getElementById('pomoProgress');
  const labelEl = document.getElementById('pomoLabel');
  const sessionTextEl = document.getElementById('pomoSessionsText');
  const pomoWrap = document.getElementById('pomoWrap');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  
  // Gradient IDs for changing colors dynamically
  const grad1 = document.getElementById('grad1');
  const grad2 = document.getElementById('grad2');

  const circumference = 653.45; 

  // --- Save State to LocalStorage ---
  function saveState() {
    localStorage.setItem('pomoState', JSON.stringify({
      isRunning, timeLeft, totalTime, currentMode, focusRounds,
      expectedTime: isRunning ? expectedTime : null
    }));
  }

  // --- Load State from LocalStorage ---
  function loadState() {
    const saved = JSON.parse(localStorage.getItem('pomoState'));
    if (saved) {
      currentMode = saved.currentMode;
      focusRounds = saved.focusRounds;
      totalTime = saved.totalTime;
      
      if (saved.isRunning && saved.expectedTime) {
        const now = Date.now();
        const diff = Math.round((saved.expectedTime - now) / 1000);
        if (diff > 0) {
          timeLeft = diff;
          expectedTime = saved.expectedTime;
          isRunning = true;
          startInterval();
        } else {
          timeLeft = 0;
          isRunning = false;
        }
      } else {
        timeLeft = saved.timeLeft;
        isRunning = false;
      }
      updateColorScheme();
      updateUI();
      updateButtonState();
    }
  }

  // --- Color Scheme Update ---
  function updateColorScheme() {
    if (currentMode === 'focus') {
      grad1.setAttribute('stop-color', '#6366f1');
      grad2.setAttribute('stop-color', '#ec4899');
    } else if (currentMode === 'short_break') {
      grad1.setAttribute('stop-color', '#10b981');
      grad2.setAttribute('stop-color', '#34d399');
    } else {
      grad1.setAttribute('stop-color', '#3b82f6');
      grad2.setAttribute('stop-color', '#60a5fa');
    }
  }

  // --- Sound Alert ---
  function playBeep() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) {}
  }

  // --- UI Updates ---
  function updateUI() {
    const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const s = String(timeLeft % 60).padStart(2, '0');
    const timeString = `${m}:${s}`;
    timeEl.textContent = timeString;

    if (isRunning) {
      let emoji = currentMode === 'focus' ? '⏳' : '☕';
      document.title = `${emoji} ${timeString} - ${currentMode === 'focus' ? 'Focus' : 'Break'}`;
    } else {
      document.title = 'StudyFlow — Smart Study Planner';
    }

    const fraction = timeLeft / totalTime;
    progressEl.style.strokeDashoffset = circumference * (1 - fraction);

    if (currentMode === 'focus') labelEl.textContent = 'FOCUS TIME';
    else if (currentMode === 'short_break') labelEl.textContent = 'SHORT BREAK';
    else labelEl.textContent = 'LONG BREAK';

    if (sessionTextEl) {
      sessionTextEl.textContent = `Round ${focusRounds + 1} of 4`;
    }
    saveState(); // Save on every update
  }

  function updateButtonState() {
    if (isRunning) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      if(pomoWrap) pomoWrap.classList.add('is-running');
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      if(pomoWrap) pomoWrap.classList.remove('is-running');
    }
  }

  function startInterval() {
    expectedTime = Date.now() + (timeLeft * 1000);
    timerInterval = setInterval(() => {
      const now = Date.now();
      const diff = Math.round((expectedTime - now) / 1000);
      
      if (diff !== timeLeft) {
        timeLeft = diff;
        if (timeLeft < 0) timeLeft = 0;
        updateUI();
      }

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        updateButtonState();
        handleTimerComplete();
      }
    }, 200); 
  }

  function startTimer() {
    if (isRunning) {
      clearInterval(timerInterval);
      isRunning = false;
      updateButtonState();
      updateUI();
      return;
    }

    isRunning = true;
    updateButtonState();
    startInterval();
  }

  function handleTimerComplete() {
    playBeep();
    
    if (currentMode === 'focus') {
      focusRounds++;
      if (typeof user !== 'undefined' && user.email) {
        let s = parseInt(localStorage.getItem('pomo_' + user.email) || '0');
        localStorage.setItem('pomo_' + user.email, s + 1);
        if (typeof updateStats === 'function') updateStats();
      }
    }

    if (currentMode === 'focus') {
      if (focusRounds % 4 === 0) {
        switchMode('long_break');
        alert("Great job! You completed 4 focus sessions. Time for a 15-minute long break.");
      } else {
        switchMode('short_break');
        alert("Focus session complete! Time for a 5-minute short break.");
      }
    } else {
      switchMode('focus');
      alert("Break is over! Let's get back to focus.");
    }
  }

  function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.pomo-mode').forEach(b => {
      b.classList.remove('active');
      if (b.dataset.mode === mode) b.classList.add('active');
    });

    if (mode === 'focus') totalTime = 25 * 60;
    else if (mode === 'short_break') totalTime = 5 * 60;
    else if (mode === 'long_break') totalTime = 15 * 60;
    
    timeLeft = totalTime;
    isRunning = false;
    clearInterval(timerInterval);
    
    updateColorScheme();
    updateButtonState();
    updateUI();
  }

  // --- Event Listeners ---
  if (startBtn) startBtn.addEventListener('click', startTimer);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      clearInterval(timerInterval);
      isRunning = false;
      timeLeft = totalTime;
      updateButtonState();
      updateUI();
    });
  }

  document.querySelectorAll('.pomo-mode').forEach(btn => {
    btn.addEventListener('click', () => {
      clearInterval(timerInterval);
      isRunning = false;
      switchMode(btn.dataset.mode);
    });
  });

  // Keyboard Shortcut (Spacebar to play/pause)
  window.addEventListener('keydown', (e) => {
    // Check if user is typing in an input field to avoid conflicts
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (e.code === 'Space') {
      e.preventDefault(); // Prevent page scrolling
      const timerView = document.getElementById('view-pomodoro');
      if (timerView && timerView.classList.contains('active')) {
        startTimer();
      }
    }
  });

  // Initialize
  loadState();
});