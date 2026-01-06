<script lang="ts">
  import type { AppApi } from "@core/app/api";
  import type { WindowApi } from "@core/wm/wm.svelte";
  import { doError } from "../../game/error";

  let display: string = $state("0");
  let previous: number | null = null;
  let operator: string | null = null;
  let resetNext: boolean = false;

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  function inputDigit(d: number) {
    let digit = d.toString();
    if (resetNext) {
      display = digit;
      resetNext = false;
    } else {
      display = display === "0" ? digit : display + digit;
    }
  }

  function inputDot() {
    if (resetNext) {
      display = "0.";
      resetNext = false;
      return;
    }
    if (!display.includes(".")) display += ".";
  }

  function clear() {
    display = "0";
    previous = null;
    operator = null;
    resetNext = false;
  }

  function applyOperator(op: string) {
    if (!resetNext) compute();
    previous = parseFloat(display);
    operator = op;
    resetNext = true;
  }

  function compute() {
    if (operator == null || previous == null) return;
    const current = parseFloat(display);
    let result;

    switch (operator) {
      case "+":
        result = previous + current;
        break;
      case "-":
        result = previous - current;
        break;
      case "*":
        result = previous * current;
        break;
      case "/":
        if (current === 0) {
          result = "ERROR !!!!";
          doError(api);

          break;
        }

        result = previous / current;
        break;
    }

    display = String(result);
    previous = null;
    operator = null;
    resetNext = true;
  }
</script>

<div class="calculator">
  <div class="display">{display}</div>

  <button class="clear" onclick={clear}>C</button>
  <button class="operator" onclick={() => applyOperator("/")}>÷</button>

  <button onclick={() => inputDigit(7)}>7</button>
  <button onclick={() => inputDigit(8)}>8</button>
  <button onclick={() => inputDigit(9)}>9</button>
  <button class="operator" onclick={() => applyOperator("*")}>×</button>

  <button onclick={() => inputDigit(4)}>4</button>
  <button onclick={() => inputDigit(5)}>5</button>
  <button onclick={() => inputDigit(6)}>6</button>
  <button class="operator" onclick={() => applyOperator("-")}>−</button>

  <button onclick={() => inputDigit(1)}>1</button>
  <button onclick={() => inputDigit(2)}>2</button>
  <button onclick={() => inputDigit(3)}>3</button>
  <button class="operator" onclick={() => applyOperator("+")}>+</button>

  <button onclick={() => inputDigit(0)}>0</button>
  <button onclick={inputDot}>.</button>
  <button class="equal" onclick={compute}>=</button>
</div>

<style>
  .calculator {
    max-width: 400px;
    padding: 12px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .display {
    border: #555 solid 2px;
    grid-column: 1 / -1;
    padding: 10px;
    text-align: right;
    font-size: 1.5rem;
  }

  button {
    padding: 10px;
  }

  .equal {
    grid-column: span 2;
  }
  .clear {
    grid-column: span 3;
  }
</style>
