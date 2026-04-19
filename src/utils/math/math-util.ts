export class MathUtil {
  static clamp(value: number, max = 1, min = 0) {
    if (value > max) return max;
    if (value < min) return min;
    return value;
  }
}
