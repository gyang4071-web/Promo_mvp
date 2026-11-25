import { ContactShadows, Environment, Lightformer } from '@react-three/drei';

/**
 * Studio lighting for a product render: procedural softboxes (no HDR
 * download), a key light, a rim light and soft contact shadows.
 */
export function LightingEnvironment({ low = false }: { low?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight position={[-3.5, 6, 3]} intensity={1.6} color="#fff6ec" />
      <directionalLight position={[4, 3, -4]} intensity={0.8} color="#dfe8ff" />
      <Environment resolution={low ? 128 : 256} frames={1}>
        {/* dim studio walls so polished metal never reflects pure black */}
        <color attach="background" args={['#1d1c1b']} />
        {/* tall backdrop panel: gives the top face and ring a soft gradient */}
        <Lightformer form="rect" intensity={1.4} position={[0, 3, -7]} scale={[14, 5, 1]} />
        {/* large overhead softbox */}
        <Lightformer form="rect" intensity={2.4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[8, 5, 1]} />
        {/* key strip, left */}
        <Lightformer form="rect" intensity={3} position={[-6, 2.5, 2]} rotation-y={Math.PI / 2} scale={[1.2, 8, 1]} />
        {/* rim strip, right/back */}
        <Lightformer form="rect" intensity={2} position={[6, 2, -2]} rotation-y={-Math.PI / 2} scale={[1, 8, 1]} />
        {/* soft front fill so the polished ring catches a line */}
        <Lightformer form="rect" intensity={0.9} position={[0, 1.2, 7]} scale={[10, 1.2, 1]} />
        {/* warm floor bounce */}
        <Lightformer form="rect" intensity={0.35} color="#ffd9b0" position={[0, -3, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
      <ContactShadows
        position={[0, -0.036, 0]}
        opacity={0.62}
        scale={5.5}
        blur={2.6}
        far={1.6}
        resolution={low ? 256 : 512}
        frames={1}
        color="#000000"
      />
    </>
  );
}
