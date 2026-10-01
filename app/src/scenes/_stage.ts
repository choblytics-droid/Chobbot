// Stage: the shared base of the 3D plates. Owns a three.js scene with the sky, a camera with
// handheld/shake helpers, the two voxel characters, 3D and 2D particle batches and one Canvas2D UI
// layer. Subclasses build their set in `build()` and animate everything in `update()`, returning
// post overrides. Render order: sky -> world (depth) -> 3D particles -> 2D particles -> UI layer.
import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { Sky } from '../engine/world';
import { VoxelChar, autoPose, makeChar, ContactShadow } from '../engine/voxel';
import type { MoveOpts } from '../engine/moves';
import { V2 } from '../config';
import { GodRays, TextHalo } from '../engine/atmos';
import { VENMAR, QUEST } from '../sprites/sprites';
import type { Line } from '../engine/lyrics';
import { noise1, pulse } from '../engine/util';

export type V3 = [number, number, number];

export abstract class Stage extends Scene {
  cam = new THREE.PerspectiveCamera(38, W / H, 0.5, 6000);
  world = new THREE.Scene();
  sky = new Sky();
  fx = new LineBatch(24000, { screen2D: false, worldWidth: true, blend: 'add', depthTest: true });
  fx2d = new LineBatch(6000, { blend: 'add' });
  ui = new Layer2D();
  venmar = makeChar(VENMAR);
  quest = makeChar(QUEST);
  /** v2: world y of the ground under the characters (null = no contact shadows), and the shadows. */
  groundY: number | null = null;
  shadows = V2 ? [new ContactShadow(), new ContactShadow()] : [];
  /** v2: light shafts from the rift (scenes with the sky); strength multiplier (0 = off). */
  rays = V2 ? new GodRays() : null;
  rayK = 1;
  /** v2: dark halo under the UI type (legibility); strength 0..1. */
  halo = V2 ? new TextHalo() : null;
  haloK = 0.72;
  /** Song time of the frame being rendered (for act()). */
  now = 0;
  /** Whether to draw the sky pass (off for plates that fill the frame with their own background). */
  useSky = true;
  uiUsed = false;
  clearCol: V3 = [0, 0, 0];

  override async init() {
    this.venmar.group.visible = false;
    this.quest.group.visible = false;
    this.world.add(this.venmar.group, this.quest.group);
    for (const s of this.shadows) this.world.add(s.mesh);
    await this.build();
  }

  abstract build(): void | Promise<void>;
  /** Optional custom full-frame background (replaces the sky / clear). */
  background?(out: THREE.WebGLRenderTarget): void;
  abstract update(f: Frame): PostOverrides;

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    this.fx.clear();
    this.fx2d.clear();
    this.uiUsed = false;
    this.ui.clear();
    this.venmar.fx({ t: f.t });
    this.quest.fx({ t: f.t });
    this.now = f.t;
    this.venmar.layers = []; this.quest.layers = [];
    const post = this.update(f);
    if (this.shadows.length) {
      [this.venmar, this.quest].forEach((ch, i) => (this.groundY === null ? (this.shadows[i]!.mesh.visible = false) : this.shadows[i]!.update(ch, this.groundY)));
    }
    this.cam.updateProjectionMatrix();
    this.cam.updateMatrixWorld();
    renderer.setRenderTarget(out);
    if (this.background) this.background(out);
    else if (this.useSky) this.sky.render(renderer, out, this.cam);
    else {
      renderer.setClearColor(new THREE.Color().setRGB(...this.clearCol, THREE.LinearSRGBColorSpace), 1);
      renderer.clear(true, true, true);
    }
    renderer.setRenderTarget(out);
    renderer.clearDepth();
    renderer.render(this.world, this.cam);
    if (this.rays && this.rayK > 0 && this.useSky && !this.background) {
      this.rays.render(renderer, this.sky, this.world, this.cam, out, this.rayK, this.shadows.map((s) => s.mesh));
      renderer.setRenderTarget(out);
    }
    this.fx.render(renderer, out, this.cam);
    this.fx2d.render(renderer, out);
    if (this.uiUsed) {
      const tex = this.ui.upload();
      if (this.halo && this.haloK > 0) this.halo.render(renderer, tex, out, this.haloK);
      comp.draw(renderer, tex, out);
    }
    return post;
  }

  /** Mark the UI layer as drawn this frame and return its context. */
  get c() { this.uiUsed = true; return this.ui.ctx; }

  // ---------------------------------------------------------------- camera
  /** Place the camera at `pos` looking at `target` with roll (rad), plus handheld drift. */
  look(pos: V3, target: V3, o: { roll?: number; fov?: number; hand?: number; t?: number; shake?: number } = {}) {
    const t = o.t ?? 0, h = o.hand ?? 0, s = o.shake ?? 0;
    const hx = (noise1(t * 0.7, 11) * h + noise1(t * 23, 3) * s), hy = (noise1(t * 0.6, 12) * h + noise1(t * 21, 4) * s);
    this.cam.position.set(pos[0] + hx, pos[1] + hy, pos[2]);
    this.cam.up.set(0, 1, 0);
    this.cam.lookAt(target[0] + hx * 0.3, target[1] + hy * 0.3, target[2]);
    this.cam.rotateZ((o.roll ?? 0) + noise1(t * 0.5, 13) * h * 0.004);
    if (o.fov) this.cam.fov = o.fov;
  }
  /** Camera on an orbit around `target`: yaw/pitch in radians, distance. */
  orbit(target: V3, yaw: number, pitch: number, dist: number, o: { roll?: number; fov?: number; hand?: number; t?: number; shake?: number } = {}) {
    const p: V3 = [target[0] + Math.sin(yaw) * Math.cos(pitch) * dist, target[1] + Math.sin(pitch) * dist, target[2] + Math.cos(yaw) * Math.cos(pitch) * dist];
    this.look(p, target, o);
  }

  // ---------------------------------------------------------------- characters
  /** Line being sung (or last started within 0.3 s) and its singer ('A' Venmar, 'B' Quest). */
  singing(t: number): { line: Line | null; who: 'A' | 'B' | null } {
    const ly = this.ctx.lyrics;
    const l = ly.lines.find((x) => t >= x.start - 0.05 && t < x.end + 0.25) ?? null;
    return { line: l, who: l ? ((l as any).singer ?? 'A') : null };
  }
  /** Place a character: position, yaw (rad), scale, auto pose from the music. */
  place(ch: VoxelChar, f: Frame, pos: V3, o: { yaw?: number; pitch?: number; roll?: number; scale?: number; hop?: number; seed?: number; sing?: boolean; energy?: number; move?: 'groove' | 'hiphop' | 'idle' | 'walk' | 'run' | 'fly' | 'none'; moveOpts?: MoveOpts } = {}) {
    ch.group.visible = true;
    const who = ch === this.venmar ? 'A' : 'B';
    const s = this.singing(f.t);
    const sing = o.sing ?? s.who === who;
    const seed = o.seed ?? (who === 'A' ? 0 : 5);
    if (ch.sculpt) {
      // v2: base layers (breathing + beat groove by default), blinks, jaw on the vocal; act() adds moves
      const au = this.ctx.audio;
      ch.cx = { beat: (t) => au.beatAt(t), bar: (t) => au.barAt(t), vocal: (t) => au.env('vocal', t), seed, sing, energy: o.energy ?? 1 };
      const mv = o.move ?? 'groove';
      ch.layers = [{ name: 'idle', t0: -1e9, o: {} }];
      if (mv !== 'none' && mv !== 'idle') ch.layers.push({ name: mv, t0: -1e9, o: { amp: 0.8, ...o.moveOpts } });
      ch.applyRig(f.t);
    } else ch.pose(autoPose(f.t, f.beat, { singing: sing, vocal: this.ctx.audio.env('vocal', f.t), seed, energy: o.energy }));
    const hop = (o.hop ?? 0) * Math.abs(Math.sin(f.beat * Math.PI));
    ch.group.position.set(pos[0], pos[1] + hop, pos[2]);
    ch.group.rotation.set(o.pitch ?? 0, o.yaw ?? 0, o.roll ?? 0);
    ch.group.scale.setScalar(o.scale ?? 1);
    return ch;
  }

  /** v2: play a move from moves.ts on a placed character, started at song time t0 (no-op on v1). */
  act(ch: VoxelChar, name: string, t0: number, o: MoveOpts = {}) {
    ch.act(name, t0, this.now, o);
    return ch;
  }

  // ---------------------------------------------------------------- music helpers
  kick(t: number, hl = 0.1) { return this.ctx.audio.hit('kick', t, hl); }
  snare(t: number, hl = 0.12) { return this.ctx.audio.hit('snare', t, hl); }
  bell(t: number, hl = 0.08) { return this.ctx.audio.hit('bell', t, hl); }
  /** Pulse on every downbeat (1 at the bar line, decaying). */
  bar(f: Frame, hl = 0.15) { return pulse(f.barPhase * (60 / this.ctx.audio.bpm) * 4, 0, hl); }
  /** Standard singer tag for the HUD. */
  tag(t: number): PostOverrides {
    const s = this.singing(t);
    if (!s.who) return { tagA: 0 };
    return { tag: s.who === 'A' ? 'A // VENMAR' : 'B // QUEST', tagA: 1, tagColor: s.who === 'A' ? 'cyan' : 'signal' };
  }
}
