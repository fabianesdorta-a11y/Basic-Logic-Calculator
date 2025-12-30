document.addEventListener("DOMContentLoaded", function () {
  // Elementos del DOM
  const expressionEl = document.getElementById("expression");
  const resultEl = document.getElementById("result");
  const clearBtn = document.getElementById("clear");
  const deleteBtn = document.getElementById("delete");
  const calculateBtn = document.getElementById("calculate");
  const historyList = document.getElementById("historyList");
  const clearHistoryBtn = document.getElementById("clearHistory");
  const toggleHistoryBtn = document.getElementById("toggleHistory");
  const historyContent = document.getElementById("historyContent");

  let currentExpression = "";
  let history = JSON.parse(localStorage.getItem("logicCalculatorHistory")) || [
    {
      expression: "p ∧ q",
      result: "Verdadero",
      values: { p: 1, q: 1 },
      timestamp: Date.now() - 100000,
    },
    {
      expression: "¬p → q",
      result: "Falso",
      values: { p: 1, q: 0 },
      timestamp: Date.now() - 50000,
    },
  ];

  // Toggle para historial
  toggleHistoryBtn.addEventListener("click", function () {
    historyContent.classList.toggle("collapsed");
    const icon = toggleHistoryBtn.querySelector("i");
    if (historyContent.classList.contains("collapsed")) {
      icon.className = "fas fa-chevron-up";
    } else {
      icon.className = "fas fa-chevron-down";
    }
  });


  updateHistoryDisplay();

 
  document
    .querySelectorAll(".key:not(#clear):not(#delete):not(#calculate)")
    .forEach((key) => {
      key.addEventListener("click", () => {
        const value = key.getAttribute("data-value");
        addToExpression(value);
      });
    });


  function addToExpression(value) {
    const lastChar = currentExpression[currentExpression.length - 1];
    const isOperator = ["∧", "∨", "→", "↔", "=", "≠", "¬"].includes(value);
    

    if (["∧", "∨", "→", "↔", "=", "≠"].includes(value)) {
      currentExpression += ` ${value} `;
    }

    else if (value === "¬") {
      currentExpression += value;
    }
 
    else if (value === "(" || value === ")") {
      currentExpression += value;
    }
   
    else {
  
      if (currentExpression === "" || 
          ["(", "¬", " "].includes(lastChar) || 
          ["∧", "∨", "→", "↔", "=", "≠"].includes(lastChar)) {
        currentExpression += value;
      } else {
        currentExpression += ` ${value}`;
      }
    }
    
    updateExpressionDisplay();
  }


  clearBtn.addEventListener("click", () => {
    currentExpression = "";
    updateExpressionDisplay();
    resultEl.textContent = "Resultado: ";
    resultEl.className = "result";
  });

  deleteBtn.addEventListener("click", () => {

    if (currentExpression.endsWith("  ")) {
      currentExpression = currentExpression.slice(0, -3);
    } else if (currentExpression.endsWith(" ")) {
      currentExpression = currentExpression.slice(0, -1);
    } else {
      currentExpression = currentExpression.slice(0, -1);
    }
    updateExpressionDisplay();
  });

 
  calculateBtn.addEventListener("click", calculateExpression);

  clearHistoryBtn.addEventListener("click", () => {
    if (confirm("¿Estás seguro de que deseas limpiar el historial?")) {
      history = [];
      localStorage.setItem("logicCalculatorHistory", JSON.stringify(history));
      updateHistoryDisplay();
    }
  });


  function updateExpressionDisplay() {
    expressionEl.textContent = `Expresión: ${currentExpression || " "}`;
  }


  function calculateExpression() {
    if (!currentExpression.trim()) {
      alert("Por favor ingresa una expresión lógica");
      return;
    }

    try {
   
      const variables = ["p", "q", "r", "s"];
      const foundVariables = variables.filter(v => 
        currentExpression.includes(v)
      );

      if (foundVariables.length === 0) {
     
        const result = evaluateExpression(currentExpression, {});
        const resultText = result ? "Verdadero" : "Falso";
        
        resultEl.textContent = `Resultado: ${resultText}`;
        resultEl.className = result ? "result flash-true" : "result false flash-false";
        
    
        const historyItem = {
          expression: currentExpression,
          result: resultText,
          values: {},
          timestamp: Date.now(),
        };
        
        history.unshift(historyItem);
        if (history.length > 20) history.pop();
        localStorage.setItem("logicCalculatorHistory", JSON.stringify(history));
        updateHistoryDisplay();
        return;
      }

     
      const numVariables = foundVariables.length;
      const totalCombinations = Math.pow(2, numVariables);
      let hasTrue = false;
      let hasFalse = false;
      let exampleTrue = null;
      let exampleFalse = null;

 
      for (let i = 0; i < totalCombinations; i++) {
        const values = {};
        
        for (let j = 0; j < numVariables; j++) {
          const variable = foundVariables[j];
       
          values[variable] = (i >> (numVariables - 1 - j)) & 1;
        }

        const result = evaluateExpression(currentExpression, values);
        
        if (result && !exampleTrue) {
          exampleTrue = { values: { ...values }, result: true };
          hasTrue = true;
        } else if (!result && !exampleFalse) {
          exampleFalse = { values: { ...values }, result: false };
          hasFalse = true;
        }
        
     
        if (hasTrue && hasFalse) break;
      }

      
      let resultText, valuesText;
      
      if (hasTrue && !hasFalse) {
        resultText = "Tautología (siempre verdadera)";
        valuesText = exampleTrue ? Object.keys(exampleTrue.values)
          .map(v => `${v}=${exampleTrue.values[v]}`)
          .join(", ") : "";
      } else if (!hasTrue && hasFalse) {
        resultText = "Contradicción (siempre falsa)";
        valuesText = exampleFalse ? Object.keys(exampleFalse.values)
          .map(v => `${v}=${exampleFalse.values[v]}`)
          .join(", ") : "";
      } else {
        resultText = "Contingencia (depende de valores)";
        valuesText = exampleTrue ? 
          `Ejemplo verdadero: ${Object.keys(exampleTrue.values)
            .map(v => `${v}=${exampleTrue.values[v]}`)
            .join(", ")}` : "";
      }

      resultEl.textContent = `Resultado: ${resultText}${valuesText ? ` (${valuesText})` : ''}`;
      resultEl.className = exampleTrue ? "result flash-true" : "result false flash-false";

  
      const historyItem = {
        expression: currentExpression,
        result: resultText,
        values: exampleTrue ? exampleTrue.values : (exampleFalse ? exampleFalse.values : {}),
        timestamp: Date.now(),
      };

      history.unshift(historyItem);
      if (history.length > 20) history.pop();
      localStorage.setItem("logicCalculatorHistory", JSON.stringify(history));
      
      updateHistoryDisplay();
      
    } catch (error) {
      resultEl.textContent = `Error: Expresión inválida`;
      resultEl.className = "result false";
      console.error("Error en evaluación:", error);
    }
  }


  function evaluateExpression(expr, values) {
    let evalExpr = expr;
    
  
    for (const [varName, value] of Object.entries(values)) {
      const regex = new RegExp(`\\b${varName}\\b`, "g");
      evalExpr = evalExpr.replace(regex, value);
    }

 
    evalExpr = evalExpr
      .replace(/1/g, "true")
      .replace(/0/g, "false");

 
    evalExpr = evalExpr
      .replace(/¬/g, "!")
      .replace(/∧/g, "&&")
      .replace(/∨/g, "||")
      .replace(/→/g, "=>")
      .replace(/↔/g, "==")
      .replace(/=/g, "==")
      .replace(/≠/g, "!=");

    evalExpr = evalExpr.replace(/([^=])=>([^=])/g, "!$1||$2");

    try {

      const evalFunc = new Function(`return ${evalExpr}`);
      const result = evalFunc();
      
  
      return Boolean(result);
    } catch (e) {
      throw new Error("Expresión inválida: " + e.message);
    }
  }

  function updateHistoryDisplay() {
    historyList.innerHTML = "";

    if (history.length === 0) {
      historyList.innerHTML =
        '<div class="history-item">Pequeña, escribe algo...</div>';
      return;
    }

    history.forEach((item) => {
      const historyItem = document.createElement("div");
      historyItem.className = "history-item";

      const valuesText = Object.keys(item.values)
        .map((v) => `${v}=${item.values[v]}`)
        .join(", ");

      historyItem.innerHTML = `
        <div class="history-expression">${item.expression}</div>
        <div class="history-result ${item.result.includes("Verdadero") || item.result.includes("Tautología") ? "" : "false"}">
          Resultado: ${item.result} ${valuesText ? `(${valuesText})` : ''}
          <span class="history-time">${formatTime(item.timestamp)}</span>
        </div>
      `;

      historyList.appendChild(historyItem);
    });
  }
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays} d`;

    return date.toLocaleDateString();
  }

  
  document.addEventListener("keydown", (e) => {
    const keyMap = {
      "0": "0",
      "1": "1",
      "p": "p",
      "q": "q",
      "r": "r",
      "s": "s",
      "n": "¬",
      "&": "∧",
      "|": "∨",
      "(": "(",
      ")": ")",
      "-": "→", 
      "=": "=",
      "!": "≠",
      "Enter": "calculate",
      "Backspace": "delete",
      "Delete": "clear",
      "Escape": "clear",
    };

    if (keyMap[e.key]) {
      e.preventDefault();
      
      if (keyMap[e.key] === "calculate") {
        calculateExpression();
      } else if (keyMap[e.key] === "delete") {
        deleteBtn.click();
      } else if (keyMap[e.key] === "clear") {
        clearBtn.click();
      } else {
        addToExpression(keyMap[e.key]);
      }
    }
  });
});