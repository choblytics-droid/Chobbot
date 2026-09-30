# 03 — Style reference library: the 28 media of 《光先到》 (+ the 4 "real" shots)

One entry per medium, in film order (the order is canonical: the cyanotype's title block says
`SHEET 14 OF 28`, and it is exactly the 14th medium). Each entry records:

- **File / lines / time:** the source file, its line count, and when it's on screen.
- **Family:** A = reproduction, B = painterly, C = iconographic (see `02_architecture.md` §4).
- **Real-world reference:** the medium, place and era it imitates.
- **Observed:** what is actually in the frame.
- **Palette:** 6 colours sampled from the frame with their area share. Use them as the starting point for a
  grade, not as absolute truth: the Bilibili upload is compressed and slightly soft.
- **Signature traits:** without these it doesn't read as the medium.
- **Material and defects:** the realism list to implement, in the style of the medium bible.
- **In-world text:** how the film's thesis is translated into the medium's own language.
- **Build recipe:** how to build it in GLSL, including what to sample.
- **Transition in/out:** how the film enters and leaves it.

A recurring authoring rule appears in almost every entry: **translate the thesis into the medium's
own genre of writing, and sign the work the way that medium signs work.**
- The thesis: "light arrives first, the sound is still on its way".
- The date and time: Trinity test, 1945-07-16, 05:29.
- The signature: "代码画" (code-painted), "OPUS 5.5 SCULP."

---

## 0. The real universe (shots)

### 0.1 Room — `shot_room.glsl` (1,505) · 0.2–2.4 s, 26.2–29.1 s
- **Observed:** a man seen from behind, slumped low in an office chair, head tipped back against the
  headrest, arm hanging. A white desk and a monitor on a stand glow with a chat UI (sidebar, message
  text, input box with cursor). Plain wall, dark floor. In the reprise the monitor shows the cloud and
  the whole room turns warm orange.
- **Palette (cold):** `#050405` 25% · `#27282e` 21% · `#17161a` 16% · `#3c3d44` 15% · `#09090b` 11% · `#5f6067` 11%.
  Almost pure greys with a slight blue.
- **Signature:** a single practical light source (the screen), soft falloff on the wall, rim light on
  hair and shoulder, crushed blacks, no colour.
- **Build:** SDF humanoid (capsules/smooth-union), chair, desk and monitor boxes. The screen is an
  emissive rectangle with a UI drawn procedurally. Lighting is an area light approximated by the
  screen's rectangle, plus soft shadows and AO. Slight lens bloom around the screen.
- **Camera:** 1.3–2.4 s is a continuous push over his shoulder into the screen; the depth of field
  pulls from the man to the screen.

### 0.2 Flash — `shot_flash.glsl` (235) · 3.1–3.4 s, 3.8–4.4 s, and the white frames between media
- **Observed:**
  - The cursor bar shrinks vertically over 6 frames to a dot (3.00→3.17).
  - The dot blooms into a 4-point star with a long anamorphic horizontal streak (3.20–3.23).
  - Full white (3.27–3.37), with a **dark afterimage dot** where the light was (3.27).
  - It resolves into a dark plain with the fireball sitting on the horizon and a horizontal streak.
  - A second white-out (3.8–4.4) shows a faint grey dome: the **retinal afterimage** of the fireball.
- **Palette:** `#fcfcfc`-`#fffffe` (warm white, not pure).
- **Signature:** the afterimage (negative ghost of the bright shape in the white) and the anamorphic
  streak.
- **Build:** radial falloff + a thin horizontal line kernel + a 4-arm star (two thin crossed
  Gaussians). The afterimage is a low-contrast dark copy of the last bright shape, fading over ~0.5 s.

### 0.3 The real cloud — `shot_nuke.glsl` (1,008) · 3.4–3.8 s (early), 14.4–20.3 s, credits
- **Observed:**
  - A photoreal mushroom cloud at night on a flat plain.
  - A domed cap with a **rolling vortex ring**: bright orange underside lobes, darker sooty top billows.
  - A **condensation ring / skirt** (a flat disc) at mid-stem, a column with turbulent lobes, and a
    wide dust base cloud.
  - The horizon is a thin bright line, with a faint orange reflection on the ground.
  - Held nearly still for 6 s: only slow billowing.
- **Palette:** `#281a17` 22% · `#0c0b0e` 20% · `#492514` 17% · `#140e0f` 16% · `#220f08` 13% · `#aa572d` 11%.
- **Signature:** internal glow lighting the cloud from within (emission ∝ blackbody(T)); a soot-darkened
  top; the underside lit by the fireball; a dark navy sky.
- **Build:** volumetric ray march of a density field: a torus (the cap roll) + a column + a skirt disc
  + a base ring, displaced with fBm and "boil" and advected by `tau`. Emission comes from `Lcol·Ienv`,
  absorption from soot. The parameters come from the state struct (`02_architecture.md` §3).

### 0.4 Eye — `shot_eye.glsl` (1,503) · 20.3–22.8 s
- **Observed:**
  - The cloud image shrinks into a small rectangle: it is **the monitor reflected in a pupil**.
  - Pull back: a pupil, then an iris with radial fibres, dark crypts, a collarette ring and a
    limbal ring; the sclera's wet highlight; upper lashes; the lid crease; skin texture.
  - The whole shot is lit warm orange from the screen.
  - The eye blinks once (22.2–22.5).
- **Palette:** `#180a05` · `#64381d` · `#522d14` · `#2e1607` · `#3d200c` · `#7b4428`. Monochrome amber.
- **Signature:** the reflection in the pupil (story), the iris fibre structure (realism), and the blink
  (life).
- **Build:** 2D polar-coordinate iris (fibres = fBm in angle, crypts = thresholded noise blobs) over a
  sphere-shaded eyeball. The lids are animated SDF curves with lash strands, and the reflection is a
  textured quad sampled from the nuke render.

---

## 1. Cave painting — `lens_cave.glsl` (886) · 4.4–5.2 s · family C
- **Reference:** Upper Palaeolithic cave art (hand stencils and prints; red and black figures).
- **Observed:**
  - A torch-lit rock wall. Red and orange **hand prints** fan in an arc above.
  - Rows of **red ochre dots** radiate like a sunburst around a carved, pale **hemisphere** (the fireball
    as an engraved dome with concentric grooves).
  - Tiny red stick figures with raised arms stand along the horizon.
  - Long black strokes (charcoal) radiate on the ground, plus scratches.
  - A diagonal crack splits the rock. Ochre and yellow spatter.
- **Palette:** `#5d3422` 26% · `#271a13` 21% · `#654933` 15% · `#7c5136` 14% · `#8a6a4c` 14% · `#af9475` 11%.
- **Signature:** the rock relief under paint (the paint follows the bumps); hand stencils; limited
  earth pigments (red ochre, yellow ochre, charcoal, kaolin white).
- **Material and defects:** uneven absorption into porous rock; flaking; calcite bloom; spray-stencil
  halos around hands; soot gradient from the torch; a warm flicker light.
- **In-world text:** none (pre-writing). The thesis is told as figures raising their hands to the light.
- **Build:** rock height field (ridged fBm) → normals lit by a moving warm point light. Paint layers
  are masks (hand SDFs, dot rows along arcs, stroke SDFs) multiplied into albedo, with pigment
  coverage reduced where the height field is steep or rough.
- **In:** from white, like eyes adjusting (overexposed → normal over 12 frames).
  **Out:** cracks spread from the dome and rock shards fall away to reveal the next mural beneath.

## 2. Dunhuang mural — `lens_dunhuang.glsl` (1,112) · 5.2–5.9 s · family C
- **Reference:** Mogao cave murals (Tang era): flying apsaras (飞天), flame mandorlas, thousand-Buddha
  rows (千佛), mineral pigments on earth plaster.
- **Observed:**
  - The fireball becomes a **flame mandorla**: rings of pointed flame petals in orange, green and red
    around a glowing half-disc with lotus-bud shapes.
  - Two **apsaras** with streaming scarves fly in the upper corners, among small clouds and stars on
    deep blue.
  - Below, a band of dots and then **rows of identical seated Buddhas** in alternating red, green and
    ochre robes.
  - A vertical inscription cartouche. The plaster is peeling at the bottom, exposing the rough earth
    layer.
- **Palette:** `#352c2c` 24% · `#a37757` 19% · `#805940` 18% · `#49352b` 16% · `#623c29` 15% · `#c9a27a` 9%.
- **Signature:** **darkened lead pigments** (the famous blackened faces and skin tones), faded
  lapis/azurite blue, malachite green, cinnabar red; repetition (the thousand Buddhas); smoke-darkened
  warm cast.
- **Material and defects:** plaster cracks and flaking to an earth layer; pigment loss at edges;
  a patina gradient; brush outlines in dark red; gilt highlights worn.
- **In-world text:** a vertical inscription panel (题记).
- **Build:** a 2D layout of motifs: the mandorla is polar-repeated petal SDFs; Buddhas are one SDF
  instanced on a grid with a per-cell colour hash; the apsaras are hand-built curves.
  Then an ageing pass: a crack network (Voronoi edges), flake masks, fade and darken.
- **In:** revealed beneath falling cave rock (an archaeology metaphor: older layer → deeper layer).
  **Out:** the centre brightens and a vertical almond-shaped **tear** opens from the middle.

## 3. Chinese ink painting — `lens_ink.glsl` (937) · 5.9–6.7 s · family C
- **Reference:** 水墨山水 (shan shui), on aged xuan paper.
- **Observed:**
  - Cream paper. Misty ink mountains rise at left and right.
  - The fireball is a **pale ochre wash dome** with a dry black brush stroke along its top.
  - A long horizontal ink stroke forms the horizon, with light ripples below.
  - A lone fisherman in a small boat, and a line of birds.
  - A vertical four-character poem **坐看火光** ("sit and watch the firelight") writes itself stroke
    by stroke. A small signature **代码画** and a red square seal **观看方式** sit bottom right.
- **Palette:** `#dbc8a3` 20% · `#dfd1b7` 19% · `#e1d6bf` 19% · `#dcccaf` 16% · `#e5dbc7` 13% · `#ad9b82` 13%.
- **Signature:** negative space (70% of the frame empty paper); wet-in-wet wash bleeding (墨晕); dry
  brush (飞白) strokes; the red seal as the only saturated colour.
- **Material and defects:** paper fibres; ink feathering along fibres; tide-lines at wash edges; gradation
  from wet to dry within one stroke; aged yellowing; faint foxing.
- **In-world text:** 坐看火光 translates the meme's 瘫坐 ("slumped in a chair") into a classical
  four-character line. That is the medium's native genre of caption.
- **Build:** stroke primitives with a pressure profile along their length (width and ink load);
  wash = a blurred mask with an edge darkening term; fibres = anisotropic noise that bends the edge;
  writing-on reveal = arc-length parameter vs time.
- **In:** a vesica tear from the mural. **Out:** cobalt **ink bleeds out of the fireball** (organic
  blob growth) and becomes the vase.

## 4. Blue-and-white porcelain — `lens_porcelain.glsl` (1,318, the largest) · 6.7–7.35 s · family C
- **Reference:** Ming 青花 meiping vase, cobalt underglaze.
- **Observed:**
  - A full meiping vase against dark grey, turning slowly. The cloud is painted as **auspicious-cloud
    scrolls (祥云)** over bands of **wave scales (海水纹)**, with flame tongues above.
  - A lappet band and lotus-panel band at the foot, a collar band at the shoulder.
  - A **window reflection** slides across the glossy glaze as the vase turns.
- **Palette:** `#4b4a4d` 19% · `#9398a7` 18% · `#e0dace` 17% · `#545a75` 17% · `#444343` 17% · `#f0ece1` 11%.
- **Signature:** cobalt heaping-and-piling (dark specks where cobalt pooled); soft blue bleed of the
  underglaze; a glassy glaze with a specular window reflection; a slightly bluish-white body.
- **Material and defects:** cobalt bleeding into the glaze; iron spots; pinholes and orange-peel glaze
  texture; kiln-grit on the foot; glaze pooling in the recesses.
- **Build:** a lathed vase SDF (profile curve → revolve), ray-marched. Pattern in cylindrical (θ, y)
  coordinates: bands of motif SDFs, scale pattern, scroll curves. Cobalt as a sub-surface layer (blur +
  darker specks). Glaze = Fresnel reflection of an environment containing a bright window rectangle.
  The largest file, because it is both a 3D object and a dense 2D design system.
- **In:** ink bleed. **Out:** curved **blade wipes** slice the vase away, like arcs of a spinning disc.

## 5. Ukiyo-e woodblock print — `lens_ukiyoe.glsl` (1,067) · 7.35–7.95 s · family C
- **Reference:** Edo-period nishiki-e (Hokusai/Hiroshige landscape prints).
- **Observed:**
  - The cloud as a bulbous orange-red mass with a **white-hot flower-like core**, scalloped edges and
    wisps.
  - A blue sky with **bokashi** gradient, and a pine tree silhouette at left.
  - A ploughed field in strong perspective lines, with a row of small figures in straw hats and robes.
  - A yellow title cartouche **光先到** and a side label **人类的一切观看方式** ("all the ways humans see").
  - Top left, a signature **代码画** with a small red seal. A cream border.
  - The entrance shows the print **being printed**: the key block (black outline) first, then yellow,
    then red, then blue (7.40→7.57).
- **Palette:** `#383d42` 25% · `#916f58` 19% · `#875739` 17% · `#e7d1a2` 15% · `#823e27` 12% · `#c89b72` 11%.
- **Signature:** flat colour areas bounded by a black key line; bokashi gradients (sky, horizon);
  wood grain visible in flat areas; slight misregistration; Prussian blue.
- **Material and defects:** wood grain transfer; baren rubbing marks; registration offset per block;
  paper fibres (washi); colour fading; the kento (registration notch) margin.
- **In-world text:** cartouche title + side label + signature and seal, as a publisher's print.
- **Build:** quantise the scene into ~6 flat colour layers ("blocks"), each with its own wood-grain
  noise and a small offset; key line = edges of the layer masks, width modulated; bokashi = vertical
  gradient masks. The printing reveal is a per-layer time threshold.
- **In:** blade-sliced vase → blank paper → printed block by block. **Out:** a **burn hole** opens at
  the fireball's core, with charred glowing edges, and grows to reveal a rose window aligned to the
  fireball.

## 6. Stained glass — `lens_stainedglass.glsl` (1,033) · 7.95–8.5 s · family B/C
- **Reference:** Gothic rose window with lancets below.
- **Observed:**
  - The fireball is the **rose window**: radiating petal panes in yellow, orange, red and white, around
    a white central oculus.
  - A pointed arch of blue, yellow and red panes. A stone band reads **✝ FIAT … LVX ✝** ("let there be
    light").
  - Below, **four lancets with saints** in red, green and purple robes, gold halos, looking up.
  - Light flickers through the glass.
- **Palette:** `#1c1415` 22% · `#291d1c` 22% · `#483136` 16% · `#5d4a3f` 15% · `#482220` 14% · `#b59968` 12%.
- **Signature:** thick black lead cames between every pane; glass colour varies inside each pane
  (seeds, streaks, thickness); light transmitted, so colours glow against the dark stone.
- **Material and defects:** bubbles and seeds; uneven glass thickness (brightness variation); grisaille
  paint (faces and folds painted in brown); dust; slight bowing of panels; bloom around bright panes.
- **In-world text:** FIAT LVX (Genesis 1:3) translates "light arrives first" into liturgy.
- **Build:** Voronoi or polar tessellation → cell colour sampled from the scene (family B) or assigned
  by design (family C for the saints); cames = cell-edge distance < w; per-cell noise for glass texture;
  transmitted-light model = a bright backlight × glass colour, bloom.
- **In:** burn hole. **Out:** **curved glass panes rotating** like turning pages of glass (refraction wipe).

## 7. Steel engraving / etching — `lens_etching.glsl` (747) · 8.5–9.0 s · family B
- **Reference:** a 19th-century scientific plate in an illustrated book.
- **Observed:**
  - A plate impression on cream paper with a **platemark**.
  - Engraved radiating light rays behind the cloud; the cloud modelled by contour-following
    hatching with bold outlines.
  - A horizon with a railway / telegraph line; small robed figures on a hill at left, with arms raised.
  - Captions: **PL. VII** bottom left, **OPUS 5.5 SCULP.** bottom right, title **光 先 到** centred.
- **Palette:** `#474039` 24% · `#877e73` 23% · `#e9dfc8` 17% · `#aea597` 16% · `#ece3cc` 14% · `#d8ceba` 5%.
- **Signature:** tone made only from line density (no grey fills); lines that follow the form
  (contour hatching); cross-hatching in the darks; a crisp platemark bevel.
- **Material and defects:** ink wiped slightly into the plate tone; burr; paper embossing; foxing spots.
- **In-world text:** "OPUS 5.5 SCULP.": the engraver's *sculpsit* signature convention, signed by the model.
- **Build:** luminance → line density; hatch direction = gradient-perpendicular or contour of the
  cloud SDF; multiple hatch layers switched on by darkness thresholds (the engine's `engrave()`); outlines
  = SDF iso-lines. Paper = off-white noise, platemark = rectangle bevel.
- **In:** glass-pane wipe. **Out:** **paint oozes out of the cloud** with a thick raised lip and
  covers the plate.

## 8. Impasto (post-impressionist) — `lens_impasto.glsl` (884) · 9.0–9.5 s · family B
- **Reference:** thick-paint swirling night-sky painting (late-1880s post-impressionism).
- **Observed:**
  - A swirling deep-blue sky with **haloed yellow stars** and moon.
  - The cloud in fiery orange, yellow and white strokes; the reflection on water as horizontal
    dashes of orange and purple.
  - The canvas sheet curls at the edge over the previous plate.
- **Palette:** `#3b4162` 27% · `#6c708d` 19% · `#b37658` 17% · `#76505d` 16% · `#decd8c` 12% · `#ba9b71` 10%.
- **Signature:** **short directional strokes following flow fields** (swirls around stars); paint
  height (raking light on ridges); complementary blue/orange; halos as concentric strokes.
- **Material and defects:** paint ridges with specular highlights; canvas weave in thin areas; stroke
  ends with a dragged tail; mixed colours within a stroke.
- **Build:** a flow field (curl noise + vortices around stars) → oriented stroke cells (each cell draws
  a capsule aligned to the flow, colour sampled from a simplified scene at the cell centre); height =
  sum of stroke profiles → normals → lighting. k ≈ 9–25 neighbouring cells per pixel.
- **In:** the paint blob grows out of the etched cloud. **Out:** whip-pan with a **1-frame subliminal
  2×2 pop-art grid** (9.53), then pointillism.

## 9. Pointillism — `lens_pointillism.glsl` (450) · 9.5–9.8 s · family B
- **Reference:** neo-impressionist divisionism (1880s).
- **Observed:** the whole image as small dots of pure colour (blue, violet, orange, yellow) that
  mix optically; a violet shadow side; an orange and red foreground.
- **Palette:** `#282d69` 32% · `#ae564c` 15% · `#622756` 15% · `#b67650` 14% · `#6e4c75` 13% · `#d5af60` 12%.
- **Signature:** dots of *unmixed* complementary colours placed side by side, so the eye does the mixing;
  a visible canvas between dots.
- **Build:** a jittered grid of dots; each dot picks one of a small pure palette with a probability
  that makes the local average match the scene colour (stochastic optical mixing). Canvas shows
  between dots.
- **In:** whip pan. **Out:** zoom blur to a white flash frame.

## 10. Daguerreotype — `lens_daguerreotype.glsl` (523) · 9.9–10.1 s · family A
- **Reference:** 1840s–50s cased daguerreotype on silvered copper.
- **Observed:**
  - The cloud as a silvery grey positive in an **oval brass mat** with floral corner ornaments, in a
    **maroon velvet case**.
  - **Iridescent tarnish** (magenta, blue and gold) creeps in from the oval edge.
  - The plate tilts, and a bright specular flare sweeps across the mirror surface.
- **Palette:** `#2d1115` 23% · `#766244` 21% · `#624031` 17% · `#938164` 16% · `#b6a994` 12% · `#36312e` 11%.
- **Signature:** **the mirror effect** (the image flips between positive and negative with viewing angle);
  tarnish rainbow halo; soft focus; a brass stamped mat.
- **Material and defects:** tarnish (thin-film interference colours), wipe marks, fingerprints,
  dust specks, corner abrasion.
- **Build:** sample the real render's luminance; tone-map to silver; view-dependent positive/negative
  blend; thin-film colour = a cosine palette in (distance-to-edge × thickness noise); a brass mat pattern;
  a tilted-plane camera with a moving specular.
- **In:** white flash. **Out:** crystalline refraction, a red target card flashes past.

## 11. Cubism (synthetic, collage) — `lens_cubism.glsl` (1,068) · 10.1–10.4 s · family B
- **Reference:** synthetic-cubist papier collé (1912–14).
- **Observed:**
  - The cloud broken into **faceted planes** in ochre, grey and brown, seen from several angles at once.
  - Charcoal arcs and lines over it; a stencilled word **LUMIÈRE**; stencilled numbers **5,29**.
  - A pasted newspaper scrap **LE JOU[RNAL]** with the headline **LE SON EST EN ROUTE** ("the sound is
    on its way").
  - A pasted faux-bois (wood-grain) paper.
- **Palette:** `#483d30` 20% · `#342d24` 19% · `#a18963` 17% · `#3c3931` 17% · `#685841` 13% · `#c2b089` 12%.
- **Signature:** multiple viewpoints fused; a limited brown/grey palette; collage of real printed paper;
  stencilled letters; passage (edges that dissolve into neighbours).
- **Material and defects:** paper edges with shadows, glue stains, charcoal smudges, canvas texture.
- **In-world text:** French, the language of cubism: LUMIÈRE, LE SON EST EN ROUTE; 5,29 = 05:29, the
  Trinity detonation time.
- **Build:** partition the frame by random lines into polygons; each polygon samples the scene with a
  different small offset, rotation and scale (multiple viewpoints), then flattens it to 3–4 tones.
  Overlay paper-scrap quads with their own content (newspaper and wood-grain generators), plus
  stencilled glyphs and charcoal strokes.
- **In:** refraction swish. **Out:** manga speed-line burst frame (10.37).

## 12. Constructivist poster — `lens_constructivist.glsl` (439) · 10.4–10.6 s · family C (with A photo)
- **Reference:** 1920s Soviet constructivist propaganda (red/black, diagonals, photomontage).
- **Observed:**
  - The cloud as a **red-and-black halftone photo** cut into a black circle.
  - A **diagonal red band** with the huge slogan **光先到!** and a long arrow; a smaller band
    **声音还在路上** ("the sound is still on the way").
  - A vertical **原子弹爆炸** at top left and a small red square top right.
  - A bottom rule with **人类的一切观看方式**, and a small block of **source-code comments** set as
    body text.
- **Palette:** `#231716` 27% · `#ede3d2` 24% · `#cc1918` 18% · `#f2e9d9` 14% · `#8d1617` 10% · `#c7a596` 7%.
- **Signature:** two inks (red + black) on off-white; diagonals at ~20–30°; heavy sans type; the photo
  as a cut-out; geometric primitives (circle, square, bar).
- **Material and defects:** fold creases, ink trapping gaps, paper yellowing, slight misregistration.
- **Build:** a layout of rotated rectangles and circles (SDF); the photo = the real render → coarse
  halftone → red or black; bold glyphs. Very little code (439) because the layout is simple and the
  photo is sampled.
- **In:** speed-line burst, the poster flies in. **Out:** **glass cracks** (spider-web) over it and falls
  away.

## 13. Newspaper extra (halftone) — `lens_halftone.glsl` (657) · 10.6–10.8 s · family A
- **Reference:** a 1945 Chinese newspaper extra (号外), letterpress (full bible in `02_architecture.md` §6).
- **Observed:**
  - A red wood-type headline **原子弹爆炸** set **right-to-left** (reads 炸爆弹子原), with a **号外**
    knock-out block.
  - The sub-deck **光先到 声音还在路上**, also right-to-left.
  - A coarse **45° halftone** photo of the cloud, and dense vertical columns of body text.
  - A **magnifying glass** lying on the page shows enlarged dots and the character 式; the paper is
    folded and tanned.
- **Palette:** `#5d5241` 23% · `#9a896c` 21% · `#b5a280` 15% · `#7d6a53` 14% · `#462e23` 14% · `#c7b592` 13%.
- **Signature:** visible halftone dots at 45°; two-colour (vermilion + black) letterpress; the period
  reading direction; cheap yellowed newsprint.
- **Material and defects (from the author's own list):** rag, slur, wicking, squash rims, salting, wood
  grain, pinholes, forme out of register, show-through of the mirrored reverse page, cracks, cockle under
  raking window light, tanned edges, foxing; the magnifier's pincushion and lateral colour.
- **Build:** the real render → luminance → AM halftone cell at 45° (dot radius from tone); ink model
  (squash ring = darker rim; salting = random missing ink; slur = directional smear); the reverse page
  = mirrored text at low opacity; paper = fibre noise + cockle height field lit by raking light; the
  magnifier = a circle with radial UV distortion and chromatic offset.
- **In:** broken glass. **Out:** white flash; a cyanotype card flies in.

## 14. Cyanotype / blueprint — `lens_cyanotype.glsl` (773) · 10.9–11.0 s · family A
- **Reference:** cyanotype sun print / engineering blueprint (1840s onward).
- **Observed:**
  - The cloud in white-on-Prussian-blue with fine detail, and a **dimension line Ø3.35 km** across the cap.
  - Height ticks (3.34, 3, 2, 1.35, 1 km) and a **CONDENSATION RING** callout.
  - A log–log inset plot of **R = (E t²/ρ)^(1/5)** (G.I. Taylor blast-wave scaling).
  - A title block: **光先到 · 声音还在路上 · SCALE 1:25 000 · SHEET 14 OF 28 · DWG. No. 13 · t = 8.98 s**.
  - Grid reference letters and numbers on the border; **brush-coated, deckled edges** on white paper.
- **Palette:** `#101f66` 24% · `#5a7fb3` 19% · `#f1f1e6` 16% · `#0f2972` 16% · `#1d3c82` 14% · `#cfdae1` 10%.
- **Signature:** a single Prussian-blue ink; the coating brush-edge; a technical drawing overlay; a title block.
- **Material and defects:** uneven coating (streaks), bleached spots, paper texture, blue bleeding into fibres.
- **In-world text:** an engineering title block that encodes the thesis and the film's own index (14 of 28).
- **Build:** the real render luminance → inverted to blue with a density curve; the drawing overlay
  as SDF lines and text; brush edge = noise-thresholded border mask.

## 15. Colour negative — `lens_negative.glsl` (516) · 11.05–11.2 s · family A
- **Reference:** 35 mm colour negative film.
- **Observed:** the orange-masked film base with an inverted blue cloud; **sprocket holes** and edge
  markings; the strip slides vertically past the camera.
- **Palette:** `#c78d57` 24% · `#e3995d` 20% · `#7c6a61` 18% · `#d7955c` 18% · `#fcf8f8` 15% · `#eaa87b` 5%.
- **Signature:** the orange mask (the base colour of C-41 film); complementary inversion; sprockets;
  edge print (frame numbers, DX code).
- **Build:** invert the scene, multiply by the orange mask; sprocket SDFs on both sides; the strip is a
  quad moving with motion blur.

## 16. Pop art comic — `lens_popart.glsl` (603) · 11.3–11.4 s · family C
- **Reference:** 1960s pop art comic panels (Ben-Day dots, onomatopoeia).
- **Observed:**
  - A starburst in red and yellow behind the cloud, drawn as **flat circles with red Ben-Day dots**
    and a white core.
  - A caption box **我仿佛看到了……** ("I seemed to see…"), and a giant 3D block onomatopoeia
    **轰!** ("BOOM!") in yellow with red dots.
  - A blue ground with halftone patches.
- **Palette:** `#ecd34b` 24% · `#e9e2c9` 22% · `#9a5d36` 19% · `#7e2835` 18% · `#b5975c` 12% · `#d8c368` 4%.
- **Signature:** thick black outlines; flat primaries; Ben-Day dot fills; a burst shape; onomatopoeia
  as a graphic object; a caption box.
- **Material and defects:** slight misregistration of the colour plates; newsprint yellowing.
- **In-world text:** the meme itself as a comic caption, plus 轰!.
- **Build:** posterise to 4 inks; dot patterns per ink (different screen angles); outlines from edges;
  burst = star polygon; 3D letters = extruded glyph with a flat side shade.

## 17. CRT television — `lens_crt.glsl` (677) · 11.45–11.6 s · family A
- **Reference:** a 1950s–70s tube TV set in a dark room.
- **Observed:** a static warm-up (grey noise with a bright horizontal line); then a vintage TV cabinet
  with rounded screen and knobs, the blast on screen with bloom, and **channel "17"** in the corner.
- **Palette:** `#171315` 24% · `#211c1f` 21% · `#31272b` 18% · `#111012` 16% · `#23100f` 13% · `#966a51` 8%.
- **Signature:** a curved screen (barrel distortion), scanlines, a phosphor glow spilling onto the cabinet,
  noise; an on-screen display.
- **Build:** a cabinet model (rounded box, knobs); the screen = the real render → barrel warp →
  scanlines + mask + bloom; the switch-on = noise + a collapsing bright line.
- **In:** static noise + a scanline flash. **Out:** **the screen glass shatters** into a kaleidoscope.

## 18. Anime — `lens_anime.glsl` (773) · 11.7–11.8 s · family C
- **Reference:** contemporary Japanese animation background + character silhouette (cel shading,
  dramatic sky).
- **Observed:**
  - A **silhouetted girl with wind-blown hair** in the foreground and a **telephone pole with wires**.
  - A violet-to-orange sunset gradient sky with stars; **radiating light rays**.
  - The cloud cel-shaded with 3 tones, a rim-lit underside and a bright horizon flash; clouds on the
    horizon lit from below.
- **Palette:** `#261e3c` 25% · `#140f26` 19% · `#63334a` 17% · `#ad5a5f` 16% · `#4e2131` 13% · `#e7ae84` 11%.
- **Signature:** 2–3 tone cel shading with hard terminators; a painted gradient sky; the lonely figure
  and utility pole (a genre cliché); god rays; lens flare.
- **Build:** posterised lighting on the cloud shape (from state); gradient sky; silhouettes as 2D SDF
  paths; ray fans as angular stripes with falloff.

## 19. 8-bit video game — `lens_pixelgame.glsl` (643) · 11.8–11.95 s · family C
- **Reference:** NES-era side-scroller (the film's page labels it 8-bit 游戏).
- **Observed:**
  - HUD: **SCORE 7662550 · WORLD 7-16 · LIFE ♥♥♥** and a boss bar **原子弹** with a red segmented
    health bar.
  - A light-blue sky with pixel clouds.
  - The mushroom cloud built from **pixel circles** in red, orange and yellow with dithered outlines;
    a white skirt ring.
  - Orange brick ground; the **man in his office chair as a tiny sprite with a "!" speech bubble**.
- **Palette:** `#6787fa` 30% · `#691709` 28% · `#e55110` 21% · `#6786f8` 13% · `#aca3c5` 8% · `#6d557d` 1%.
- **Signature:** a ~256×240 virtual resolution scaled up with nearest filtering; a limited palette
  (NES-like); 8×8 tiles; a chunky HUD font.
- **In-world text:** **WORLD 7-16 = July 16** (Trinity); the bomb as a boss with a health bar; the
  protagonist as the player sprite.
- **Build:** render at low virtual resolution (floor(fc / pixelSize)), palette-quantise to a fixed
  table, dither; the cloud from state as overlapping circles; tiles for ground; a bitmap font for the HUD.
- **In:** anime card zooms into giant pixels. **Out:** a card flies off; a thermal ring target flashes.

## 20. Thermal camera — `lens_thermal.glsl` (608) · 12.0–12.1 s · family A
- **Reference:** a FLIR-style infrared camera UI (iron palette).
- **Observed:**
  - An iron colour ramp (black → purple → magenta → orange → yellow → white).
  - Readouts **Sp1 659.5 °C · Bx1 Max 1670.5 °C**, **ε 0.95 · Refl 21 °C**, and a scale bar
    **11.4–1670.5 °C** with ticks.
  - A measurement box, a crosshair, a hottest-point triangle marker with its value, and corner brackets.
  - A footer **1945-07-16 05:29:54** and **● REC 00:09.60**.
- **Palette:** `#210057` 23% · `#010008` 21% · `#0a002f` 16% · `#49007b` 16% · `#df933a` 15% · `#5d0857` 8%.
- **Signature:** the iron palette; on-screen radiometric numbers that update; a UI chrome.
- **In-world text:** the date is the Trinity test; the numbers come from the state's temperature.
- **Build:** a temperature field (from the state + the render's emission) → iron-palette LUT; UI text
  from the actual max/spot values.

## 21. Oscilloscope — `lens_oscilloscope.glsl` (514) · 12.15 s (also the final waveform) · family A
- **Reference:** a green-phosphor vector display.
- **Observed:** the cloud as a glowing **green vector outline** (contour lines) on black, a graticule
  and axis labels, a trace line along the horizon; entered from **a single bright dot** (the beam at rest).
- **Signature:** thin lines with a phosphor glow; brighter where the beam slows (corners); a persistence
  trail; the graticule.
- **Build:** iso-contours of the cloud density or SDF drawn as lines; glow = exp falloff; slightly
  jittered with a beam-position wobble. The waveform at 39.8–42 s reuses the idea with audio samples.

## 22. Glitch — `lens_glitch.glsl` (854) · 12.2 s, and the sound-arrival at 27.6–28.1 s · family A
- **Reference:** datamoshing / compression corruption.
- **Observed:**
  - Large macroblocks, smeared rows, RGB split.
  - At 27.6 s the frame **collapses into one vertical column**, then blocks from other media are
    pasted in: pixel-game bricks, ukiyo-e colours, daguerreotype blue.
  - Colour bars; circular lens masks.
- **Signature:** macroblock grids (8/16 px); motion-vector smear; palette corruption; fragments of
  "other streams".
- **Build:** block-wise UV offsets from hashed time; per-block source selection among other lenses (a
  glitch that bleeds the whole film's media into the room); row smears; channel offsets.

## 23. Voxel diorama — `lens_voxel.glsl` (695) · 12.3–12.4 s · family A/C
- **Reference:** a voxel-art isometric diorama (Minecraft-era 3D pixel art).
- **Observed:** an isometric view of the cloud built from **cubes** (black-red top, yellow-orange body,
  white core, cream skirt ring), sitting on a square **cut-away ground base with soil strata**, on a
  starry purple void; soft glow.
- **Signature:** a cube grid; an isometric or tilted camera; a floating base with layered strata;
  per-voxel flat shading + AO.
- **Build:** ray-march a voxel grid (DDA) filled from the cloud density at the state; colour from
  emission; strata = y-bands on the base block.

## 24. Chinese papercut — `lens_papercut.glsl` (477) · 12.45 s · family C
- **Reference:** 剪纸, red paper folk craft.
- **Observed:** red paper with cream cut-outs: the cloud as **scalloped cloud stacks**, a sunburst of
  thin rays, scalloped waves below, and a patterned border with corner motifs.
- **Signature:** a single red colour with holes; symmetric motifs (folded cutting); every shape connected
  (the paper must hold together); slight paper thickness shadow.
- **Build:** mirror-symmetric SDF design (abs(x)); holes = union of motif SDFs; a drop shadow of the
  paper onto a light backing; fibre noise.

## 25. Embroidery — `lens_embroidery.glsl` (349) · 12.5–12.6 s · family B
- **Reference:** thread embroidery in a hoop.
- **Observed:** a **gold/wood hoop** on dark navy fabric; the cloud in orange, yellow and white
  **satin and long-short stitches**, with scattered French-knot stars.
- **Signature:** stitch direction following the form; thread sheen (anisotropic highlight); the hoop
  pulling the fabric taut; fabric weave.
- **Build:** stitch cells oriented by a direction field; each stitch a thin capsule with anisotropic
  specular; colour sampled from the scene; hoop = ring SDF with a wood/brass shader.

## 26. Child's crayon drawing — `lens_crayon.glsl` (337) · 12.65–12.75 s · family C
- **Reference:** a child's wax-crayon drawing on paper.
- **Observed:** a strip of **blue sky scribble** at the top; the cloud as a lumpy outline filled with
  **diagonal red, orange and yellow crayon stripes**; a yellow ellipse ring; the stem in vertical
  orange/brown stripes; a **green grass fringe** of vertical strokes at the bottom; cream paper.
- **Signature:** waxy broken coverage (paper tooth shows through); back-and-forth hatching; a naive
  simplified shape; colours not staying inside the lines.
- **Build:** a simplified cloud outline from the state (lumpy circles); fill = oriented stripe pattern ×
  paper-tooth noise threshold (wax skips on the high points of the paper); a wobbly outline.

## 27. LED / sub-pixel display — `lens_pixels.glsl` (310) · 2.4–3.2 s (the dive) and 12.8–12.9 s · family A
- **Reference:** the RGB stripe sub-pixels of an LCD, or an LED wall seen out of focus.
- **Observed:** in the dive, a grid of **vertical R, G, B stripes with a black matrix**, the cursor made
  of lit sub-pixels; in the montage, the cloud on an out-of-focus dot-matrix screen (moiré, bokeh).
- **Signature:** the sub-pixel triad; moiré; the black matrix gaps.
- **Build:** cell = floor(fc / pitch); sample the scene at the cell centre; output one of R/G/B per
  stripe; a gap mask; bokeh = blur of that.

## 28. Code / wireframe (source code) — `lens_code.glsl` (568) + `lens_wireframe.glsl` (77) · 12.95–13.1 s · family A
- **Reference:** the medium the film itself is made of, i.e. a renderer's debug views plus the source text.
- **Observed:**
  - Wireframe: the cloud as a bright line wireframe with rainbow normals, a dashed bounding box, a
    colour ramp bar (yellow → teal → purple), an RGB axis gizmo, a grid floor, and labels
    **WIREFRAME / NORMALS / STEPS**.
  - Code: a triangulated mesh over the cloud with **scrolling GLSL text** texturing it.
- **Signature:** debug-visualisation aesthetics: normals as RGB, step-count heatmaps, bounding boxes,
  monospace text.
- **In-world text:** the film's own source. This is the end of "cave painting → source code".
- **Build:** wireframe calls the real ray marcher and outputs its normals and step counts (hence only
  77 lines); code = a monospace glyph atlas generated in-shader, scrolling source text used as a
  texture.

## 29. Mosaic — `mosaic.glsl` (151) · 13.1–14.2 s, credits 34.7–37.2 s
- **Observed:**
  - The code frame is split by glowing cross lines into 2×2 tiles.
  - Tiles fill with media: 2×2 → 3×3 → 4×4, with cards dropping in with small rotations; then ~6×8 →
    ~8×10 cards tilting, and a white-out.
  - In the credits the wall builds up row by row from the top, cards dropping in.
- **Build:** tile index = floor(uv × n); lens(local fc) per tile; a per-tile rotation and scale for
  the "card" look; n increases on a schedule.

## 30. Windows (the city) — `lens_windows.glsl` (1,233) · 22.8–26.2 s · family C (meta)
- **Reference:** a night apartment tower (the Rear Window idea: everyone watching the same moment).
- **Observed:**
  - A dark navy facade with a grid of windows. Each lit window is a small room with a figure at a
    desk, and many show **another medium** on a screen or on the wall (pixel game, pointillism, papercut,
    thermal, stained glass…).
  - Pulling back, the windows' brightness forms **a mushroom cloud drawn in lit windows**.
  - Then a rush forward (radial motion blur) back into one window: the man.
- **Palette (tower):** `#13192b` 31% · `#1d1e30` 23% · `#101626` 13% · `#382c2f` 13% · `#a08b6f` 12% · `#1e182b` 8%.
- **Signature:** the whole building as a display (windows as pixels); every window a tiny lens; warm
  interior light vs cold facade.
- **Build:** a facade grid; per-window hash → room type or medium id; the window content is a lens
  called in local coordinates; brightness mask = the cloud silhouette sampled at the window's position.
  Large (1,233 lines) because it contains mini-rooms, silhouettes, and the orchestration of lenses at
  thumbnail scale.

---

## Cross-cutting rules extracted from the library

1. **Same cloud, same place.** Cap centred, upper third; skirt ring at ~45–50% height; horizon at ~55–62%.
   Every medium respects it, even the vase (painted there on the vase) and the voxel diorama.
2. **Each medium is an object photographed in light** (vase, plate, newspaper, hoop, TV, film strip,
   canvas, diorama).
3. **Each medium speaks the thesis in its own language:**

   | Medium | How it says the thesis |
   |---|---|
   | Ink | a four-character poem |
   | Ukiyo-e | a title cartouche |
   | Stained glass | Latin scripture |
   | Engraving | plate number and *sculpsit* |
   | Cubism | a French newspaper scrap |
   | Constructivism | a slogan with an arrow |
   | Newspaper | a headline and 号外 |
   | Cyanotype | a title block with physics |
   | Pop art | a caption and onomatopoeia |
   | Game | a HUD and boss bar |
   | Thermal | radiometric readouts |
   | Code | literally the source |

4. **Recurring numbers:** 1945-07-16 (WORLD 7-16, thermal date), 05:29 (cubism 5,29, thermal 05:29:54),
   28 (SHEET 14 OF 28), Opus 5.5 (the signature). Hidden consistency rewards re-watching.
5. **Chronological ordering** turns a style shuffle into a history of seeing.
6. **Defects are the realism.** Every lens lists and implements the imperfections of its craft.
