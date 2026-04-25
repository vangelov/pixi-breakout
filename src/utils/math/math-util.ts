import { Container } from "pixi.js";

const start = performance.now();
export class Utils {
  static clamp(value: number, max = 1, min = 0) {
    if (value > max) return max;
    if (value < min) return min;
    return value;
  }

  static getTimer() {
    return performance.now() - start;
  }

  static emitBubblingEvent(
    container: Container,
    event: string,
    data?: unknown,
  ) {
    container.emit(event, data);

    let current = container.parent;
    while (current) {
      current.emit(event, data);
      current = current.parent;
    }
  }
}
