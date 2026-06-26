'use client';

import { EnvironmentRig } from './EnvironmentRig';
import { CameraRig } from './CameraRig';
import { Shuttle } from './Shuttle';
import { LaunchPad } from './LaunchPad';

export function HeroScene() {
  return (
    <>
      <color attach="background" args={['#020510']} />
      <fog attach="fog" args={['#020510', 80, 280]} />
      <EnvironmentRig />
      <CameraRig />
      <Shuttle />
      <LaunchPad />
    </>
  );
}
