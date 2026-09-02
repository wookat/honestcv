# R232 QA plan — profile photo crop/reposition dialog

Code evidence: src/components/PhotoCropDialog.tsx (192px viewport, zoom range input 1–3 step .01 aria-label "Zoom", drag via pointer events with offset clamped to ±(dim−crop)/2, Save renders srcRect → 256×256 JPEG toDataURL(0.85), Dialog title "Adjust photo", Cancel/overlay → onCancel); Builder.tsx:2159 "Add photo (optional)"/"Change photo" button clicks hidden file input (photoInputRef), onChange loads image → setPhotoDraft opens dialog; invalid image → photoError "Could not read that image — try a JPG or PNG." (Builder.tsx:2201), no dialog; onSave commits resume.photo (2211), onCancel discards. Bundles: index-CN-Pr4zv.js / Builder-DrtiqsJU.js.

Fixture: generate /tmp/r232_marker.png locally with PIL — 800×400, solid blue rgb(40,80,200) with a solid red rgb(220,30,30) 120×120 square at top-left (0,0) and green rgb(30,180,60) 60px stripe at right edge. Center crop at 1× = source rect x∈[200,600] (no red, no green). Upload via CDP DOM.setFileInputFiles on the photo input.

## P0 Bundles + dialog opens
Bundles live. Load example. Click "Add photo (optional)", set file → dialog with title "Adjust photo", 192px crop viewport, zoom slider value 1. Pass: dialog visible in screenshot; img style at 1× centered: left = −sx·s where sx=200 ⇒ left=−96px, width=800·(192/400)=384px.

## P1 Save at default 1× = old auto center crop
Click "Save photo" → resume.photo is a data:image/jpeg 256×256; decode via PIL: NO red pixels (r>180,g<90,b<90) and NO green-stripe pixels — all ≈ blue. Thumbnail visible in Contact area + photo visible in preview (screenshot).

## P2 Zoom + drag to marker; clamping
Re-open via "Change photo" + same file. Set slider to 2 (native input event). Real pointer drag on the crop area: mousePressed at center, several mouseMoved to +150,+150 (drag content so top-left region becomes visible; offset = −delta/s clamped), screenshot MID-DRAG (button held). Clamp check: continue drag by +1000,+1000 → img computed left/top must equal 0 (offset at −max ⇒ sx=0 ⇒ left=0), never positive. Save → decode resume.photo: red pixels present (top-left marker region dominant in crop), ≥20% red. Preview thumbnail + resume preview show red marker (screenshot).

## P3 Cancel byte-identity
Snapshot localStorage honestcv.resume; "Change photo" + file, drag/zoom arbitrarily, click Cancel → dialog gone, resume byte-identical. Repeat with ESC key → same.

## P4 PDF export contains adjusted photo
Set download dir via Browser.setDownloadBehavior, click PDF export, convert page 1 with pdftoppm → red marker pixels present in top-right photo area of the PDF raster.

## P5 Remove + invalid file
"Remove" (photo) → resume.photo cleared, thumbnail gone. Upload /tmp/r232_fake.png (text bytes) → inline error text exactly "Could not read that image — try a JPG or PNG.", no dialog, resume.photo unchanged (screenshot).

## P6 375px + dark
375×812: open dialog → dialog rect fully within viewport, scrollWidth ≤375, slider + drag work (drag changes img left/top). Screenshot. Dark mode (html.dark): dialog title/description text contrast ≥4.5:1 (core-pixel method), screenshot.

## P7 Regression
ATS visible score identical before photo ops vs after save/remove. R231 smoke: paste JD, enable "Highlight in preview" → CSS.highlights.get('kw-match') size>0 and amber pixels; uncheck → undefined.

## P8 Cleanup
Zero /api/ai generation calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"]. Screenshots r232_*.png; results appended below.

## Results (executed live on production, bundles index-CN-Pr4zv.js / Builder-DrtiqsJU.js)
- P0 passed: Add photo → file set → "Adjust photo" dialog, slider value 1, img computed style width 384px / left −96px / top 0px — exact predicted center-crop framing math (r232_dialog_open.png)
- P1 passed: Save at default → resume.photo data:image/jpeg 256×256, decoded pixels 65536/65536 blue, 0 red / 0 green (old auto center crop preserved); thumbnail + preview photo render (r232_center_saved.png)
- P2 passed: zoom 2 → img 768px/−288/−96 (exact); real pointer drag toward top-left marker, mid-drag screenshot with button held (r232_middrag.png); over-drag clamped at left/top exactly 0px, never positive; Save → decoded crop 36% red = exactly the 120²/200² marker area; marker visible in thumbnail/preview (r232_marker_saved.png, r232_dragged_corner.png)
- P3 passed: Cancel and ESC each close the dialog with honestcv.resume byte-identical (after zoom/drag inside dialog)
- P4 passed: PDF export (after one-time beta email unlock dialog) rasterized page 1 contains 576 red-marker pixels (r232_pdf_page1.png). Note: download required Browser.setDownloadBehavior allowAndName; first attempts with plain 'allow' produced no file.
- P5 passed: Remove clears resume.photo, button reverts to "Add photo (optional)"; text-renamed .png → inline error exactly "Could not read that image — try a JPG or PNG.", no dialog, photo unchanged (r232_invalid_error.png)
- P6 passed: 375×812 dialog fully inside viewport (right 347.5, bottom 624), scrollWidth 375; slider+drag functional (img left −96→−242); dark dialog contrast 16.60:1 (r232_375_dialog.png, r232_dark_dialog.png)
- P7 regression passed: visible score 99/100 identical across save/remove; R231 smoke — JD + checkbox → registry size 7, amber pixels present, uncheck → undefined (r232_r231_smoke.png)
- P8 done: zero /api/ai generation calls; light theme; final localStorage exactly ["honestcv.clientId","honestcv.qa"] (beta-unlock keys honestcv.subscribed/resumeHistory/shared created during P4 were removed in cleanup)
