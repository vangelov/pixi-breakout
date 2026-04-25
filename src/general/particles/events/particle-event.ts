import { Event } from "../../events/event";
import { Particle } from "../particle";

export class ParticleEvent extends Event<Particle> {
  static DIE = "particle_event_die";
}
