export const audio: {
  ensure(): void;
  resume(): void;
  click(): void;
  whoosh(duration?: number): void;
  setTension(t: number): void;
  fireRoar(): void;
  fadeRoar(seconds?: number): void;
  spaceHum(): void;
  fadeHum(seconds?: number): void;
  stopLaunch(): void;
};
