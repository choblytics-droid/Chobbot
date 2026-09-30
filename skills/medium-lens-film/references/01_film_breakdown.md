# 01 — Film breakdown: 《光先到》 ("Light Arrives First")

Source studied: the 42 s Bilibili video (BV1jyaA6QEoH), 720×960 portrait at 30 fps (1,260 frames),
read at 10 fps and at every detected cut, plus the author's source-browser page (file list with
line counts and the header of `lens_halftone.glsl`). Every claim below comes from those frames or
that page; where a mapping is inferred (e.g. which file drew a moment), it says so.

## 1. The idea in one paragraph

A man sits slumped in an office chair at night in front of a chat window. That is the meme
"我瘫坐在椅子上，仿佛看到了原子弹爆炸" ("I slumped in my chair, as if I had seen an atomic bomb go off"),
taken literally. The camera dives into his screen, down to the RGB sub-pixels, and the blinking
text cursor collapses to a point of light and becomes the flash. Then physics supplies the title:
**light arrives first** (光先到). The soundtrack's own waveform, drawn at the end, is labelled
"3.2s 光到达（绝对静音）" (light arrives, absolute silence) and "27.6s 声音到达" (sound arrives): 24.4 s of
film fit between seeing the explosion and hearing it. In that gap the same mushroom cloud is shown as
**28 human ways of seeing** (同一朵云 · 28 种人类的观看方式), in historical order **from cave painting to
source code** (同一瞬间 · 洞穴壁画 → 源代码), then as the photoreal "real" cloud, reflected in his eye, in
his window, and across a whole city of windows. At 27.6 s the sound finally hits and the image
datamoshes. The man is still in his chair; the meme sentence types itself out. The closing cards
prove the craft: no image or footage was used (没有一张图片，没有一帧素材 — 画面由着色器逐像素计算),
each medium is one shader (每一种媒介 = 一段着色器), even the sound is synthesized in code
(声音也由代码合成 · 100% code · Opus 5.5).

## 2. Structure and timeline (seconds)

| Time | Act | What happens | Shader(s) (inferred from content + file list) |
|---|---|---|---|
| 0.0–0.2 | Cold open | Black, fade up | — |
| 0.2–1.3 | **Room** | Man slumped in office chair from behind, monitor glowing (chat UI), cold grey light, slow push | `shot_room` |
| 1.3–2.4 | Dive | Continuous push over his shoulder into the monitor; UI text becomes unreadable glyph-noise | `shot_room` → screen content |
| 2.4–3.2 | Sub-pixels | Into the chat input field: the blinking cursor, then the RGB stripe sub-pixel grid (moiré) | `lens_pixels` (RGB sub-pixel mask) |
| 3.1–3.3 | Collapse | Cursor line shrinks to a dot of light → anamorphic star flare | `shot_flash` |
| 3.3–3.4 | **Flash** | Full white-out | `shot_flash` |
| 3.4–3.8 | Real horizon | Dark plain, a glowing hemisphere (fireball) sitting on the horizon, horizontal lens streak | `shot_nuke` (early τ) |
| 3.8–4.4 | Flash 2 | White-out again ("light arrives") | `shot_flash` |
| 4.4–5.2 | **Media 1: cave** | White fades into a torch-lit cave wall: ochre hand-prints, red dot arcs, the fireball as a carved dome | `lens_cave` |
| 5.2–5.9 | Dunhuang | Cave rock **cracks and falls away** to reveal a Dunhuang mural behind (flame mandorla, rows of seated Buddhas, flying apsaras) | `lens_dunhuang` |
| 5.9–6.7 | Chinese ink | Mural **tears open**; ink landscape on xuan paper: fireball as a wash, calligraphy poem writes itself stroke by stroke, red seal | `lens_ink` |
| 6.6–7.35 | Porcelain | Cobalt **blooms out of the fireball like ink bleeding**, pull back: it is a painted blue-and-white meiping vase, rotating, window reflection sliding over the glaze | `lens_porcelain` |
| 7.35–7.95 | Ukiyo-e | Vase **sliced away by a curved wipe**; woodblock print is **printed block by block** (key line → flat colours → full), title cartouche 光先到 | `lens_ukiyoe` |
| 7.95–8.5 | Stained glass | A glowing hole **burns through the print** to a rose window with saints below, light flickering | `lens_stainedglass` |
| 8.5–9.0 | Etching | Lens-distorted wipe; steel engraving plate "PL. VII" with caption, hatched rays | `lens_etching` |
| 9.0–9.5 | Impasto | Hot paint **smears over the plate**; swirling thick-paint night sky (post-impressionist) | `lens_impasto` |
| 9.5–9.8 | Pointillism | Whip-pan blur, dots of pure colour | `lens_pointillism` |
| 9.85 | Flash | White frame | — |
| 9.9–10.1 | Daguerreotype | Oval brass-framed silver plate, rainbow tarnish, specular flare as the plate tilts | `lens_daguerreotype` |
| 10.1–10.4 | Cubism | Swish through a frame; faceted collage with newspaper scraps ("LUMIÈRE", "LE JOU…"), wood-grain paper | `lens_cubism` |
| 10.4–10.6 | Constructivism | Red/black propaganda poster, diagonal banner 光先到! with arrow | `lens_constructivist` |
| 10.6–10.8 | Newspaper | **Glass cracks** over it; 1945 号外 extra: 原子弹爆炸 wood-type headline, coarse halftone photo, a magnifying glass lying on it | `lens_halftone` |
| 10.85 | Flash | White frame | — |
| 10.9–11.0 | Cyanotype | Prussian-blue blueprint/sun-print with dimensions and title block | `lens_cyanotype` |
| 11.0–11.3 | Cards fly | The media now appear as **physical cards flying past the camera** (cyanotype, film strip, halftone) | transition in `final`/`mosaic` |
| 11.05–11.2 | Negative | Orange-masked colour negative in a film strip with sprocket holes | `lens_negative` |
| 11.3–11.4 | Pop art | Comic panel: Ben-Day dots, "轰!" in huge letters, speech box "我仿佛看到了……" | `lens_popart` |
| 11.45–11.6 | CRT TV | Static warm-up line, then a vintage TV set showing the blast, channel "17" | `lens_crt` |
| 11.65 | Shatter | Kaleidoscope of glass shards | transition |
| 11.7–11.8 | Anime | Silhouetted girl with wind-blown hair and a telephone pole, sunset gradient sky | `lens_anime` |
| 11.8–11.95 | 8-bit game | SCORE / WORLD 7-16 / LIFE, "原子弹" boss HP bar, pixel cloud, the man in his chair as the sprite with a "!" bubble, brick floor | `lens_pixelgame` (confirmed by the author's page at 11.845 s) |
| 12.0–12.1 | Thermal | FLIR-style iron palette, spot readouts in °C, scale bar, timestamp 1945-07-16 | `lens_thermal` |
| 12.15 | Oscilloscope | Green phosphor vector outline of the cloud with a graticule | `lens_oscilloscope` |
| 12.2–12.25 | Glitch | Datamosh blocks, RGB smears | `lens_glitch` |
| 12.3–12.4 | Voxel | Isometric diorama: the cloud as blocks on a cut-away ground base, on a black void | `lens_voxel` |
| 12.45 | Papercut | Red 剪纸 with scalloped cloud motif and border | `lens_papercut` |
| 12.5–12.6 | Embroidery | Satin stitch in a wooden hoop on dark fabric | `lens_embroidery` |
| 12.65–12.75 | Crayon | Child's drawing: striped wax-crayon cloud, green grass fringe, blue sky scribble | `lens_crayon` |
| 12.8–12.9 | LED dots | Out-of-focus LED/dot-matrix screen | `lens_pixels` (second use) |
| 12.95 | Wireframe | Point-cloud/wireframe scan with bounding box, axis gizmo, colour ramp bar | `lens_wireframe` + `lens_code` |
| 13.0–13.1 | Code | Triangulated mesh plus scrolling code text over purple/orange | `lens_code` |
| 13.1–14.2 | **Mosaic** | Screen splits 2×2 → 3×3 → 4×4 → 6×8… every tile a live medium, cards shuffling | `mosaic` |
| 14.25–14.45 | Flash | White | — |
| 14.45–20.3 | **The real cloud** | White fades to a photoreal mushroom cloud at night, slow rise and roll, ~6 s held (the longest shot) | `shot_nuke` |
| 20.3–22.8 | **Eye** | The cloud shrinks to a rectangle: it is the monitor **reflected in a pupil**. Pull back across a hyper-detailed iris, eyelashes; the eye blinks | `shot_eye` |
| 22.8–23.6 | Window | The eye is seen **through a lit apartment window**; the man at his desk | `lens_windows` |
| 23.6–25.9 | **City of windows** | Pull back: a tower at night, every window shows a different medium on a screen; the lit windows rearrange into a **mushroom cloud drawn in windows** | `lens_windows` |
| 25.9–26.2 | Return | Rush back into one window | `lens_windows` → `shot_room` |
| 26.2–29.1 | **Room, warm** | Same chair, now lit warm orange by the cloud on his monitor | `shot_room` |
| 27.6–28.1 | **Sound arrives** | The frame collapses to a single vertical column (27.63), then datamoshes: block displacement, colour bars, circular lens masks, fragments of other media (pixel-game bricks, ukiyo-e, daguerreotype blue); snaps back by 28.13. The boom is the loudest moment of the soundtrack (−10 dBFS) | `lens_glitch` over `shot_room` |
| 29.1–29.6 | Fade | To black | — |
| 29.6–31.9 | **Typed text** | A cursor types the meme line in a thin serif | `final` (text) |
| 32.0–34.6 | Credits 1 | Source code scrolls up beside the real cloud: "no image, no frame of footage / computed pixel by pixel" | `final` + `shot_nuke` |
| 34.7–37.2 | Credits 2 | A **wall of all 28 media as cards** assembles row by row: "same cloud · 28 human ways of seeing" | `mosaic` |
| 37.2–39.8 | Credits 3 | **Split screen**: left the real cloud, right one medium after another (cave, ink, ukiyo-e, impasto, constructivist, cyanotype, anime, embroidery, crayon, code), with a white scanner line crossing: "each medium = one shader / left: the real universe, right: the same instant in another universe" | `final` |
| 39.85–42.0 | **Sound** | The soundtrack drawn as a waveform that grows left to right while it replays: room + montage, the long flat gap, the approaching tone, the boom. Labels "3.2s 光到达（绝对静音）" and "27.6s 声音到达" (in warm orange). "sound is also synthesized by code · 100% code · Opus 5.5" | `lens_oscilloscope`-style waveform |

## 2b. Soundtrack (measured)

See `05_sound_design.md` for the full analysis. Summary: room tone + heartbeat + 7.4 kHz monitor whine (0–3.2 s);
absolute digital silence as the light arrives (3.2–4.3 s); a distinct sound per medium through the montage,
rising to a crescendo (4.4–14.4 s); silence again (14.5–16.2 s); the 7.4 kHz tone returns, pulsing and
swelling, with the characters 光先到 **drawn into the spectrogram** at 6–9 kHz (23.0–25.6 s); a heartbeat under the
eye shot that speeds up (20–27 s); the boom at 27.6 s; a spectrogram-visible reprise under the credits.

## 3. Pacing (measured from cut detection)

- 0–4.4 s: one continuous camera move (room → screen → sub-pixel → flash). No cuts.
- 4.4–9.5 s: **~0.5–1.0 s per medium**, each joined by a *material* transition (crack, tear, bleed,
  slice, burn, smear).
- 9.5–12.0 s: **~0.15–0.3 s per medium**, joined by flashes, whip-pans and flying cards.
- 12.0–13.1 s: **~0.1 s per medium** (3 frames each); the eye only registers colour and silhouette.
- 13.1–14.2 s: all at once (mosaic).
- 14.4–20.3 s: the longest hold in the film, on the "real" cloud. Contrast after acceleration.
- 20–26 s: one continuous pull-back (pupil → eye → window → building → cloud of windows).
- 26–42 s: slow. Room, the sound arrives (27.6 s), fade, typed text, then three "proof" credits that re-show every medium at readable size.
- The "real" cloud (14.4–20.3 s) barely moves: slow billowing of the cap and rolling of the vortex ring. After 10 s of 0.1–1 s cuts, a nearly still 6-second shot reads as enormous.

This is an **accelerating montage into a hold**: the classic "sensory overload, then stillness".
The accelerating part works only because every medium keeps the *same composition* (next section).

## 4. The five devices that make it read as one film

1. **Locked composition across all media.** The cloud sits in the same place in almost every
   medium: centred, cap in the upper third, stem to a horizon ~55–60 % down. At 0.1 s per cut the
   brain reads it as *one* object changing material. The composition is a match cut repeated 28 times.
2. **Chronological order of media.** Cave → Dunhuang → ink → porcelain → woodblock → stained glass →
   engraving → impasto → pointillism → daguerreotype → cubism → constructivism → newspaper →
   cyanotype → film → pop art → TV → anime → video game → thermal/scientific → digital glitch →
   voxel/3D → code. This is a compressed history of human image-making, which gives the montage a
   direction instead of being a random style shuffle.
3. **Every medium is an object in a space**, not a flat filter: a vase with glaze reflections, a
   newspaper under a magnifier, a silver plate in a brass oval, a hoop of embroidery, a TV set, a
   film strip, a voxel diorama on a base, a rose window with light behind it. Each "lens" renders
   the medium *and* the photograph of the medium (lighting, lens distortion, surface).
4. **In-world typography.** Each medium carries text in its own voice: calligraphy and a seal (ink),
   a title cartouche (ukiyo-e), "PL. VII" plate caption (engraving), a wood-type headline and 号外
   (newspaper), a diagonal slogan (constructivism), an onomatopoeia (pop art), SCORE/WORLD/LIFE
   (game), °C readouts (thermal), a title block (blueprint). The title 光先到 recurs inside media.
5. **Bookends and proof.** Opens and closes on the same chair. The credits don't just list the
   craft, they *prove* it: the source code scrolls, all media tile up at once, and a split screen
   compares "real" and "medium" frame for frame.

## 5. Why it took ~16 hours and a ~30 GB folder

- **~27,100 lines of GLSL in 38 files, zero assets.** Core 1,750 lines (`common`, `post`,
  `mosaic`, `final`), shots 4,251 (`shot_room` 1,505, `shot_eye` 1,503, `shot_nuke` 1,008,
  `shot_flash` 235), lenses 21,128 across 30 files (77 to 1,318 lines each). An agent writes,
  compiles, renders a still, looks at it and fixes it; a few thousand *verified* lines per hour is
  a realistic ceiling. 27k lines is most of 16 hours by itself.
- **Each medium is researched before it is coded.** The file header is a "medium bible": the
  `lens_halftone` header describes a specific 1945 newspaper extra on cheap groundwood newsprint,
  printed two-colour letterpress, then lists its defects (ink slur, wicking, squash rims, salting,
  wood grain, pinholes, forme out of register, show-through, cracked glass, cockle under raking
  window light, tanned edges, foxing, a magnifier with pincushion distortion and lateral colour).
  Every item on that list is its own block of code.
- **Photoreal "real universe" shots are the most expensive.** `shot_room` (a lit room with a
  seated person, all procedural) and `shot_eye` (iris fibres, crypts, lashes, wet reflection,
  blink) are each ~1,500 lines. `shot_nuke` is physically parameterised. The code visible in the
  credits drives the fireball from a time variable `tau`: radius growth law, core temperature decay
  mapped through a **blackbody** colour, soot, boiling, mottling, the cap "hugging the ground then
  rising". Volumetric ray-marching of that is slow per pixel.
- **Lenses multiply scene evaluations.** Halftone, pointillism, stained glass, mosaic, impasto,
  cubism and embroidery all sample the underlying image at many points per pixel (cell centres,
  neighbouring cells, stroke footprints). The scene may be evaluated 10–50× per output pixel.
- **The reprises render many lenses in one frame.** The mosaic (up to ~48 tiles), the tower of
  windows and the poster wall each show dozens of live media at once, so a frame costs the *sum*
  of those lenses. That's why every lens takes local coordinates (`vec3 lens(vec2 fc)`, "fc is
  local to the…" tile): write once, draw anywhere, in any rectangle.
- **Lossless frame dumps.** Fine paper grain, ink noise and film grain compress terribly; a PNG
  sequence at high resolution is ~5–40 MB per frame. Keeping per-shot or per-lens intermediates for
  re-compositing multiplies that. 30 GB is plausible for a 42 s film.
- **Plus audio in code** and a **source-browser web page** (player, scrubber, "this frame is being
  computed by this file" highlight).

## 6. "他写了数十个着色器" — what it means

The phrase means **"he wrote dozens of shaders"**, and it is the whole method in five words:

- **Not "one shader with dozens of filter presets"**, but dozens of independent programs. Each is a
  complete renderer for one medium: its material, its tools, its defects, its typography, its
  lighting, and the camera that photographs it.
- **Each shader is also a document.** It opens with a written description of the physical object it
  imitates, and the code implements that description.
- **They share one contract and one world state.** Every lens answers the same question
  ("what colour is this pixel of *this* medium at *this* instant?") from the same physical state of
  the explosion (radius, height, temperature, soot at time τ). That is why 28 media can cut every
  3 frames and still feel like one moment.
- **The number is the point.** The film's claim is "every medium = one shader". The count is the
  content, and the credits show the file list as proof.

How to apply it (implemented as a plan in `02_architecture.md` and the conclusion of `SKILL.md`):
one shared state, one lens contract, one file per medium with a bible header, and a compositor
that can place any lens in any rectangle.
