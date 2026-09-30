// Global overlay drawn once per frame on top of the scene (before the tone shoulder, so it gets grain):
// cinematic letterbox bars, a camcorder/VHS "REC" overlay, and a singer tag (which character is singing).
import { Layer2D, W, H } from './gl';
import { rgba } from './palette';
import { F, font } from './type';
import { clamp, frameIdx } from './util';

export interface HudState {
  opacity: number;
  /** 0..1: letterbox bars sliding in to 2.39:1. */
  letterbox: number;
  /** 0..1: camcorder overlay (REC dot, timecode, corner brackets). */
  rec: number;
  /** Singer tag text ('' = none), and its 0..1 visibility. */
  tag: string;
  tagA: number;
  /** Colour key of the tag accent. */
  tagColor: string;
}

export class Hud {
  private layer = new Layer2D();
  private lastKey = '';

  draw(t: number, s: HudState) {
    const vis = s.opacity > 0.001 && (s.rec > 0.001 || (s.tag && s.tagA > 0.001));
    const key = vis ? `${s.opacity.toFixed(3)}|${s.letterbox.toFixed(3)}|${s.rec.toFixed(3)}|${s.tag}|${s.tagA.toFixed(3)}|${s.rec > 0 ? frameIdx(t) >> 1 : 0}` : 'off';
    if (key === this.lastKey) return this.layer.texture;
    this.lastKey = key;
    const c = this.layer.ctx;
    this.layer.clear();
    if (!vis) return this.layer.upload();
    c.globalAlpha = s.opacity;
    if (s.rec > 0) {
      c.save();
      c.globalAlpha = s.opacity * s.rec;
      const m = 70, L = 60;
      c.strokeStyle = rgba('bone', 0.85);
      c.lineWidth = 3;
      for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]] as const) {
        c.beginPath(); c.moveTo(x, y + dy * L); c.lineTo(x, y); c.lineTo(x + dx * L, y); c.stroke();
      }
      const blink = (frameIdx(t) >> 4) % 2 === 0;
      if (blink) { c.fillStyle = '#ff2a2a'; c.beginPath(); c.arc(m + 40, m + 44, 11, 0, Math.PI * 2); c.fill(); }
      c.font = font(F.mono(600), 30);
      c.fillStyle = rgba('bone', 0.9);
      c.textBaseline = 'middle';
      c.fillText('REC', m + 62, m + 45);
      const tc = Math.max(0, t);
      const hh = Math.floor(tc / 60), ss = Math.floor(tc % 60), ff = Math.floor((tc % 1) * 30);
      c.textAlign = 'right';
      c.fillText(`00:${String(hh).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`, W - m - 20, m + 45);
      c.font = font(F.mono(500), 24);
      c.fillText('SP ▶', W - m - 20, H - m - 40);
      c.textAlign = 'left';
      c.fillText('RIFT-CAM 01', m + 20, H - m - 40);
      c.restore();
    }
    if (s.tag && s.tagA > 0) {
      c.save();
      c.globalAlpha = s.opacity * clamp(s.tagA);
      const x = 96, y = s.rec > 0.5 ? 1080 - 150 : s.letterbox > 0.5 ? 84 : 110;
      c.font = font(F.mono(600), 20);
      c.letterSpacing = '4px';
      c.fillStyle = rgba(s.tagColor, 1);
      c.fillRect(x, y - 30, 6, 36);
      c.fillStyle = rgba('bone', 0.92);
      c.textBaseline = 'alphabetic';
      c.fillText(s.tag, x + 20, y);
      c.restore();
    }
    return this.layer.upload();
  }
}
