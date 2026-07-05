import { SmoothScroll } from './scroll/SmoothScroll'
import { Experience } from './scene/Experience'
import { ScrollLayer } from './ui/ScrollLayer'
import { Loader } from './ui/Loader'
import { Cursor } from './ui/Cursor'
import { useCapability } from './hooks/useCapability'

export default function App() {
  useCapability()
  return (
    <SmoothScroll>
      <Loader />
      <Experience />
      <ScrollLayer />
      <Cursor />
    </SmoothScroll>
  )
}
