import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Histogram } from './charts/Histogram.tsx'
import { ParallelCoordinates } from './charts/ParallelCoordinates.tsx'
import { ParetoPlot } from './charts/Pareto.tsx'
import { ScatterPlot } from './charts/Scatter.tsx'
import { Splom } from './charts/Splom.tsx'
import { DetailsPanel } from './components/DetailsPanel.tsx'
import { HelpButton } from './components/HelpButton.tsx'
import { Onboarding } from './components/Onboarding.tsx'
import { RangeFields } from './components/RangeFields.tsx'
import { Toolbar } from './components/Toolbar.tsx'
import { initTable } from './data/columns.ts'
import { loadDesigns } from './data/loadDesigns.ts'
import { hashFor, decodeState } from './lib/urlState.ts'
import { useExplorer } from './state/explorerStore.ts'

function firstVisit() {
  if (navigator.webdriver) return false
  try {
    return localStorage.getItem('dse-onboarding') !== '1'
  } catch {
    return false
  }
}

export default function App() {
  const ready = useExplorer((state) => state.ready)
  const [helpOpen, setHelpOpen] = useState(firstVisit)

  const closeHelp = useCallback(() => {
    try {
      localStorage.setItem('dse-onboarding', '1')
    } catch {
      /* private mode can reject storage; the panel still closes */
    }
    setHelpOpen(false)
  }, [])

  useEffect(() => {
    let cancel = false
    loadDesigns()
      .then((table) => {
        if (cancel) return
        initTable(table)
        const snapshot = decodeState(window.location.hash)
        if (snapshot) useExplorer.getState().applySnapshot(snapshot)
        else useExplorer.getState().setReady()
      })
      .catch((error: unknown) => {
        console.error(error)
      })
    return () => {
      cancel = true
    }
  }, [])

  useLayoutEffect(() => {
    if (!ready) return
    performance.measure('explorer-first-paint', 'data-loaded')
  }, [ready])

  useEffect(() => {
    if (!ready) return
    let timer = 0
    const unsubscribe = useExplorer.subscribe((state, previous) => {
      if (
        state.hoverId !== previous.hoverId &&
        state.mask === previous.mask &&
        state.selectedId === previous.selectedId
      ) {
        return
      }
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const next = hashFor(useExplorer.getState().snapshot())
        if (window.location.hash !== next) history.replaceState(null, '', next)
      }, 80)
    })
    return () => {
      unsubscribe()
      window.clearTimeout(timer)
    }
  }, [ready])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }
      if (event.key === 'Escape') useExplorer.getState().setSelected(null)
      if (event.key === 'r') useExplorer.getState().clearBrushes()
      if (event.key === 'ArrowRight') useExplorer.getState().cycleSelected(1)
      if (event.key === 'ArrowLeft') useExplorer.getState().cycleSelected(-1)
      if (event.key === ']') useExplorer.getState().cycleColor(1)
      if (event.key === '[') useExplorer.getState().cycleColor(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <Toolbar onHelp={() => setHelpOpen(true)} />
      <Onboarding open={helpOpen} onClose={closeHelp} />
      <HelpButton onOpenGuide={() => setHelpOpen(true)} />
      <RangeFields />
      {ready ? (
        <>
          <ParallelCoordinates />
          <div className="row equal">
            <ScatterPlot />
            <ParetoPlot />
          </div>
          <div className="row">
            <Splom />
            <div className="stack">
              <Histogram />
              <DetailsPanel />
            </div>
          </div>
        </>
      ) : (
        <p className="panel">Loading 10,000 designs…</p>
      )}
    </div>
  )
}
