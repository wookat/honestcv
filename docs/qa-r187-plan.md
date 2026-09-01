# R187 QA plan — dark mode (index-CgIGBUGL.js / Builder-zmrimX5Z.js / index-B7kNbn1a.css / theme.js)

## T1 Bundles + theme.js served
Index references asserted bundles; /theme.js loads pre-paint (script src before module).

## T2 Toggle cycle + persistence + no-flash
Header ThemeToggle (aria-label "X theme — switch to y theme") cycles light→dark→system; html.dark class tracks; honestcv.theme key set/removed ('system'=removed); reload with dark stored → documentElement already dark at earliest CDP evaluation (Page.addScriptToEvaluateOnNewDocument to capture class at document_start) + early screenshot.

## T3 System mode follows OS
Pref=system; Emulation.setEmulatedMedia prefers-color-scheme dark/light flips html.dark live (matchMedia listener).

## T4 Dark readability spot checks (1440)
Landing, Dashboard, Builder (edit+preview), Jobs, /ats-checker in dark: amber warning list (R168), Priority fixes (R176), health chips, ATS matched/missing chips — check computed colors are from remapped palette (no near-black-on-black; screenshot evidence).

## T5 White paper
ResumePreview sheet + template thumbs stay white (computed background rgb(255,255,255)) in dark mode; dashboard letterhead.

## T6 R186 regression in dark (mocked)
Variant dialog: original panel, emerald highlights visible on dark (bg uses --color-emerald remap), Keep my original works.

## T7 Mobile 375
Toggle visible, 40px target, header no overflow.

## T8 Cleanup
Baseline ["honestcv.clientId","honestcv.qa"] (honestcv.theme removed).
