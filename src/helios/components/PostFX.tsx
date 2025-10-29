import { EffectComposer, SSAO } from '@react-three/postprocessing'

export default function PostFX() {
  return (
    <EffectComposer enableNormalPass>
      <SSAO samples={11} radius={0.1} intensity={1.0} />
    </EffectComposer>
  )
}
