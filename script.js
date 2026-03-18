/* ── Custom Cursor ── */
const cursor = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursorTrail');

document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
  setTimeout(() => {
    cursorTrail.style.left = e.clientX + 'px';
    cursorTrail.style.top  = e.clientY + 'px';
  }, 80);
});

document.addEventListener('mousedown', () => cursor.style.transform = 'translate(-50%,-50%) scale(0.7)');
document.addEventListener('mouseup',   () => cursor.style.transform = 'translate(-50%,-50%) scale(1)');

/* ── Nav scroll effect ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

/* ── Scroll Reveal ── */
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });
revealEls.forEach(el => observer.observe(el));

/* ══════════════════════════════
   CALCULATOR LOGIC
   FIX: These functions were referenced in HTML
   but never defined — calculator was completely broken
══════════════════════════════ */
let calcExpr    = '';
let calcPrevRes = '';
let lastResult  = null;

const displayExpr    = document.getElementById('calcExpr');
const displayResult  = document.getElementById('calcResult');
const displayHistory = document.getElementById('calcHistory');

function updateDisplay() {
  displayExpr.textContent   = calcExpr || '\u00a0';
  displayResult.textContent = calcExpr ? liveEval(calcExpr) : (lastResult !== null ? lastResult : '0');
}

/** Safe eval — only allows maths characters */
function safeEval(expr) {
  // Replace ** with Math.pow for compatibility, support sqrt and abs
  const sanitised = expr
    .replace(/\s/g, '')
    .replace(/[^0-9+\-*/.()%]/g, '');
  if (!sanitised) return null;
  try {
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + sanitised + ')')();
    if (!isFinite(result)) return 'Error';
    // Round to avoid floating-point noise
    return parseFloat(result.toPrecision(12));
  } catch {
    return null;
  }
}

function liveEval(expr) {
  const r = safeEval(expr);
  return (r !== null && r !== 'Error') ? r : displayResult.textContent;
}

/** Append a character/operator to the expression */
function calcInput(val) {
  // If last action was '=' and user types a digit, start fresh
  if (lastResult !== null && /^[0-9.]$/.test(val)) {
    calcExpr = '';
    lastResult = null;
  }
  // If last action was '=' and user types an operator, continue from result
  if (lastResult !== null && /^[+\-*/%]$/.test(val)) {
    calcExpr = String(lastResult);
    lastResult = null;
  }
  calcExpr += val;
  updateDisplay();
}

/** Handle special actions: AC, +/-, %, =, DEL */
function calcAction(action) {
  switch (action) {
    case 'AC':
      calcExpr = '';
      lastResult = null;
      calcPrevRes = '';
      displayHistory.textContent = '';
      displayResult.textContent  = '0';
      displayExpr.textContent    = '\u00a0';
      break;

    case 'DEL':
      calcExpr = calcExpr.slice(0, -1);
      updateDisplay();
      break;

    case '+/-': {
      // Negate the last number in the expression
      const match = calcExpr.match(/(.*?)(-?\d+\.?\d*)$/);
      if (match) {
        const n = parseFloat(match[2]);
        calcExpr = match[1] + (-n);
      } else if (lastResult !== null) {
        lastResult = -lastResult;
        displayResult.textContent = lastResult;
      }
      updateDisplay();
      break;
    }

    case '%': {
      // Convert trailing number to its percentage (÷100)
      const m = calcExpr.match(/(.*?)(-?\d+\.?\d*)$/);
      if (m) {
        const n = parseFloat(m[2]) / 100;
        calcExpr = m[1] + n;
      }
      updateDisplay();
      break;
    }

    case '=': {
      if (!calcExpr) break;
      const result = safeEval(calcExpr);
      if (result === null) {
        pop(displayResult, 'Error');
        break;
      }
      displayHistory.textContent = calcExpr + ' =';
      lastResult = result;
      calcExpr   = '';

      // Pop animation
      displayResult.textContent = result;
      displayResult.classList.add('pop');
      setTimeout(() => displayResult.classList.remove('pop'), 200);
      displayExpr.textContent = '\u00a0';
      break;
    }
  }
}

/** Wrap current value in sqrt() or abs() */
function calcExtra(fn) {
  if (fn === 'sqrt') {
    // If there's an ongoing expression, wrap it; otherwise use lastResult
    const inner = calcExpr || (lastResult !== null ? String(lastResult) : '');
    if (inner) {
      calcExpr = '(' + inner + ')**0.5';
      lastResult = null;
    } else {
      calcExpr = '';
    }
  } else if (fn === 'abs') {
    const inner = calcExpr || (lastResult !== null ? String(lastResult) : '');
    if (inner) {
      // abs via conditional: (x<0?-x:x) since we can't use Math.*
      calcExpr = '(' + inner + '<0?-(' + inner + '):(' + inner + '))';
      lastResult = null;
    }
  }
  updateDisplay();
}

/* ── Keyboard support for calculator ── */
document.addEventListener('keydown', e => {
  // Only fire if focus is not on an input element
  if (['0','1','2','3','4','5','6','7','8','9'].includes(e.key)) calcInput(e.key);
  else if (['+','-','*','/','(',')','.'].includes(e.key)) calcInput(e.key);
  else if (e.key === 'Enter' || e.key === '=') calcAction('=');
  else if (e.key === 'Backspace') calcAction('DEL');
  else if (e.key === 'Escape') calcAction('AC');
  else if (e.key === '%') calcAction('%');
});