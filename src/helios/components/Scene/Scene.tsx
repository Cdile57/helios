import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Restaurant from "./Restaurant";

export default function Scene() {
  return (
    <Canvas shadows camera={{ position: [8, 6, 10], fov: 55 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 8, 6]} intensity={1.8} castShadow />
      <Restaurant />
      <OrbitControls makeDefault />
    </Canvas>
  );
}
