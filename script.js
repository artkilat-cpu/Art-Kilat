const cursor      = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursorTrail');
let mouseX = 0, mouseY = 0;
let trailX = 0, trailY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});

function animateTrail() {
  trailX += (mouseX - trailX) * 0.12;
  trailY += (mouseY - trailY) * 0.12;
  cursorTrail.style.left = trailX + 'px';
  cursorTrail.style.top  = trailY + 'px';
  requestAnimationFrame(animateTrail);
}
animateTrail();

document.querySelectorAll('a, button, .cbtn, .cbtn-extra, .stag').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.transform = 'translate(-50%,-50%) scale(2.2)';
    cursorTrail.style.width = '50px';
    cursorTrail.style.height = '50px';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.transform = 'translate(-50%,-50%) scale(1)';
    cursorTrail.style.width = '30px';
    cursorTrail.style.height = '30px';
  });
});

/* ══════════════════════════════
   NAV SCROLL
══════════════════════════════ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

/* ══════════════════════════════
   SCROLL REVEAL
══════════════════════════════ */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 120);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal, .edu-item, .glass-panel, .contact-card').forEach(el => {
  el.classList.add('reveal');
  revealObs.observe(el);
});

/* ══════════════════════════════
   3D CARD MOUSE PARALLAX
══════════════════════════════ */
const card3d = document.querySelector('.card-3d');
if (card3d) {
  card3d.parentElement.addEventListener('mousemove', (e) => {
    const rect = card3d.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = ((e.clientY - cy) / (rect.height / 2)) * 8;
    const ry = -((e.clientX - cx) / (rect.width / 2)) * 8;
    card3d.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px)`;
    card3d.style.animation = 'none';
  });
  card3d.parentElement.addEventListener('mouseleave', () => {
    card3d.style.animation = 'cardFloat 8s ease-in-out infinite';
    card3d.style.transform = '';
  });
}

/* ══════════════════════════════
   ACTIVE NAV LINK
══════════════════════════════ */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

const navObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.style.color = active ? 'var(--blue-pale)' : '';
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => navObs.observe(s));

/* ══════════════════════════════
   PYTHON-STYLE CALCULATOR
══════════════════════════════ */
let calcCurrent  = '';
let calcPrev     = '';
let lastResult   = '';
let historyList  = [];

const exprEl   = document.getElementById('calcExpr');
const resultEl = document.getElementById('calcResult');
const histEl   = document.getElementById('calcHistory');

function updateDisplay() {
  exprEl.textContent   = calcCurrent || '\u00A0';
  resultEl.textContent = lastResult !== '' ? lastResult : (calcCurrent ? '' : '0');

  // Live preview while typing
  if (calcCurrent && lastResult === '') {
    try {
      const preview = safePyEval(calcCurrent);
      if (preview !== null && String(preview) !== calcCurrent) {
        resultEl.textContent = String(preview);
      }
    } catch {}
  }
}

function calcInput(val) {
  // Prevent double operators
  const ops = ['+', '-', '*', '/', '**'];
  const lastChar = calcCurrent.slice(-1);
  if (ops.includes(val) && ops.includes(lastChar) && val !== '-') {
    calcCurrent = calcCurrent.slice(0, -1);
  }
  calcCurrent += val;
  lastResult = '';
  updateDisplay();
}

function calcAction(action) {
  switch (action) {
    case 'AC':
      calcCurrent = '';
      lastResult  = '';
      calcPrev    = '';
      updateDisplay();
      break;

    case 'DEL':
      calcCurrent = calcCurrent.slice(0, -1);
      lastResult  = '';
      updateDisplay();
      break;

    case '+/-':
      if (calcCurrent) {
        if (calcCurrent.startsWith('-')) {
          calcCurrent = calcCurrent.slice(1);
        } else {
          calcCurrent = '-' + calcCurrent;
        }
        lastResult = '';
        updateDisplay();
      }
      break;

    case '%':
      if (calcCurrent) {
        try {
          const v = safePyEval(calcCurrent);
          if (v !== null) {
            calcCurrent = String(v / 100);
            lastResult  = '';
            updateDisplay();
          }
        } catch {}
      }
      break;

    case '=':
      if (!calcCurrent) return;
      try {
        const res = safePyEval(calcCurrent);
        if (res !== null) {
          // Format result nicely
          let formatted = formatResult(res);
          // Add to history
          historyList.unshift(`${calcCurrent} = ${formatted}`);
          if (historyList.length > 3) historyList.pop();
          histEl.textContent = historyList.slice(0, 1).join(' | ');

          resultEl.classList.add('pop');
          setTimeout(() => resultEl.classList.remove('pop'), 180);

          calcPrev    = calcCurrent;
          lastResult  = formatted;
          calcCurrent = formatted;
          updateDisplay();
        } else {
          showCalcError('Syntax Error');
        }
      } catch (e) {
        showCalcError('Error');
      }
      break;
  }
}

function calcExtra(fn) {
  if (!calcCurrent && fn === 'sqrt') {
    calcCurrent = 'sqrt(';
    lastResult  = '';
    updateDisplay();
    return;
  }
  if (!calcCurrent && fn === 'abs') {
    calcCurrent = 'abs(';
    lastResult  = '';
    updateDisplay();
    return;
  }
  // Wrap current expression
  if (calcCurrent) {
    try {
      const v = safePyEval(calcCurrent);
      if (v !== null) {
        let res;
        if (fn === 'sqrt') res = Math.sqrt(Number(v));
        if (fn === 'abs')  res = Math.abs(Number(v));
        if (res !== undefined) {
          const formatted = formatResult(res);
          historyList.unshift(`${fn}(${calcCurrent}) = ${formatted}`);
          if (historyList.length > 3) historyList.pop();
          histEl.textContent = historyList.slice(0, 1).join(' | ');
          calcCurrent = formatted;
          lastResult  = formatted;
          updateDisplay();
        }
      }
    } catch {}
  }
}

function formatResult(num) {
  if (typeof num !== 'number') return String(num);
  if (!isFinite(num)) return num > 0 ? '∞' : '-∞';
  if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return num.toExponential(4);
  }
  // Remove floating point noise
  const rounded = parseFloat(num.toPrecision(12));
  return String(rounded);
}

function showCalcError(msg) {
  resultEl.textContent = msg;
  resultEl.style.color = '#fca5a5';
  resultEl.style.fontSize = '1.6rem';
  setTimeout(() => {
    resultEl.style.color = '';
    resultEl.style.fontSize = '';
    calcCurrent = '';
    lastResult  = '';
    updateDisplay();
  }, 1600);
}

/**
 * Safe Python-style expression evaluator.
 * Handles: +, -, *, /, ** (power), (), %, sqrt(), abs()
 */
function safePyEval(expr) {
  if (!expr || !expr.trim()) return null;

  // Security: only allow numbers, operators, parens, dots, spaces
  const sanitized = expr
    .trim()
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/abs\(/g, 'Math.abs(')
    .replace(/pi/g, 'Math.PI')
    .replace(/e(?!\+|-|\d)/g, 'Math.E');

  // Validate: only safe characters
  const safe = /^[0-9+\-*/.()%\s,MathsqrtabsPIE_]+$/.test(sanitized);
  if (!safe) return null;

  try {
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + sanitized + ')')();
    if (typeof result !== 'number') return null;
    return result;
  } catch {
    return null;
  }
}

/* Keyboard support for calculator */
document.addEventListener('keydown', (e) => {
  const focused = document.activeElement;
  if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA')) return;

  const rect = document.getElementById('projects').getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) return;

  if (e.key >= '0' && e.key <= '9') calcInput(e.key);
  else if (['+', '-', '*', '/', '.', '(', ')'].includes(e.key)) calcInput(e.key);
  else if (e.key === 'Enter' || e.key === '=') calcAction('=');
  else if (e.key === 'Backspace') calcAction('DEL');
  else if (e.key === 'Escape') calcAction('AC');
  else if (e.key === '^') calcInput('**');
});

/* Initial display */
updateDisplay();

/* ══════════════════════════════
   HERO BADGE PULSE + PARALLAX ORBS
══════════════════════════════ */
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  document.querySelectorAll('.orb').forEach((orb, i) => {
    const speed = 0.08 + i * 0.04;
    orb.style.transform = `translateY(${scrollY * speed}px)`;
  });
});

/* ══════════════════════════════
   SKILL TAGS — WAVE ANIMATION
══════════════════════════════ */
document.querySelectorAll('.stag').forEach((tag, i) => {
  tag.style.animationDelay = `${i * 0.05}s`;
  tag.style.opacity = '0';
  tag.style.transform = 'translateY(10px)';
  tag.style.transition = `opacity 0.4s ease ${i * 0.05}s, transform 0.4s ease ${i * 0.05}s`;
});

const skillsObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stag').forEach(tag => {
        tag.style.opacity = '1';
        tag.style.transform = 'translateY(0)';
      });
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.skills-wrap').forEach(el => skillsObs.observe(el));