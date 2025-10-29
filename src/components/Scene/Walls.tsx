import * as THREE from "three";
import { useMemo } from "react";
import { useStore } from "../../store/usestore";

const Mat = (color: string, rough=0.9, metal=0) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

export default function Walls() {
  const s = useStore();
  const wallMat = useMemo(() => Mat("#1f2430", 0.9, 0), []);
  const trimMat = useMemo(() => Mat("#151922", 0.7, 0.05), []);

  const Rect = ({
    size, pos, rot, mat=wallMat,
  }: { size:[number,number,number]; pos:[number,number,number]; rot?:[number,number,number]; mat?:THREE.Material }) => (
    <mesh position={pos} rotation={rot} castShadow>
      <boxGeometry args={size} />
      <primitive object={mat} attach="material" />
    </mesh>
  );

  const { roomW, roomD, wallH, wallThickness:t, doorW, doorH,
          windowCount, windowW, windowH, windowSill } = s;

  // 前面（+Z）に入口
  const FrontWall = () => {
    const halfW = roomW/2, y = wallH/2, z = roomD/2;
    const doorHalf = doorW/2, lintelH = wallH - doorH;
    return (
      <>
        <Rect size={[halfW - doorHalf, wallH, t]} pos={[-(roomW/2 - (halfW-doorHalf)/2), y, z]} />
        <Rect size={[halfW - doorHalf, wallH, t]} pos={[ (roomW/2 - (halfW-doorHalf)/2), y, z]} />
        <Rect size={[doorW, lintelH, t]} pos={[0, doorH + lintelH/2, z]} />
      </>
    );
  };

  // 背面（-Z）は全面
  const BackWall = () => (
    <Rect size={[roomW, wallH, t]} pos={[0, wallH/2, -roomD/2]} />
  );

  // 左右壁：窓スリット
  const SideWall = ({ side }: { side:"L"|"R" }) => {
    const x = side === "L" ? -roomW/2 : roomW/2;

    // 窓中心Zを等間隔
    const usable = roomD - 0.6;
    const step = usable / (windowCount + 1);
    const centers = Array.from({length: windowCount}, (_,i)=> -roomD/2 + (i+1)*step);

    // 下帯・上帯
    const lowerH = windowSill;
    const upperH = wallH - (windowSill + windowH);

    return (
      <>
        <Rect size={[t, lowerH, roomD]} pos={[x, lowerH/2, 0]} />
        <Rect size={[t, upperH, roomD]} pos={[x, windowSill + windowH + upperH/2, 0]} />
        {/* スリットの両側に残す帯 */}
        {centers.map((cz, i) => {
          const prev = i === 0 ? -roomD/2 : centers[i-1];
          const next = i === centers.length-1 ? roomD/2 : centers[i+1];
          const leftLen  = Math.max(0, cz - windowW/2 - prev);
          const rightLen = Math.max(0, next - (cz + windowW/2));
          return (
            <group key={i}>
              {leftLen  > 0.001 && <Rect size={[t, windowH, leftLen]}  pos={[x, windowSill + windowH/2, (prev + (cz-windowW/2))/2]} />}
              {rightLen > 0.001 && <Rect size={[t, windowH, rightLen]} pos={[x, windowSill + windowH/2, ((cz+windowW/2) + next)/2]} />}
            </group>
          );
        })}
      </>
    );
  };

  // 巾木＆天井見切り（細い帯）
  const Trims = () => (
    <>
      <Rect mat={trimMat} size={[roomW, 0.06, 0.03]} pos={[0, 0.03,  roomD/2 - 0.015]} />
      <Rect mat={trimMat} size={[roomW, 0.06, 0.03]} pos={[0, 0.03, -roomD/2 + 0.015]} />
      <Rect mat={trimMat} size={[0.03, 0.06, roomD]} pos={[-roomW/2 + 0.015, 0.03, 0]} />
      <Rect mat={trimMat} size={[0.03, 0.06, roomD]} pos={[ roomW/2 - 0.015, 0.03, 0]} />
      <mesh position={[0, wallH - 0.03, 0]}>
        <boxGeometry args={[roomW - 0.1, 0.02, roomD - 0.1]} />
        <meshStandardMaterial emissive={"#6ee7ff"} emissiveIntensity={0.35} color={"#0a0e17"} />
      </mesh>
    </>
  );

  return (
    <group>
      <FrontWall />
      <BackWall />
      <SideWall side="L" />
      <SideWall side="R" />
      <Trims />
    </group>
  );
}
