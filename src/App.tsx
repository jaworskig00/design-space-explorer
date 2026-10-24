import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import { Panel } from './components/Panel.tsx'
import { Toolbar } from './components/Toolbar.tsx'

export default function App() {
  return (
    <div className="app">
      <Toolbar />
      <Panel title="Parallel coordinates" testId="view-pcp" tall />
      <div className="row equal">
        <Panel title="Focused scatter" testId="view-scatter" />
        <Panel title="Pareto front" testId="view-pareto" />
      </div>
      <div className="row">
        <Panel title="Scatterplot matrix" testId="view-splom" />
        <div className="stack">
          <Panel title="Distributions" testId="view-histogram" />
          <Panel title="Details" testId="view-details" />
        </div>
      </div>
    </div>
  )
}
