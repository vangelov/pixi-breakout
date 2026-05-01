import { Assets } from "pixi.js";
import "@pixi/sound";
import { PlayOptions, Sound } from "@pixi/sound";

const bundle = [
  { alias: "ball-paddle", src: "assets/ball-paddle.mp3" },
  { alias: "ball-wall", src: "assets/ball-wall.mp3" },
  { alias: "music", src: "assets/juicy_breakout-theme.mp3" },
  { alias: "pling1", src: "assets/pling1.mp3" },
  { alias: "pling2", src: "assets/pling2.mp3" },
  { alias: "pling3", src: "assets/pling3.mp3" },
  { alias: "pling4", src: "assets/pling4.mp3" },
  { alias: "pling5", src: "assets/pling5.mp3" },
  { alias: "pling6", src: "assets/pling6.mp3" },
  { alias: "pling7", src: "assets/pling7.mp3" },
  { alias: "pling8", src: "assets/pling8.mp3" },
  { alias: "pling9", src: "assets/pling9.mp3" },
  { alias: "pling10", src: "assets/pling10.mp3" },
  { alias: "pling11", src: "assets/pling11.mp3" },
  { alias: "pling12", src: "assets/pling12.mp3" },
];

export class SoundManager {
  static async init() {
    Assets.addBundle("sounds", bundle);
    await Assets.loadBundle("sounds");
  }

  static play(id: string, options?: PlayOptions) {
    const asset = Assets.get<Sound>(id);
    asset.play(options);
  }

  static stop(id: string) {
    const asset = Assets.get<Sound>(id);
    asset.stop();
  }

  static isPlaying(id: string) {
    const asset = Assets.get<Sound>(id);
    return asset.isPlaying;
  }
}
