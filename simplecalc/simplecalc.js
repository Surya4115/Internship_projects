let currentInput = '0';
let previousInput = '';
let operator = null;
let shouldResetScreen = false;

const currentDisplay = document.getElementById('current');
const previousDisplay = document.getElementById('previous');

function updateDisplay() {
  currentDisplay.textContent = currentInput;
  previousDisplay.textContent = previousInput;
}

function appendNumber(number) {
  if (shouldResetScreen) {
    currentInput = '';
    shouldResetScreen = false;
  }
  if (currentInput === '0') {
    currentInput = number;
  } else {
    if (currentInput.length < 12) {
      currentInput += number;
    }
  }
  updateDisplay();
}

function appendDecimal() {
  if (shouldResetScreen) {
    currentInput = '0';
    shouldResetScreen = false;
  }
  if (!currentInput.includes('.')) {
    currentInput += '.';
  }
  updateDisplay();
}

function backspace() {
  if (shouldResetScreen) return;
  if (currentInput.length <= 1) {
    currentInput = '0';
  } else {
    currentInput = currentInput.slice(0, -1);
  }
  updateDisplay();
}

function appendOperator(op) {
  if (operator !== null && !shouldResetScreen) {
    calculate();
  }
  previousInput = `${currentInput} ${op}`;
  operator = op;
  shouldResetScreen = true;
  updateDisplay();
}

function calculate() {
  if (operator === null || shouldResetScreen) return;

  let computation;
  const prev = parseFloat(previousInput.split(' ')[0]);
  const current = parseFloat(currentInput);

  if (isNaN(prev) || isNaN(current)) return;

  switch (operator) {
    case '+':
      computation = prev + current;
      break;
    case '-':
      computation = prev - current;
      break;
    case '*':
      computation = prev * current;
      break;
    case '/':
      if (current === 0) {
        alert("Can't divide by zero!");
        clearAll();
        return;
      }
      computation = prev / current;
      break;
    default:
      return;
  }

  currentInput = Number.isInteger(computation)
    ? computation.toString()
    : parseFloat(computation.toFixed(8)).toString();

  previousInput = '';
  operator = null;
  shouldResetScreen = true;
  updateDisplay();
}

function clearAll() {
  currentInput = '0';
  previousInput = '';
  operator = null;
  shouldResetScreen = false;
  updateDisplay();
}

function percent() {
  if (currentInput === '0') return;
  currentInput = (parseFloat(currentInput) / 100).toString();
  updateDisplay();
}

// Keyboard support
document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') appendNumber(e.key);
  else if (e.key === '.') appendDecimal();
  else if (e.key === '+') appendOperator('+');
  else if (e.key === '-') appendOperator('-');
  else if (e.key === '*') appendOperator('*');
  else if (e.key === '/') appendOperator('/');
  else if (e.key === 'Enter' || e.key === '=') calculate();
  else if (e.key === 'Backspace') backspace();
  else if (e.key === 'Escape') clearAll();
});

// Initialize
updateDisplay();
