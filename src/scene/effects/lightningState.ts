// Shared non-reactive lightning state (like scroll/progress.ts). The Lightning
// component writes it on each strike; the storm environment reads `flash` to
// spike light + wet-road emissive, and the camera Rig reads `spike` to jolt the
// handheld shake in sync with the flash (brief §5, §6 Chapter 1).
export const lightning = {
  /** 0..1 current flash brightness (sharp attack, flickering decay) */
  flash: 0,
  /** 0..1 shake-amplitude boost applied on a strike, decays fast */
  spike: 0,
}
