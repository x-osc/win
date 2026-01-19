export class HistoryManager {
  stack = $state<string[]>([]);
  index = $state(0);

  current = $derived(this.stack[this.index]);
  canGoBack = $derived(this.index > 0);
  canGoForward = $derived(this.index < this.stack.length - 1);

  push(url: string) {
    if (this.current === url) return;
    this.stack = [...this.stack.slice(0, this.index + 1), url];
    this.index = this.stack.length - 1;
  }

  back() {
    if (this.canGoBack) {
      this.index--;
    }
  }

  forward() {
    if (this.canGoForward) {
      this.index++;
    }
  }
}
