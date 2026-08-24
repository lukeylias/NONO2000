# Design QA: responsive primary-mark selector

## Reference

- Selected concept: `/Users/luke.ylias/.codex/generated_images/01a027ea-1fb4-7200-95eb-4dcea87a8c5f/exec-64e3bb64-8ae9-4935-8d30-154fe4ac8a01.png`
- Concept intent: a compact Fill/Cross segmented control directly below the puzzle grid, with clear selected-state feedback and touch-friendly targets.

## Implementation evidence

- Desktop playing-state capture: `/private/tmp/nono2000-touch-controls-desktop.png`
- Responsive tablet and phone capture: `/private/tmp/nono2000-touch-controls-responsive.png`
- Side-by-side visual comparison: `/private/tmp/nono2000-touch-controls-comparison.png`
- Tablet viewport represented at 834 x 1194 CSS pixels.
- Phone viewport represented at 390 x 844 CSS pixels.
- State checked: 10 x 10 puzzle, playing, Fill and Cross selection states.

## Interaction checks

- Fill and Cross are rendered immediately below the grid at desktop, tablet, and phone sizes.
- Both controls remain visible without horizontal overflow at 834 x 1194 and 390 x 844.
- Touch/pen input follows the selected primary mark.
- Mouse mapping is invariant: left-click always performs Fill, even while Cross is selected; right-click always performs Cross.
- New puzzles reset the touch selector to Fill.
- The How to play copy explains the separate touch and mouse behaviors.
- Browser console showed no errors during the responsive interaction pass.

## Automated checks

- `npm test`: 11 files passed, 73 tests passed.
- `npm run build`: TypeScript and Vite production build passed.
- Regression coverage includes touch Cross selection and mouse left-click Fill while Cross is selected.

## Comparison findings

- The implementation preserves the concept's below-board relationship and two-part segmented shape.
- Selected Fill uses the established cyan system color; selected Cross uses the established orange cross color.
- Target height is 52 px on larger screens and 48 px on smaller screens, keeping the controls compact while remaining touch-friendly.
- Existing game layout, grid prominence, and visual language remain unchanged outside this new control.
- No P0, P1, or P2 visual issues remain in the checked states.

## Comparison history

1. Initial desktop implementation confirmed placement and selected-state styling.
2. Responsive pass corrected cell sizing to avoid negative height calculations in short landscape layouts.
3. Final tablet and phone pass confirmed visibility, containment, and invariant mouse behavior.

Final result: passed

---

# Design QA: subtle XP/Y2K interface chrome

## Reference

- Source visual truth: `/var/folders/pp/b_4hc1_s21nbqbj3tb4xwfzm0000gp/T/codex-clipboard-4d222424-a152-4e03-953c-83f3b603f8fe.png`
- Source pixels: 800 x 800.
- Design intent: translate the reference's pale aqua faces, silver borders, inset highlights, and shallow pressed states into NONO2000 without copying its icons, dense gloss, or stronger decorative effects.
- Protected scope: puzzle cells, puzzle grid, row clues, column clues, and clue typography.

## Implementation evidence

- Desktop title: `/tmp/nono2000-y2k-title.png`
- Desktop system menu: `/tmp/nono2000-y2k-system-menu.png`
- Desktop how-to-play dialog: `/tmp/nono2000-y2k-how-to-play.png`
- Desktop setup: `/tmp/nono2000-y2k-setup.png`
- Desktop game controls: `/tmp/nono2000-y2k-game-controls.png`
- Mobile system menu: `/tmp/nono2000-y2k-mobile-system-menu.png`
- Full-view comparisons: `/tmp/nono2000-y2k-comparison-title-system.png` and `/tmp/nono2000-y2k-comparison-dialogs-game.png`
- Desktop implementation pixels and CSS viewport: 1015 x 1089 at browser density 1.
- Mobile implementation pixels and CSS viewport: 390 x 844 at browser density 1.
- Density normalization: the source was fit inside the comparison canvas without cropping; implementation screenshots were fit proportionally beside it. This is a style-language comparison rather than a literal screen recreation.

## States and interaction checks

- Checked title buttons, setup selectors, system-menu selectors and toggles, how-to-play actions, in-game header controls, timer controls, and Fill/Cross controls.
- Verified selected 10 x 10 and Standard states exposed `aria-pressed="true"`.
- Verified Sounds toggled off and back on with the correct pressed state.
- Verified both dialogs opened and closed from their visible controls.
- Mobile system menu measured 370 x 539 inside a 390 x 844 viewport, with no horizontal overflow and no internal scrolling required.
- Browser console showed no errors or warnings.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: Figtree remains unchanged, preserving NONO2000's existing hierarchy and readable small labels. The reference's more decorative display lettering was intentionally not copied into utility controls.
- Spacing and layout rhythm: existing component spacing and sizing remain intact. Squarer 7 to 10 px radii and two to three pixels of depth introduce the period treatment without increasing density.
- Colors and visual tokens: controls use pale cyan faces, silver-blue borders, white top highlights, and restrained lower edges. Selected states are clearer cyan; destructive actions retain a quiet red treatment.
- Image quality and asset fidelity: the existing transparent NONO2000 logo remains unchanged. No reference icons or decorative image assets were needed or substituted.
- Copy and content: all product copy, labels, instructions, clue numbers, and board content remain unchanged.
- The reference uses stronger gloss, gradients, large icons, and decorative badges. Omitting those is intentional because the brief asked for a subtle thematic fit rather than a literal skin.

## Focused comparison

- Focused views were required because bevel depth, selected states, modal borders, and small button labels are not legible in the full-view montage.
- Full-resolution title, system-menu, how-to-play, setup, game-control, and mobile screenshots were inspected after the combined comparisons.
- The board and clue typography show no visible change between the before and after captures.

## Comparison history

1. Initial implementation comparison found no P0, P1, or P2 issues. The aqua chrome was visible across all requested controls without overpowering the board.
2. Focused desktop inspection confirmed consistent bevels, readable small labels, restrained primary actions, and coherent dialog framing.
3. Mobile inspection confirmed the same style language at 390 x 844 with no overflow or clipped controls.

## Automated checks

- `npm test`: 11 files passed, 73 tests passed.
- `npm run build`: TypeScript and Vite production build passed.
- `git diff --check`: passed.

## Follow-up polish

- P3: a future pass could tune the primary aqua button saturation after extended play, but the current contrast and hierarchy are appropriate for this brief.

Final result: passed
