# Play modes and achievements QA

## Scope

- Added Relaxed, Timed, and Perfect setup choices without changing puzzle generation or the numeric puzzle seed.
- Added conditional Timed presets, a locked in-game mode readout, mode-specific hint behavior, mode-aware result summaries, and device-local achievements.
- Reused the existing Aqua Glass and unified Aero surface styles for setup, game controls, results, and the achievements modal.

## Automated and static checks

- Verified every automatic time-table entry and every manual override in unit tests.
- Verified staged setup, locked active configuration, Reset, Next, Relaxed hints, Timed hints and penalty feedback, Perfect recovery, result summaries, persistence recovery, idempotent unlocks, completion dates, keyboard closing, and initial modal focus.
- Checked the existing responsive rules for setup overflow, board sizing below 900px and 500px, result-card sizing, and modal width constraints.
- Automated verification: 16 test files and 108 tests passed. The production build and `git diff --check` passed.

## Browser QA status

- The local preview server was available, but the in-app browser URL policy blocked localhost control before the desktop and narrow visual pass could begin.
- No alternate browser-control route was used. Desktop and narrow visual inspection remain a manual follow-up.

## Final result

final result: automated checks passed; manual browser QA pending

---

# Aqua Glass design QA

## Comparison target

- Source visual truth: `/Users/luke.ylias/.codex/generated_images/01a0359c-6273-78a3-8983-04be8fcb6a95/exec-c2bf2c89-fdf3-4a1a-a888-8d1b4f0686bb.png`
- Implementation screenshot: `/var/folders/pp/b_4hc1_s21nbqbj3tb4xwfzm0000gp/T/nono2000-aqua-glass-qa/game-relaxed-final-v2.png`
- Full-view comparison: `/var/folders/pp/b_4hc1_s21nbqbj3tb4xwfzm0000gp/T/nono2000-aqua-glass-qa/full-comparison-final.png`
- Focused comparison: `/var/folders/pp/b_4hc1_s21nbqbj3tb4xwfzm0000gp/T/nono2000-aqua-glass-qa/focused-comparison-final.png`
- Browser viewport: 1015 x 1089 CSS pixels at device pixel ratio 1.
- Source pixels: 1211 x 1299.
- Implementation capture pixels: 833 x 894. The in-app Browser capture transport scaled the 1015 x 1089 CSS viewport while preserving its aspect ratio.
- Density normalization: the source was fitted to 833 x 894 for the full-view comparison. The panel and board-tool regions were cropped independently and resized to equal pixel dimensions for the focused comparison.
- State: active 5 x 5 beginner puzzle, relaxed timer, sound and music on, fill selected, three hints remaining.

## Findings

- No actionable P0, P1, or P2 differences remain in the selected Aqua Glass button treatment.
- Fonts and typography: the implementation preserves the existing Figtree hierarchy and compact labels. The concept enlarged the controls and labels despite the prompt constraint to preserve layout, so the implementation intentionally keeps the product's current compact type scale.
- Spacing and layout rhythm: the existing panel, board, and tool geometry remain unchanged. Button padding and radii stay consistent across neutral, primary, active, timer, and board-tool states.
- Colors and visual tokens: primary actions use a cyan-to-blue glass gradient with a white top highlight and cobalt lower edge. Neutral controls use pearl chrome. Active controls use softly illuminated cyan. Timer and hint states use warm gold.
- Image quality and asset fidelity: the supplied NONO2000 logo remains the original raster asset. No new raster assets or substitute drawings were introduced.
- Copy and content: all existing labels and gameplay content remain unchanged.
- Accessibility: existing focus-visible outlines remain intact. Active states retain text and `aria-pressed` or switch semantics, so gloss is not the only state signal.

## Full-view comparison evidence

The implementation keeps the board dominant and limits saturated blue to primary and selected controls. The generated concept changed the scale and position of the existing product layout, which was outside the requested button-style scope. Preserving the current layout is an intentional constraint, not unresolved drift.

## Focused comparison evidence

The implementation matches the selected concept's material hierarchy: blue glass for New, pearl faces for Reset, Next, and Menu, cyan illumination for Sound and Music, gold for Timer and Hint, and a frosted fill/cross switch with a pearl selected thumb and blue fill mark.

## Comparison history

1. Initial implementation screenshot: `/var/folders/pp/b_4hc1_s21nbqbj3tb4xwfzm0000gp/T/nono2000-aqua-glass-qa/game-relaxed-final.png`.
   - P2: the selected half of the fill/cross switch used a solid blue thumb, while the concept used a pearl thumb containing a smaller blue fill mark.
   - Fix: restored the pearl selected thumb, retained the blue fill icon, and kept equal left and right inset spacing.
2. Post-fix screenshot: `/var/folders/pp/b_4hc1_s21nbqbj3tb4xwfzm0000gp/T/nono2000-aqua-glass-qa/game-relaxed-final-v2.png`.
   - Result: the switch material and hierarchy now match the selected concept. No P0, P1, or P2 issues remain.

## Interaction and runtime checks

- Start puzzle opened the setup screen.
- Begin puzzle started the game.
- System menu opened and closed.
- Sound toggled off and on with the correct pressed state.
- New opened the setup modal and Cancel returned to the current game.
- Browser console errors: none.
- Automated verification: 12 test files and 79 tests passed. The production build and `git diff --check` passed.

## Follow-up polish

- P3: the implementation's blue primary gradient is slightly more cyan than the generated concept's cobalt lower edge. This keeps the control aligned with the app's established palette and can be deepened later if a stronger logo match is preferred.

## Final result

final result: passed

---

# Solved result Aero surface and summary QA

## Comparison target

- Surface reference: `/Users/luke.ylias/.codex/generated_images/01a036f8-5a5c-7f21-b667-40d2ddd4f913/exec-863db03f-1486-4971-9689-ffc4aae3f95c.png`
- Annotated starting state: the supplied solved-screen browser capture with the yellow assisted-status box, result key, grid label, and hint badge.
- Implementation screenshot: `/private/tmp/nono2000-aero-result-final.jpg`
- Browser viewport: 1242 x 1089 capture.
- State: solved 5 x 5 hard puzzle with two hints and no mistakes.

## Findings

- No actionable P0, P1, or P2 differences remain in the requested result-card treatment.
- Surface: the result card now uses the same continuous Aero sheet tokens as the approved System, How to play, New puzzle, title, and mini-menu surfaces.
- Hierarchy: `Pattern revealed` remains the primary heading. The result is reduced to `Assisted solve` plus one facts line: `5×5 grid · 2 hints · No mistakes`.
- Nesting: the yellow status box, result legend, separate grid label, and hint-count badge have been removed. No substitute inner card was introduced.
- Controls: New, Replay, and Next are unchanged in label, order, sizing, and behavior.
- Game meaning: the revealed grid and mistake markers are unchanged.

## Full-view comparison evidence

The approved Aero reference and the implementation capture were inspected together at original resolution. The result card carries the same bright perimeter, pale aqua body, soft inset glow, and lower aqua depth while keeping the revealed grid as the visual focus.

## Focused comparison evidence

The result card reads as one surface. The compact summary uses plain text and a single divider, so hints, mistakes, and grid size can be scanned without decoding color keys or badges.

## Comparison history

1. Starting state used a nested yellow assisted-status panel plus a compact legend, separate grid line, and blue hint badge.
   - P2: result information was duplicated across several visual devices and competed with the heading.
   - Fix: consolidated the information into one outcome label and one grammatical facts line, then applied the shared Aero material to the outer result card.
2. Post-fix browser capture: `/private/tmp/nono2000-aero-result-final.jpg`.
   - Result: the card is visually consistent with the other menu surfaces and the summary is immediately readable. No P0, P1, or P2 issues remain.

## Interaction and runtime checks

- Completed the active 5 x 5 puzzle in the local browser and confirmed the solved result rendered after hot reload.
- New, Replay, and Next remain present and enabled.
- Browser console errors: none.
- Automated verification: 13 test files and 84 tests passed. The production build and `git diff --check` passed.

## Follow-up polish

- None for this scoped result-screen cleanup.

## Final result

final result: passed

---

# Unified Aero menu surface design QA

## Comparison target

- Source visual truth: `/Users/luke.ylias/.codex/generated_images/01a036f8-5a5c-7f21-b667-40d2ddd4f913/exec-863db03f-1486-4971-9689-ffc4aae3f95c.png`
- Final implementation screenshot: `/private/tmp/nono2000-aero-system-final-v3.png`
- Browser viewport: 1242 x 1089 CSS pixels at device pixel ratio 2.4.
- Source pixels: 1339 x 1175.
- Implementation pixels: 1242 x 1089. The source and implementation were inspected together at their natural aspect ratios; the menu region was used for the fidelity comparison.
- State: active 5 x 5 beginner puzzle in relaxed mode with the System menu open.

## Findings

- No actionable P0, P1, or P2 differences remain in the approved surface treatment.
- Fonts and typography: the implementation retains the app's existing Figtree hierarchy and exact menu labels. The generated target enlarged the modal typography, but the user explicitly locked the current controls and layout.
- Spacing and layout rhythm: all card footprints, padding, menu actions, and button geometry remain unchanged. The modal now has an 18px outer radius and one continuous edge treatment, with no nested header or body panel.
- Colors and visual tokens: the shared material uses an opaque pearl-to-aqua gradient, a white 3px rim, a two-pixel aqua inset keyline, a soft lower glow, and the existing teal depth shadow.
- Image quality and asset fidelity: no new raster assets were needed. The existing NONO2000 logo and gameplay artwork remain unchanged.
- Copy and content: no actions, labels, clues, or gameplay content changed.
- Accessibility: focus styles, button semantics, switch semantics, and dialog labels remain intact.

## Full-view comparison evidence

The selected target and final browser capture were inspected together in one comparison input. Both use one continuous aqua-pearl sheet, a bright outer rim, a subtle diagonal top highlight, a simple divider, and a stronger aqua lower edge. The implementation deliberately keeps the existing modal footprint and buttons instead of adopting the generated mock's larger proportions.

## Focused comparison evidence

The System menu provides a readable focused view of the shared material and every unchanged button state. A separate crop was unnecessary because the central modal is fully legible in both full-resolution images. The title menu, setup page, game mini menu, How to play modal, and New puzzle modal were also checked in the browser because they share the same material tokens.

## Comparison history

1. Initial implementation capture: `/private/tmp/nono2000-aero-system-final-1242x1089.png`.
   - P2: the unified structure was correct, but the outer rim and aqua lower depth were too quiet compared with the approved mock.
   - Fix: increased the rim from 2px to 3px, strengthened the inset aqua keyline, deepened the lower aqua gradient stop, and increased the inner lower glow. Buttons and layout were not changed.
2. Post-fix implementation capture: `/private/tmp/nono2000-aero-system-final-v3.png`.
   - Result: the card reads as one tactile Aero sheet with clear content contrast. No P0, P1, or P2 issues remain.

## Interaction and runtime checks

- Title menu rendered with the shared material.
- Start puzzle opened the setup page.
- Begin puzzle started a 5 x 5 game.
- Game mini menu retained its controls and layout.
- System menu opened and remained interactive.
- How to play opened with its interactive example intact.
- New opened the setup modal and Cancel returned to the game.
- Relaxed mode was restored for a stable final preview.
- Browser console errors: none.
- Automated verification: 13 test files and 84 tests passed. The production build passed.

## Follow-up polish

- None for the approved menu treatment.

## Final result

final result: passed

---

# Glass card opacity adjustment QA

## Comparison target

- Source visual truth: `/var/folders/pp/b_4hc1_s21nbqbj3tb4xwfzm0000gp/T/codex-clipboard-dc5df568-6060-4743-8448-35f323ea24fa.png`
- Implementation screenshot: `/private/tmp/nono2000-glass-opacity-qa.png`
- Browser viewport: 1242 x 1089 CSS pixels at device pixel ratio 2.
- Source pixels: 438 x 186.
- Implementation pixels: 1242 x 1089. The in-app Browser capture transport normalized the DPR 2 page to viewport pixel dimensions.
- State: active 5 x 5 puzzle with the System menu open.

## Findings

- No actionable P0, P1, or P2 differences remain in the adjusted card opacity.
- Fonts and typography: existing Figtree sizes, weights, and hierarchy remain unchanged.
- Spacing and layout rhythm: card dimensions, padding, controls, radii, and alignment remain unchanged.
- Colors and visual tokens: the shared card gradient now uses 0.96, 0.92, and 0.84 alpha stops. This keeps the pale aqua cast and white glass edge while preventing the board from competing with menu content.
- Image quality and asset fidelity: the logo and all existing raster assets remain unchanged.
- Copy and content: no text or labels changed.

## Full-view comparison evidence

The reference material and browser capture were inspected together in one local-image comparison. The adjusted card keeps the reference's bright perimeter, pale aqua body, and soft depth. Background content now reads as a faint contextual layer rather than visible content inside the menu.

## Focused comparison evidence

The System menu was used as the representative focused state because all five requested cards use the same `--panel-glass-face` token. Its heading, dividers, and controls retain clear contrast over the stronger translucent fill. A separate crop was unnecessary because the menu occupies the central, readable region of the full-resolution capture.

## Comparison history

1. Previous card treatment used alpha stops of 0.82, 0.70, and 0.56.
   - P2: the game board remained too visible through modal cards.
   - Fix: raised the shared alpha stops to 0.96, 0.92, and 0.84 without changing the border, blur, or aqua shadow.
2. Post-fix browser capture: `/private/tmp/nono2000-glass-opacity-qa.png`.
   - Result: card content is visually dominant and the glass character remains visible. No P0, P1, or P2 issues remain.

## Interaction and runtime checks

- The System menu remained open and interactive after hot reload.
- Browser console errors: none.
- Automated verification: 13 test files and 84 tests passed. The production build and `git diff --check` passed.

## Follow-up polish

- None for this adjustment.

## Final result

final result: passed

---

# NONO2000 aqua-gel logo design QA

## Comparison target

- Source visual truth: `/Users/luke.ylias/.codex/generated_images/01a0359c-6273-78a3-8983-04be8fcb6a95/exec-ae1670ed-058c-406a-9502-07c440ca29c3.png`
- Production asset: `/Users/luke.ylias/dev/NONO2000/public/assets/nono2000-logo-aqua-gel.png`
- Title-screen implementation screenshot: `/var/folders/pp/b_4hc1_s21nbqbj3tb4xwfzm0000gp/T/nono2000-logo-implementation-boot.png`
- Game-header implementation screenshot: `/var/folders/pp/b_4hc1_s21nbqbj3tb4xwfzm0000gp/T/nono2000-logo-implementation-game.png`
- Focused source and browser comparison: `/private/tmp/nono2000-logo-source-vs-browser.png`
- Browser viewport: 1280 x 720 CSS pixels at device pixel ratio 2.
- Source pixels: 1920 x 819. The transparent production crop is 1848 x 351.
- Implementation screenshot pixels: 1280 x 720. The browser capture transport normalized the DPR 2 page to viewport pixel dimensions.
- Rendered sizes: 420 x 79.77 CSS pixels on the title screen and 179.20 x 34.03 CSS pixels in the game header.
- States: title screen and active 5 x 5 beginner puzzle.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the selected logo's lettering remains inside the supplied raster artwork. The app does not substitute a font or recreate any part of the name mark.
- Spacing and layout rhythm: the existing logo containers are unchanged. The new transparent crop fills both containers without clipping or changing nearby spacing.
- Colors and visual tokens: the original aqua, white, teal, and dark-blue pixels are unchanged. No CSS filter, blend mode, tint, or opacity adjustment is applied.
- Image quality and asset fidelity: the selected generated mark is used directly. Post-processing only removed the generated checkerboard canvas, restored transparency, and trimmed empty margins. Browser rendering retains the gloss, keyline, outline, proportions, and exact `NONO2000` spelling.
- Copy and content: the visible mark and accessible fallback both read `NONO2000`.

## Full-view comparison evidence

The title screen keeps the existing layout and renders the selected mark at the established 420-pixel width. The active game uses the same asset at the established compact header width. Neither state clips or stretches the logo.

## Focused comparison evidence

The combined comparison shows the production asset and browser-rendered mark together. Letter shapes, aqua split, white highlight, dark outline, and internal glow remain consistent. The compact browser screenshot has lower capture resolution than the source asset, while the page itself loads the full 1848 x 351 production file.

## Comparison history

1. First browser pass checked the title screen and compact game header.
   - Result: no P0, P1, or P2 mismatch was found, so no visual fix followed the capture.

## Interaction and runtime checks

- Start puzzle opened the setup screen.
- Begin puzzle started the game and displayed the compact logo.
- The browser loaded `/assets/nono2000-logo-aqua-gel.png?v=20260825` at its full natural dimensions.
- Browser console warnings and errors: none.
- Automated verification: 13 test files and 84 tests passed.

## Follow-up polish

- None. The user explicitly selected this mark without further visual changes.

## Final result

final result: passed
