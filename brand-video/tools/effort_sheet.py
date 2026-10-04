"""Rebuilds the 'Effort Levels' tab of plan/Chobbot_Media_Plan_v0.1.xlsx as one merged list:
level x path x style deck, then effort by film. Data comes from docs/TIER_LIST.md and docs/STYLE_DECK.md;
re-run after editing the tables below. Other tabs are left untouched.

  python tools/effort_sheet.py
"""
from copy import copy
from pathlib import Path
import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill

PLAN = Path(__file__).resolve().parent.parent / 'plan' / 'Chobbot_Media_Plan_v0.1.xlsx'

LEVELS = [  # level, name, looks like, rendering added, style use stated for this level, agent-hours, GPU render
    (1, 'D', 'Clean synced motion graphics', 'Bloom, grain, flash/shake on hits, word-synced type', 'One look', '3–4', 'Minutes (1080p)'),
    (2, 'C', 'Simple 3D lit properly', 'Soft shadows, ambient occlusion, real materials, depth of field', '', '4–5', 'Low'),
    (3, 'C+', '+ atmosphere', 'Fog, god rays, rain on glass, wet reflections, secondary motion', '', '5–6', 'Low–medium'),
    (4, 'B', 'Studio ad', 'Bounce light, PBR bloom, flares, lens dirt', 'Mixed style deck: 3–5 switch styles + material transitions', '6–7', 'Medium'),
    (5, 'B+', 'Dressed sets', '2 fully dressed environments, lit particles', 'Mosaic of styles', '7–8', 'Medium'),
    (6, 'A', 'Cinematic', 'Volumetric sky/light, 60 fps adaptive motion blur, 1 hero shot', 'Deck as at 4–5', '8–10',
     'Medium–high. This PC: 1080p60 ≈ 1 h; 4K60 ≈ 10–12 h (motion blur capped at 36)'),
    (7, 'A+', 'Feels shot on film', 'Film grain, halation, gate weave, grade per shot', 'Deck as at 4–5', '10–11', 'High'),
    (8, 'S', 'Directed', 'Camera choreography per shot, nested pull-back ending', 'A material transition on every cut', '11–13', 'High'),
    (9, 'S+', 'Simulation', 'Cloth, smoke/ink, voxel destruction, crowds of chat bubbles, sound design', 'Deck as at 4–5', '13–14', 'Very high'),
    (10, 'S++', '《光先到》 / pdoom 4K', '4K60 path-traced look', 'Every shot a hero shot', '14–16', 'Very high (20–60+ GPU-h)'),
]

PATHS = [  # path, what it is, when, planned for
    ('Depth', '1–2 styles pushed to the limit of rendering: light, atmosphere, materials, camera, film',
     'Right for 45–60 s films', 'Brand · Generic A, MA-A'),
    ('Mixed', 'One or two deep looks plus a short multi-style moment', 'Right for 45–60 s films',
     'Streamer Stories, Brand · Generic B, MA-B'),
    ('Breadth', 'Many styles: the same moment in many media (《光先到》 uses 28)',
     'Needs runtime: at 45–60 s each style gets a fraction of a second and the message gets lost', 'Not planned'),
]

DECK_RULE = ('One home style + 3–5 switch styles, all tier A. Switch on the music: verse every 4–8 bars · '
             'pre-chorus every 2 bars · chorus every bar · biggest hit = all styles at once · outro = home style. '
             'Transitions are material (burn, ink, shatter, print, glitch, pixel dissolve) on kicks and snares.')

STYLES = [  # style, tier, best for, hold, built in this engine (brand-video/app)
    ('Pixel art', 'A', 'Home style for stories; the streamer and chat', 'Any', 'Yes (ST-01: lit pixel renderer, kit/pixel.ts)'),
    ('Voxel diorama', 'A', 'Home style; rooms and cities as toys', 'Any', 'No (a voxel rig exists on the Venmar branch only)'),
    ('CRT / VHS / glitch', 'A', 'Pain moments, flashbacks, the cold look', '1–4 bars', 'Partly (ST-01: datamosh, kit/glitch.ts)'),
    ('LED dot-matrix', 'A', 'Hooks, numbers, chat messages', 'Beats–2 bars', 'No'),
    ('Terminal / ASCII', 'A', "The bot's point of view, data", '1–2 bars', 'No'),
    ('Blueprint / technical drawing', 'A', 'How it works; Generic A, Master A', '2–8 bars', 'No'),
    ('Engraving / line hatching', 'A', 'Sad or serious stories; majestic A versions', '2–8 bars', 'No'),
    ('Oscilloscope / vector glow', 'A', 'Music-reactive moments, the voice', 'Beats–2 bars', 'No'),
    ('Newspaper halftone', 'A', "Headlines, big moments ('RAIDED!')", '1–2 bars', 'Yes (ST-01: front page)'),
    ('Papercut (flat layers)', 'A', 'Wholesome stories, warm scenes', '2–4 bars', 'No'),
    ('Stained glass', 'A', 'Triumphant moments', '1–2 bars', 'No'),
    ('Neon line', 'A', 'Night streams, energy', '1–4 bars', 'Yes (ST-01: renderNeon)'),
    ('Thermal camera', 'A', "Tension, the 'who is watching' feeling", '1 bar', 'No'),
    ('Data / UI / charts', 'A', 'Insights, reports, Generic films', 'Any', 'Partly (ST-01: stream UI, chat, phone macro)'),
    ('Kinetic typography', 'A', 'Lyrics, statements, hooks', 'Any', 'Yes (ST-01: lyric, hook sticker, captions)'),
    ('Particles / constellations', 'A', 'Memory, the second brain, the drop', '2–8 bars', 'No'),
    ('Abstract raymarched objects', 'A', 'Majestic A versions, hero shots', '4–16 bars', 'No (GPU-heavy at 4K)'),
    ('Ukiyo-e · ink wash · watercolour · crayon · isometric rooms · clay-like 3D', 'B', 'Short holds or backgrounds only', '≤ 1–2 bars', 'No'),
    ('Anime / cartoon humans · realistic faces · photoreal people', 'C', 'Never', '—', '—'),
]

FILMS = [  # film(s), section, level, path, home, switches, new styles to build, count, hours each, why
    ('ST-01 The train ride', '1 Streamer Stories', 6, 'Mixed', 'Pixel art', 'Neon line · Halftone · CRT/glitch',
     '— (built here)', 1, 9, 'Done 2026-10-04. Built the engine, pixel renderer, kinetic type, motion blur'),
    ('ST-02 The raid from the hero', '1 Streamer Stories', 6, 'Mixed', 'Voxel diorama',
     'CRT/VHS · LED dot-matrix · Kinetic type · Stained glass', 'Voxel diorama, LED dot-matrix, Stained glass', 1, 9,
     'Triumphant deck (STYLE_DECK.md). New home style, so counted like ST-01 (9 h), not 3.5'),
    ('ST-04, ST-06, ST-09 (wholesome)', '1 Streamer Stories', 6, 'Mixed', 'Pixel art',
     'Papercut · Neon line · Constellations · Halftone', 'Papercut, Constellations (first film only)', 3, 3.5,
     'Wholesome deck; reuses the ST-01 pixel home'),
    ('ST-05 (sad)', '1 Streamer Stories', 6, 'Mixed', 'Engraving / line hatching', 'Blueprint · Thermal · Terminal/ASCII',
     'All four', 1, 9, 'Sad deck; new home style'),
    ('ST-10 (sad)', '1 Streamer Stories', 6, 'Mixed', 'Engraving / line hatching', 'Blueprint · Thermal · Terminal/ASCII',
     '—', 1, 3.5, 'Reuses the ST-05 deck'),
    ('ST-03, ST-07, ST-08 (funny / bittersweet)', '1 Streamer Stories', 6, 'Mixed', 'Picked at step 1',
     'Picked at step 1', 'Depends on the deck', 3, 3.5, 'No example deck for these feelings yet'),
    ('GN-U1A (first A)', '2 Brand · Generic A', 6, 'Depth', 'Abstract raymarched + blueprint',
     'Constellations · Data/UI · Engraving', 'All', 1, 9, 'Builds the majestic sets: system view, constellations, sky'),
    ('GN-U2A … U8A', '2 Brand · Generic A', 6, 'Depth', 'Abstract raymarched + blueprint',
     'Constellations · Data/UI · Engraving', '—', 7, 3.5, 'Reuses the A sets; new use case'),
    ('GN-U1B (first B)', '3 Brand · Generic B', 6, 'Mixed', 'Pixel or voxel streamer room',
     'CRT · Halftone · Kinetic type · Neon line', 'The streamer room', 1, 8, 'Builds the room at level 6'),
    ('GN-U2B … U8B', '3 Brand · Generic B', 6, 'Mixed', 'Pixel or voxel streamer room',
     'CRT · Halftone · Kinetic type · Neon line', '—', 7, 3.5, 'Reuses the room and the deck'),
    ('MA-A', '4 Brand · Master', 8, 'Depth', 'Picked at step 1', 'Picked at step 1', 'Depends on the deck', 1, 12,
     'The hero film: camera choreography, nested pull-back'),
    ('MA-B', '4 Brand · Master', 7, 'Mixed', 'Picked at step 1', 'Picked at step 1', 'Reuses MA-A', 1, 7,
     'Same beats as A, reuses its assets'),
]


def main():
    wb = openpyxl.load_workbook(PLAN)
    old = wb['Effort Levels']
    hdr = {k: copy(getattr(old['A4'], k)) for k in ('font', 'fill', 'alignment', 'border')}
    inp = copy(old['B17'].fill)
    tot = copy(old['A32'].fill)
    idx = wb.sheetnames.index('Effort Levels')
    wb.remove(old)
    ws = wb.create_sheet('Effort Levels', idx)
    wrap = Alignment(wrap_text=True, vertical='top')
    bold = Font(bold=True)

    def head(r, cols):
        for i, v in enumerate(cols, 1):
            c = ws.cell(r, i, v)
            for k, s in hdr.items():
                setattr(c, k, copy(s))

    def row(r, vals):
        for i, v in enumerate(vals, 1):
            ws.cell(r, i, v).alignment = wrap

    ws['A1'] = 'Effort · level × path × style deck'
    ws['A1'].font = Font(bold=True, size=14)
    ws['A2'] = ("A film's effort is three choices: its LEVEL (how deep the rendering goes), its PATH (how the styles "
                "are used) and its STYLE DECK (home + 3–5 switch styles; styles not yet built cost a build). "
                "Owner rule: level 6–10, 6 is the floor, each film as high as it allows.")
    r = 4
    ws.cell(r, 1, '1 · Level').font = bold; r += 1
    head(r, ['Level', 'Name', 'Looks like', 'Rendering added', 'Style use at this level', 'Agent-hours', 'Final render (GPU)']); r += 1
    for L in LEVELS:
        row(r, L); r += 1
    r += 1
    ws.cell(r, 1, '2 · Path').font = bold; r += 1
    head(r, ['Path', 'What it is', 'When', 'Planned for']); r += 1
    for p in PATHS:
        row(r, p); r += 1
    r += 1
    ws.cell(r, 1, '3 · Style deck').font = bold; r += 1
    ws.cell(r, 1, DECK_RULE).alignment = wrap
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=7)
    ws.row_dimensions[r].height = 46; r += 1
    head(r, ['Style', 'Tier', 'Best for', 'Hold', 'Built in the engine?']); r += 1
    for s in STYLES:
        row(r, s); r += 1
    r += 1
    ws.cell(r, 1, 'Plan rates (% of a weekly allowance per agent-hour, incl. +30% rework; replace with your own)').font = bold; r += 1
    rates = {}
    for name, v in (('Pro', 0.065), ('Max 5×', 0.013), ('Max 20×', 0.0033)):
        ws.cell(r, 1, name); c = ws.cell(r, 2, v); c.fill = copy(inp); c.number_format = '0.00%'
        rates[name] = f'$B${r}'; r += 1
    r += 1
    ws.cell(r, 1, '4 · Effort by film').font = bold; r += 1
    head(r, ['Film(s)', 'Section', 'Level', 'Path', 'Home style', 'Switch styles', 'New styles to build', 'Count',
             'Hours each', 'Hours total', 'Pro weeks', 'Max 5× weeks', 'Max 20× weeks', 'Why']); r += 1
    first = r
    for f in FILMS:
        row(r, f[:9])
        for col in (8, 9):
            ws.cell(r, col).fill = copy(inp)
        ws.cell(r, 10, f'=H{r}*I{r}')
        for col, name in ((11, 'Pro'), (12, 'Max 5×'), (13, 'Max 20×')):
            c = ws.cell(r, col, f'=J{r}*{rates[name]}'); c.number_format = '0.00'
        ws.cell(r, 14, f[9]).alignment = wrap
        r += 1
    ws.cell(r, 1, 'Total').font = bold
    for col in range(1, 15):
        ws.cell(r, col).fill = copy(tot)
    for col, L in ((8, 'H'), (10, 'J'), (11, 'K'), (12, 'L'), (13, 'M')):
        c = ws.cell(r, col, f'=SUM({L}{first}:{L}{r - 1})'); c.font = bold
        if col > 10:
            c.number_format = '0.00'
    r += 2
    ws.cell(r, 1, 'Weeks = weekly allowances used (1.0 = one full week of that plan). Hours are estimates: note the '
                  'usage bar before and after each film and correct "Hours each". Source: docs/TIER_LIST.md, '
                  'docs/STYLE_DECK.md; rebuilt by tools/effort_sheet.py.')
    for col, w in zip('ABCDEFGHIJKLMN', (30, 22, 30, 40, 34, 24, 34, 8, 10, 11, 10, 12, 13, 50)):
        ws.column_dimensions[col].width = w
    wb.save(PLAN)
    print(PLAN, 'rows', r)


if __name__ == '__main__':
    main()
