export class LazyKeyboard {
  private keysDown: Set<string> = new Set();

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keysDown.add(e.key);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysDown.delete(e.key);
  };

  private onBlur = () => {
    this.keysDown.clear();
  };

  keyIsDown(code: string): boolean {
    return this.keysDown.has(code);
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
  }
}
