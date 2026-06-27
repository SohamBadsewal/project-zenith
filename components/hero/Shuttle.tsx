'use client';

import { useRef, useEffect, useMemo, Suspense } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';
import { useZenith } from '@/store/useZenith';
import { audio } from './audio';
import { SmokeSystem } from './SmokeSystem';

const MODEL_URL = '/Challenger.glb';
const DRACO_PATH = '/draco/';
const MAGNIFY_DURATION = 2.5;

function enhanceMaterials(scene: THREE.Object3D) {
  const bells: THREE.Mesh[] = [];
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mm) => {
      const m = mm as THREE.MeshStandardMaterial;
      if (m.metalness !== undefined) m.metalness = Math.min(1, (m.metalness ?? 0) + 0.15);
      if (m.roughness !== undefined) m.roughness = Math.max(0.2, (m.roughness ?? 1) - 0.15);
      m.envMapIntensity = 1.4;
    });
    const name = (o.name + ' ' + ((mesh.material as THREE.Material)?.name || '')).toLowerCase();
    if (/engine|bell|nozzle|thruster|exhaust/.test(name)) bells.push(mesh);
  });
  if (!bells.length) {
    const sorted: THREE.Mesh[] = [];
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) sorted.push(o as THREE.Mesh);
    });
    sorted.sort((a, b) => a.getWorldPosition(new THREE.Vector3()).y - b.getWorldPosition(new THREE.Vector3()).y);
    bells.push(...sorted.slice(0, 3));
  }
  bells.forEach((b) => {
    const mats = Array.isArray(b.material) ? b.material : [b.material];
    mats.forEach((mm) => {
      const m = mm as THREE.MeshStandardMaterial;
      if (m.emissive) {
        m.emissive = new THREE.Color('#ff7a18');
        m.emissiveIntensity = 0;
        m.toneMapped = false;
      }
    });
  });
}

function ShuttleModel() {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const engLight = useRef<THREE.PointLight>(null);
  const engGlow = useRef<THREE.PointLight>(null);
  const { scene } = useGLTF(MODEL_URL, DRACO_PATH);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    enhanceMaterials(c);
    return c;
  }, [scene]);
  const { camera } = useThree();
  const launch = useZenith((s) => s.launch);
  const tension = useZenith((s) => s.tension);
  const launchedAt = useZenith((s) => s.launchedAt);
  const finishMagnify = useZenith((s) => s.finishMagnify);
  const shuttleRect = useZenith((s) => s.shuttleRect);
  const magnifyTl = useRef<gsap.core.Timeline | null>(null);
  const launchTl = useRef<gsap.core.Timeline | null>(null);
  const prev = useRef<string>('idle');

  useEffect(() => {
    const g = group.current;
    if (!g) return;
    if (launch === 'magnifying' && prev.current === 'idle') {
      let startPos = new THREE.Vector3(0, 2, 0);
      let startScale = 0.05;
      if (shuttleRect) {
        const clientX = shuttleRect.left + shuttleRect.width / 2;
        const clientY = shuttleRect.top + shuttleRect.height / 2;
        const ndcX = (clientX / window.innerWidth) * 2 - 1;
        const ndcY = -(clientY / window.innerHeight) * 2 + 1;
        const temp = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
        const dir = temp.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        startPos = camera.position.clone().add(dir.multiplyScalar(distance));
        let shuttleWorldHeight = 15;
        const box = new THREE.Box3().setFromObject(cloned);
        const measured = (box.max.y - box.min.y) * 1.4;
        if (measured > 0) shuttleWorldHeight = measured;
        const pc = camera as THREE.PerspectiveCamera;
        const visibleH = 2 * distance * Math.tan((pc.fov * Math.PI) / 360);
        const targetWorldHeight = (shuttleRect.height / window.innerHeight) * visibleH;
        startScale = THREE.MathUtils.clamp(targetWorldHeight / shuttleWorldHeight, 0.01, 0.15);
      }
      gsap.killTweensOf(g.scale);
      gsap.killTweensOf(g.position);
      g.scale.setScalar(startScale);
      g.position.copy(startPos);
      g.rotation.set(0, 0, 0);
      g.visible = true;
      if (inner.current) {
        inner.current.position.set(0, 0, 0);
        inner.current.rotation.set(0, 0, 0);
      }
      audio.click();
      audio.whoosh(MAGNIFY_DURATION);
      magnifyTl.current = gsap
        .timeline()
        .to(g.scale, { x: 1.06, y: 1.06, z: 1.06, duration: MAGNIFY_DURATION * 0.82, ease: 'expo.inOut' })
        .to(g.scale, { x: 1, y: 1, z: 1, duration: MAGNIFY_DURATION * 0.18, ease: 'power2.out' })
        .to(g.position, { x: 0, y: 0, z: 0, duration: MAGNIFY_DURATION * 0.9, ease: 'power3.inOut' }, 0)
        .call(() => finishMagnify());
    }
    if (launch === 'launched' && !launchTl.current) {
      audio.fireRoar();
      const obj = { y: 0 };
      launchTl.current = gsap.timeline().to(obj, {
        y: 300,
        duration: 5.5,
        ease: 'power2.in',
        onUpdate: () => {
          if (inner.current) inner.current.position.y = obj.y;
        },
      });
    }
    prev.current = launch;
  }, [launch, camera, cloned, finishMagnify, shuttleRect]);

  useFrame((state) => {
    if (!inner.current) return;
    const t = state.clock.elapsedTime;
    if (launch === 'dragging') {
      const j = tension;
      inner.current.position.x = Math.sin(t * 70) * j * 0.018;
      inner.current.position.z = Math.cos(t * 53) * j * 0.018;
      inner.current.rotation.x = Math.sin(t * 90) * j * 0.008;
      inner.current.rotation.z = Math.sin(t * 64) * j * 0.01;
      audio.setTension(j);
    } else if (launch === 'launched') {
      const e = (performance.now() - launchedAt) / 1000;
      const decay = Math.max(0, 1 - e / 1.5);
      inner.current.position.x = Math.sin(t * 80) * 0.03 * decay;
      inner.current.rotation.z = 0.04 + Math.sin(t * 30) * 0.02 * decay;
      audio.setTension(Math.max(0, 1 - e / 5));
    } else if (launch === 'armed') {
      inner.current.position.set(0, inner.current.position.y, 0);
      inner.current.rotation.set(0, 0, 0);
    }

    let glowTarget = 0;
    if (launch === 'magnifying') glowTarget = 0.05;
    else if (launch === 'armed') glowTarget = 0.1;
    else if (launch === 'dragging') glowTarget = 1 + tension * 6;
    else if (launch === 'launched') glowTarget = 14;
    if (engGlow.current) engGlow.current.intensity = THREE.MathUtils.lerp(engGlow.current.intensity, glowTarget, 0.12);
    if (engLight.current) engLight.current.intensity = THREE.MathUtils.lerp(engLight.current.intensity, glowTarget * 2, 0.1);
  });

  return (
    <group ref={group} visible={false} scale={[0, 0, 0]}>
      <group ref={inner}>
        <primitive object={cloned} scale={1.4} position={[0, -3, 0]} />
        <pointLight ref={engLight} position={[0, -2.6, 0]} color="#ff7a18" intensity={0} distance={16} decay={2} />
        <pointLight ref={engGlow} position={[0, -3.2, 0]} color="#ff8a3a" intensity={0} distance={22} decay={2} />
        <SmokeSystem position={[0, -2.4, 0]} />
      </group>
    </group>
  );
}

export function Shuttle() {
  return (
    <Suspense fallback={null}>
      <ShuttleModel />
    </Suspense>
  );
}

useGLTF.preload(MODEL_URL, DRACO_PATH);
