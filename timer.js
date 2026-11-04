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
      if (pomoWrap) pomoWrap.classList.add('is-running');
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      if (pomoWrap) pomoWrap.classList.remove('is-running');
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

  // ================= DAILY MOTIVATIONAL QUOTE =================

  const dailyQuoteText = document.getElementById('dailyQuoteText');
  const dailyQuoteAuthor = document.getElementById('dailyQuoteAuthor');
  const changeQuoteBtn = document.getElementById('changeQuoteBtn');

  const motivationalQuotes = [
    {
      text: "The secret of getting ahead is getting started.",
      author: "Mark Twain"
    },
    {
      text: "It always seems impossible until it's done.",
      author: "Nelson Mandela"
    },
    {
      text: "Success is the sum of small efforts repeated day in and day out.",
      author: "Robert Collier"
    },
    {
      text: "The beautiful thing about learning is that nobody can take it away from you.",
      author: "B.B. King"
    },
    {
      text: "Education is the most powerful weapon which you can use to change the world.",
      author: "Nelson Mandela"
    },
    {
      text: "There are no shortcuts to any place worth going.",
      author: "Beverly Sills"
    },
    {
      text: "Great things are done by a series of small things brought together.",
      author: "Vincent van Gogh"
    },
    {
      text: "Believe you can and you're halfway there.",
      author: "Theodore Roosevelt"
    },
    {
      text: "The expert in anything was once a beginner.",
      author: "Helen Hayes"
    },
    {
      text: "Don't let what you cannot do interfere with what you can do.",
      author: "John Wooden"
    },
    {
      text: "Learning never exhausts the mind.",
      author: "Leonardo da Vinci"
    },
    {
      text: "Discipline is the bridge between goals and accomplishment.",
      author: "Jim Rohn"
    },
    {
      text: "Success doesn't come from what you do occasionally. It comes from what you do consistently.",
      author: "Marie Forleo"
    },
    {
      text: "The future depends on what you do today.",
      author: "Mahatma Gandhi"
    },
    {
      text: "Well done is better than well said.",
      author: "Benjamin Franklin"
    },
    {
      text: "You don't have to be great to start, but you have to start to be great.",
      author: "Zig Ziglar"
    },
    {
      text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
      author: "Dr. Seuss"
    },
    {
      text: "It does not matter how slowly you go as long as you do not stop.",
      author: "Confucius"
    },
    {
      text: "Quality is not an act, it is a habit.",
      author: "Aristotle"
    },
    {
      text: "Dreams don't work unless you do.",
      author: "John C. Maxwell"
    },
    {
      text: "Start where you are. Use what you have. Do what you can.",
      author: "Arthur Ashe"
    },
    {
      text: "Productivity is never an accident. It is always the result of commitment to excellence.",
      author: "Paul J. Meyer"
    },
    {
      text: "Small progress is still progress.",
      author: "Unknown"
    },
    {
      text: "Your only limit is your mind.",
      author: "Unknown"
    }
  ];

  let currentQuoteIndex = -1;

  function displayRandomQuote() {
    if (!dailyQuoteText || !dailyQuoteAuthor) return;

    let newQuoteIndex;

    do {
      newQuoteIndex = Math.floor(Math.random() * motivationalQuotes.length);
    } while (
      motivationalQuotes.length > 1 &&
      newQuoteIndex === currentQuoteIndex
    );

    currentQuoteIndex = newQuoteIndex;

    // Fade out the existing quote
    dailyQuoteText.classList.add('quote-fade-out');
    dailyQuoteAuthor.classList.add('quote-fade-out');

    setTimeout(() => {
      const selectedQuote = motivationalQuotes[currentQuoteIndex];

      dailyQuoteText.textContent = `"${selectedQuote.text}"`;
      dailyQuoteAuthor.textContent = selectedQuote.author
        ? `— ${selectedQuote.author}`
        : '';

      // Fade in the new quote
      dailyQuoteText.classList.remove('quote-fade-out');
      dailyQuoteAuthor.classList.remove('quote-fade-out');

      dailyQuoteText.classList.add('quote-fade-in');
      dailyQuoteAuthor.classList.add('quote-fade-in');

      setTimeout(() => {
        dailyQuoteText.classList.remove('quote-fade-in');
        dailyQuoteAuthor.classList.remove('quote-fade-in');
      }, 500);

    }, 300);
  }

  // Display a random quote whenever the page loads or refreshes
  displayRandomQuote();

  // Change Quote button functionality
  if (changeQuoteBtn) {
    changeQuoteBtn.addEventListener('click', displayRandomQuote);
  }

  // ================= END DAILY MOTIVATIONAL QUOTE =================

});