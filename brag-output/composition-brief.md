# Hyperframes Composition Brief: Valizent CRM

## Objective
Create a short, polished launch-style brag video for Valizent CRM — an
internal ERP for a real manpower supply & trading operation in Saudi Arabia.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 22 seconds

## Source Material
- Project root: `C:\Users\JARVIS\Desktop\Al Jazeera CRM` (client/ + server/,
  two separate repos)
- Primary files read: `client/README.md`, `client/CLAUDE.md`,
  `client/package.json`, `client/tailwind.config.js`, `client/src/index.css`
- Product name: Valizent CRM (the app's own white-label fallback name —
  `BrandLogo`/`useBranding` falls back to "Valizent CRM" until a deployed
  customer sets their own company name/logo; this video deliberately uses
  that generic name rather than any one customer's real branding)
- Tagline / strongest claim: "Replaces Excel sheets, WhatsApp coordination,
  and paper tracking as the daily operating system." (client/README.md /
  CLAUDE.md, near-verbatim)
- Key UI/visual moment to recreate: the Requirements board Kanban
  (card moving New → In Review → Approved) and a detail panel that mirrors
  from English to true Arabic RTL
- Copy that must appear verbatim or near-verbatim:
  - "Excel sheets." / "WhatsApp groups." / "Paper files." (paraphrased from
    the README's "Excel sheets, WhatsApp coordination, and paper tracking")
  - "Valizent CRM" (exact)
  - Module names: Employees, Clients, Deployments, Payroll, Approvals (exact,
    from the module list in README/CLAUDE.md)

## Creative Direction
- Tone preset: polished
- Creative direction: quiet premium product film — confidence through
  restraint, not hype. This is earnest enterprise software, not a joke
  product; the "funny" angle of other brags doesn't apply here.
- Interpretation: slow-ish holds (4-6s/scene), light-to-medium type weight,
  soft crossfades only (no hard cuts), minimal SFX, steady low music.
- Angle: the "before" (Excel/WhatsApp/paper, stated completely flatly, no
  music, no color) crossfades into the "after" (this app's own real dark
  theme, its real Kanban workflow, its real Arabic RTL support) — the
  product earns the contrast by actually being that different, not by the
  video claiming it.
- Hook: three flat lines, one at a time, near-black background, total
  silence except a very late, very quiet music fade-in under the third line.
- Outro / punchline: "Valizent CRM." then "Built for the operation, not the
  pitch deck." — product name, a quiet tagline, a hold. No joke payoff.
- Avoid:
  - Generic SaaS language ("streamline your workflow", etc.)
  - Abstract filler visuals — no particle systems, no stock gradients
    unrelated to the app's own token system
  - Any real client, employee, or production company name/data — use
    plausible fictional stand-ins only
  - Hard cuts or loud SFX — this tone is restraint, not energy

## Visual Identity
All values are the project's own `.dark` theme CSS variables
(`client/src/index.css`), used as this video's base look (a real, documented
feature of the app, not an invented palette):
- Background: `rgb(4 7 22)` (`--color-bg`, dark)
- Surface/card: `rgb(17 22 44)` (`--color-surface`, dark)
- Border: `rgb(42 50 82)` (`--color-border`, dark)
- Text: `rgb(236 238 248)` (`--color-text`, dark)
- Muted text: `rgb(148 158 190)` (`--color-muted`, dark)
- Primary/accent: `rgb(129 128 246)` (`--color-primary`, dark — brighter
  indigo tuned for dark backgrounds)
- Success: `rgb(45 205 110)` (`--color-success`, dark)
- Background wash: the app's own dark-mode `--bg-wash` — four soft radial
  glows (indigo/violet/cyan/pink) at low opacity, corners only, never full-
  saturation color fill
- Display font: "Plus Jakarta Sans" (the app's `font-heading`; fall back to
  a close system/Google-Fonts match if unavailable in the render environment)
- Body font: Inter (the app's `font-sans`)
- Visual references from the project: the app's dark-mode token system
  (soft indigo-tinted near-black, "never pure #fff/#000"), the exponential
  ease-outs the app's own Tailwind config defines (`out-expo`/`out-quint` —
  no bounce/elastic eases anywhere in this app, matching the restrained tone)

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract —
full per-scene text, timing, and audio notes live there. Scene summary:

1. Hook — 4.0s — three flat lines appear one at a time: "Excel sheets.",
   "WhatsApp groups.", "Paper files." — near-black, no cards, near-silent.
2. Reveal — 5.3s — "Valizent CRM" wordmark settles; 5 module-name chips
   (Employees/Clients/Deployments/Payroll/Approvals) tick in left-to-right
   over a dimmed, out-of-focus dashboard card grid.
3. Workflow — 5.5s — Requirements-board Kanban; one card slides from
   "In Review" to "Approved" and settles with a check badge. Caption:
   "A requirement becomes a tracked deployment."
4. Bilingual — 4.5s — the same detail panel mirrors live from English to
   true right-to-left Arabic; an "EN"→"AR" pill flips with it.
5. Outro — 2.7s — near-black background wash alone; "Valizent CRM" settles
   larger/centered; tagline "Built for the operation, not the pitch deck."
   holds to the end.

## Audio
- Audio role: warm, restrained corporate bed; sparse, tasteful SFX only at
  real motion moments (3 cues total across the whole video)
- Audio arc: silence under the hook → fades in very low under the hook's
  third line → rises to a steady 0.30 for the reveal/workflow/bilingual
  scenes → fades fully to 0 across the outro hold
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
  (already copied into the composition's `assets/music/`)
- Music treatment: volume never above 0.30; fade-in under Scene 1's third
  line (~1.0s in); fade-out across the full final scene (~2.7s)
- Music cue guidance: bundled preset at
  `C:\Users\JARVIS\.claude\skills\brag\assets\music\cues\happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json/.md`
  — tempo ≈ 109.96 BPM. Two strong-cue timing hints (bias only, not forced):
  - **9.29s** (strength 0.97, strong_beat) — target for the Kanban card's
    landing moment in Scene 3
  - **17.47s** (strength 0.99, strong_beat) — target for the EN→AR flip in
    Scene 4
  No other moment should be forced onto the beat grid — the hook's three
  sequential lines are deliberately NOT beat-synced (110 BPM is far faster
  than their required reading-time holds; forcing it would rush them).
- Audio-reactive treatment: subtle — let the background wash's glow/opacity
  breathe gently with music RMS during Scenes 2-4 only. No waveform bars, no
  equalizer graphics, no strobing, no readability impact.
- Audio-coupled moments:
  - Scene 2, wordmark settle (~0.2s into the scene) — one soft announcement
    SFX, already staged at `assets/sfx/interface/bong_001.ogg`
  - Scene 3, card lands in "Approved" (target ~9.29s) — a card-landing SFX,
    already staged at `assets/sfx/casino/card-slide-3.ogg` (slide, just
    before landing) + `assets/sfx/casino/card-place-2.ogg` (the landing
    itself)
  - Scene 4, EN→AR flip (target ~17.47s) — a soft switch SFX, already
    staged at `assets/sfx/interface/switch_004.ogg`
  - No SFX in Scene 1 (silence is the point) or Scene 5 (let the music fade
    carry the ending)
- SFX selection guidance: the four files above are already staged in
  `assets/sfx/` and match the plan's intent; swap for a better-fitting file
  from the same families only if the implemented motion clearly calls for
  it — keep the total at 2-3 cues, all soft, none above the volumes noted
  in `audio.md`
- Exact SFX choice / timestamps / density: Hyperframes' call once the real
  animation timing exists — the files above are a starting point, not a
  fixed requirement
- Audio files: already copied into `brag-output/composition/assets/music/`
  and `brag-output/composition/assets/sfx/{interface,casino}/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core`
(composition contract + `data-*` timing), `hyperframes-animation` (motion),
`hyperframes-creative` (design spec, beats, audio-reactive),
`hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli`
(lint/check/render). This is `/brag`'s own workflow — do not enter the
`hyperframes` entry-point intent interview and do not route into its generic
promo/launch-video workflow. Prefer native Hyperframes conventions over
anything written above.

Requirements:
- Show at least one real UI/workflow moment from the source project (the
  Kanban requirements board and the EN→AR RTL flip both qualify — both are
  real, documented, built features, not invented ones).
- Keep all text readable in the final render — respect the reading-time
  floors already baked into the per-scene durations above.
- Keep the video within 15-25 seconds (target 22s).
- Include the planned music/SFX layer — audio was not disabled and silence
  is only used intentionally in Scenes 1 and 5, as noted above.
- Treat the music cue guidance above as optional timing hints, not a fixed
  cue sheet — choose exact SFX files/timestamps once the real animation
  timing exists; ignore any cue that would hurt readability or pacing.
- Use only the 2 strong-cue locks noted above; do not add more.
- Honor the planned music treatment (silence → low fade-in → steady 0.30 →
  full fade-out) using whatever Hyperframes-supported audio mechanism fits
  best.
- Apply the subtle audio-reactive glow/opacity treatment described above if
  the extraction helper is available; if ffmpeg or the extraction helper is
  unavailable, note it in the summary and skip audio-reactive rather than
  blocking the render. (ffmpeg has been confirmed present on this machine.)
- Use local assets only — the music and SFX are already staged under
  `assets/`; use relative paths from `composition/`, never absolute paths.
- Run `hyperframes check` before render — it is `/brag`'s single
  pre-render gate.
- Keep creation and rendering local. No publish/cloud workflow — this is a
  local-only render for internal review.

## Sensitive-data note
This project's real UI shows real client names, real employee records, and
real financial figures (per the project's own CLAUDE.md status log). None of
that may appear anywhere in this composition. Every label, name, and number
in the storyboard above is a plausible fictional stand-in, chosen to look
like real UI content without being real UI content.
