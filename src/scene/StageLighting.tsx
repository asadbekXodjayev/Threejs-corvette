// Dark stormy key lighting. A low, cool, bluish fill + a single soft key from
// the upper-left. No shadow casters here — the RoomEnvironment carries the paint
// reflections and the ContactShadow grounds the car. (The Lightning strobe adds
// its own directional flash light.)
export function StageLighting() {
  return (
    <>
      <ambientLight color="#2a3a5c" intensity={0.35} />
      <directionalLight position={[-6, 8, 4]} intensity={1.4} color="#dfe8ff" />
    </>
  )
}
