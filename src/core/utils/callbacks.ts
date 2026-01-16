// TODO: rename
export type OnFunction<
  TEventMap extends Record<string, (...args: any[]) => void>,
> = CallbackManager<TEventMap>["on"];
export type OnceFunction<
  TEventMap extends Record<string, (...args: any[]) => void>,
> = CallbackManager<TEventMap>["once"];
export type OffFunction<
  TEventMap extends Record<string, (...args: any[]) => void>,
> = CallbackManager<TEventMap>["off"];

/**
 * extract parameter values as array from method signatures
 */
type EventMap<T> = {
  [K in keyof T]: T[K] extends (...args: infer P) => void ? P : never;
};

/**
 * you must use type and not interface for the generic param
 * typescript jank
 * https://github.com/microsoft/TypeScript/issues/15300
 */
export class CallbackManager<
  TEventMap extends Record<string, (...args: any[]) => void> = Record<
    string,
    (...args: any[]) => void
  >,
> {
  private callbacks = new Map<string, Array<(...args: any[]) => void>>();

  on<K extends keyof TEventMap>(
    event: K,
    callback: (...args: EventMap<TEventMap>[K]) => void,
  ): () => void;

  on(event: string, callback: (...args: any[]) => void): () => void {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event)!.push(callback);
    } else {
      this.callbacks.set(event, [callback]);
    }

    return () => this.off(event, callback);
  }

  once<K extends keyof TEventMap>(
    event: K,
    callback: (...args: EventMap<TEventMap>[K]) => void,
  ): () => void;

  once(event: string, callback: (...args: any[]) => void): () => void {
    const wrappedCallback = (...args: any[]) => {
      this.off(event, wrappedCallback);
      callback(...args);
    };

    return this.on(event, wrappedCallback);
  }

  off<K extends keyof TEventMap>(
    event: K,
    callback?: (...args: EventMap<TEventMap>[K]) => void,
  ): void;

  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.callbacks.has(event)) {
      console.warn(`Tried to remove callback from unknown event "${event}"`);
      return;
    }

    if (callback === undefined) {
      this.callbacks.delete(event);
      return;
    }

    const callbacks = this.callbacks.get(event)!;
    const index = callbacks.indexOf(callback);

    // use index rather than filter for perf reasons
    if (index > -1) {
      callbacks.splice(index, 1);

      if (callbacks.length === 0) {
        this.callbacks.delete(event);
      }
    }
  }

  emit<K extends keyof TEventMap>(
    event: K,
    ...args: EventMap<TEventMap>[K]
  ): void;

  emit(event: string, ...args: any[]): void {
    if (!this.callbacks.has(event)) {
      return;
    }

    // create copy to avoid issues if callbacks modify array somehow
    const callbacks = [...this.callbacks.get(event)!];

    callbacks.forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(
          `Error in callback for event "${String(event)}": `,
          error,
        );
      }
    });
  }

  hasListeners(event: string): boolean {
    return this.callbacks.has(event)
      ? this.callbacks.get(event)!.length > 0
      : false;
  }

  listenerCount(event: string): number {
    return this.callbacks.has(event) ? this.callbacks.get(event)!.length : 0;
  }

  events(): string[] {
    return Array.from(this.callbacks.keys());
  }

  // removeAllListeners(): void {
  //   this.callbacks.clear();
  // }
}
