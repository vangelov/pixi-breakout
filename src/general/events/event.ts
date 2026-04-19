export class Event<T = undefined> {
  target: T;

  constructor(target: T) {
    this.target = target;
  }
}
