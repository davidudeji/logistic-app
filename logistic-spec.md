
Overview and goals
Build the landing hero as a five-scene scroll story that sells. Match the 15-second reference reel scene for scene, but drive it with scroll instead of time.
• Single job: get the visitor to tap "Get a quote".
• Brand: "Trunkline" is a placeholder name. Keep it in one config file so it can be swapped.
• Reference: the Trunkline Reel artifact. Every timing, coordinate and easing in this spec comes from it.
• Targets: 60 fps on a mid-range Android phone, largest paint under 2.5 s on 4G, a reduced-motion version of every scene, and a quote button that is always reachable.
Stack and setup
Use Angular for the page, GSAP with ScrollTrigger for scroll-scrubbed timelines, and Lenis for smooth scrolling.
Piece
Choice
Why
Framework
Angular, the version already in the repo
The logistics app is Angular
Animation
GSAP 3 + ScrollTrigger
Pinning, scrub, clip-path and timelines in one tool
Smooth scroll
Lenis
Steadier scrubbing on touch and wheel
Images
AVIF or WebP with JPEG fallback in <picture>
Smaller files, same look
Styling
CSS custom properties
One token file, light and dark themes
Install and wire once, in a root-level service:
npm i gsap lenis
gsap.registerPlugin(ScrollTrigger);
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
Run all GSAP work inside NgZone.runOutsideAngular so scrolling never triggers change detection. Create each scene's timeline inside a gsap.context() and call ctx.revert() in ngOnDestroy so navigating away leaves no stray triggers.
Assets
Five reference images drive the build. Put them in src/assets/img/ and treat them as placeholders: two carry another company's branding and three are too small for phone screens.
File
Size (px)
Used in
Crop and note
highway.jpg
600 × 300
Scene 1
Poster text is baked into the left side (source x under 205). Show only source x 228 to 468. Upscaled 1.7 to 1.95 times, so it looks soft.
truck-closed.jpg
1920 × 960
Scenes 2, 4, 5
Top-down three-quarter view, cab at left.
truck-open.jpg
1920 × 960
Scene 3
Same truck with rear doors open. Camera angle differs slightly from the closed shot, so the switch uses an iris, not a fade.
crates.png
300 × 150
Scenes 3, 4
Opaque near-white background. Blend with multiply so the background disappears.
containers.webp
300 × 150
Scene 4
A shipping line's logo sits on the left third. Show only source x 121 and up.
Before launch, replace all five. Use your own fleet photos or licensed images, at least 1920 × 960 for backgrounds and 1200 px wide for crate and container cut-outs, ideally as transparent WebP. Any replacement of the two truck shots changes the callout coordinates in Scenes 2 and 3, so re-measure them.
Design tokens
Define every color as a CSS custom property on :root, then redefine the same names for dark mode under prefers-color-scheme and a data-theme attribute. Components read tokens only, never literal colors.
Token
Light
Dark
Use
--bg
#E6EAE8
#081017
Page ground
--surface
#F4F6F3
#0E1A23
Cards, content panels
--ink
#10202B
#E7EEF0
Text
--muted
#566770
#8FA3AE
Captions, labels
--line
#C8D1CE
#223540
Rules, card borders
--accent
#F0661A
#FF7A33
Buttons, route marks, live dot
--on-accent
#10202B
#10202B
Text on the accent
Type uses three roles. Display is Big Shoulders Display 800, uppercase, for headlines at 40 to 52 px. Body is IBM Plex Sans 400 and 500 at 12 to 16 px. Data and labels are IBM Plex Mono 500 at 9 to 11 px with 0.08 to 0.12 em letter spacing, uppercase. Load all three from Google Fonts with display=swap and a real fallback stack.
Spacing uses a 24 px side gutter on the 400 px design canvas, 8 px steps, and 4 px corner radius on cards and buttons. Photos always sit under a scrim or inside a light card so text keeps at least 4.5:1 contrast.
One boldness rule: the orange accent is the only saturated color. Do not add a second.