# R300 production QA — first-class /documents and /samples routes

Production bundle: index-CAfEAaLA.js (verified via curl of live HTML). Zero real AI calls
(all /api/ai/* fetches intercepted pre-network; quota GETs mock-fulfilled {"freeRemaining":42}).
Recording unavailable (enigo down); CDP screenshots under /home/ubuntu/screenshots/r300_*.png.

Results (all passed, no P0–P3):
- T1 /documents: direct load 200; single h1 "Career documents"; sidebar item aria-current="page";
  no resumes/samples blocks; New cover letter + Import a cover letter present; empty state;
  seeded honestcv.careerDocs doc → card + Open dialog with Edit/Preview toggle and PDF/DOCX buttons.
- T2 /samples: direct load 200; h1 "Sample library"; sidebar active; search ("nurse"→1),
  sector tab (Healthcare & education→5) and Saved(1) filters all work.
- T3 /dashboard regression: all three sections render; h2#documents / h2#samples anchors kept;
  /dashboard#documents still scrolls under the sticky header.
- T4 direct refresh: curl and in-browser reload of both routes return 200 (worker SPA_ROUTES).
- T5 375×812: strict scrollWidth=375 on both routes; dark mode legible; theme restored.
- T6 cleanup: temp keys removed; honestcv.subscribed/shared preserved.

Harness notes: React-controlled search inputs need an input._valueTracker reset when cleared
via CDP; unsave probe not UI-verified (key removed in cleanup instead).
