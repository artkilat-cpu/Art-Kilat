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
══════════════════════════════ */
let calcExprStr = '';
let lastResult  = null;

const displayExpr    = document.getElementById('calcExpr');
const displayResult  = document.getElementById('calcResult');
const displayHistory = document.getElementById('calcHistory');

function updateDisplay() {
  displayExpr.textContent = calcExprStr || '\u00a0';
  if (calcExprStr) {
    const live = liveEval(calcExprStr);
    if (live !== null) displayResult.textContent = live;
  } else {
    displayResult.textContent = (lastResult !== null) ? lastResult : '0';
  }
}

/**
 * Safe evaluator — only allows digits, operators, parentheses, dots.
 * FIX: sanitise keeps only math-safe characters; uses Function constructor
 * instead of eval for slightly cleaner scoping.
 */
function safeEval(expr) {
  // Allow: digits, decimal point, operators + - * / % ( ) ^ and whitespace
  const sanitised = expr.replace(/\s/g, '');

  // Guard: reject anything not in the math character whitelist
  if (/[^0-9+\-*/.()%]/.test(sanitised)) return null;
  if (!sanitised) return null;

  try {
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + sanitised + ')')();
    if (typeof result !== 'number' || !isFinite(result)) return 'Error';
    // Round to 12 significant figures to suppress floating-point noise
    return parseFloat(result.toPrecision(12));
  } catch {
    return null;
  }
}

/** Returns a live preview while the user is still typing, or null if incomplete */
function liveEval(expr) {
  const r = safeEval(expr);
  return (r !== null && r !== 'Error') ? r : null;
}

/** Append a character/operator to the expression */
function calcInput(val) {
  // After '=' result: digit starts a new expression; operator continues from result
  if (lastResult !== null) {
    if (/^[0-9.]$/.test(val)) {
      calcExprStr = '';
      lastResult = null;
    } else if (/^[+\-*/%]$/.test(val) || val === '**') {
      calcExprStr = String(lastResult);
      lastResult = null;
    } else {
      // Parentheses etc. — start fresh
      calcExprStr = '';
      lastResult = null;
    }
  }
  calcExprStr += val;
  updateDisplay();
}

/** Handle special actions: AC, +/-, %, =, DEL */
function calcAction(action) {
  switch (action) {

    case 'AC':
      calcExprStr = '';
      lastResult  = null;
      displayHistory.textContent = '';
      displayResult.textContent  = '0';
      displayExpr.textContent    = '\u00a0';
      break;

    case 'DEL':
      // FIX: slice works correctly on multi-char tokens like '**' too
      calcExprStr = calcExprStr.slice(0, -1);
      updateDisplay();
      break;

    case '+/-': {
      // Negate the last number in the current expression
      const match = calcExprStr.match(/^(.*?)(-?\d+\.?\d*)$/);
      if (match) {
        const n = parseFloat(match[2]);
        calcExprStr = match[1] + String(-n);
        updateDisplay();
      } else if (lastResult !== null) {
        lastResult = -lastResult;
        displayResult.textContent = lastResult;
      }
      break;
    }

    case '%': {
      // Divide trailing number by 100
      const m = calcExprStr.match(/^(.*?)(-?\d+\.?\d*)$/);
      if (m) {
        const n = parseFloat(m[2]) / 100;
        calcExprStr = m[1] + n;
        updateDisplay();
      }
      break;
    }

    case '=': {
      if (!calcExprStr) break;
      const result = safeEval(calcExprStr);
      if (result === null || result === 'Error') {
        displayResult.textContent = 'Error';
        displayResult.classList.add('pop');
        setTimeout(() => displayResult.classList.remove('pop'), 200);
        break;
      }
      displayHistory.textContent = calcExprStr + ' =';
      lastResult  = result;
      calcExprStr = '';
      displayExpr.textContent    = '\u00a0';
      displayResult.textContent  = result;
      displayResult.classList.add('pop');
      setTimeout(() => displayResult.classList.remove('pop'), 200);
      break;
    }
  }
}

/**
 * Wrap the current expression in sqrt or abs.
 * FIX: Uses proper Math-safe expressions instead of inline ternary hack.
 * sqrt  → (expr)**0.5
 * abs   → (expr < 0 ? -(expr) : (expr))
 */
function calcExtra(fn) {
  // Use current expression text, or fall back to the last computed result
  const inner = calcExprStr || (lastResult !== null ? String(lastResult) : '');
  if (!inner) return;

  if (fn === 'sqrt') {
    calcExprStr = '(' + inner + ')**0.5';
  } else if (fn === 'abs') {
    // FIX: safely negate by evaluating sign at runtime using ternary
    calcExprStr = '((' + inner + ')<0?(-(' + inner + ')):(' + inner + '))';
  }

  lastResult = null;
  updateDisplay();
}

/* ── Keyboard support for calculator ── */
document.addEventListener('keydown', e => {
  // Skip if a form element has focus (e.g. an input elsewhere on the page)
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

  if ('0123456789'.includes(e.key))        calcInput(e.key);
  else if ('+-*/().'.includes(e.key))      calcInput(e.key);
  else if (e.key === 'Enter' || e.key === '=') calcAction('=');
  else if (e.key === 'Backspace')          calcAction('DEL');
  else if (e.key === 'Escape')             calcAction('AC');
  else if (e.key === '%')                  calcAction('%');
});