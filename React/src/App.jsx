// App.jsx
import { useState, memo } from 'react'
import Aurora from './components/backgrounds/Aurora.jsx'
import './App.css'

const AlgoButton = memo(function AlgoButton({ id, label, selected, onSelect }) {
  return (
    <button
      id={id}
      className={selected ? 'algo-btn selected' : 'algo-btn'}
      onClick={() => onSelect(id)}
    >
      {label}
    </button>
  )
})

const Algorithms = memo(function Algorithms({ algo, setAlgo }) {
  return (
    <div className="algorithms-box">
      <h1 style={{textAlign:'center', fontFamily:'Akira', fontSize:'50px', color:'white'}}>Algorithms</h1>
      <div className='algos-row'>
        <AlgoButton id="mnb" label="Multinomial Naive Bayes" selected={algo==='mnb'} onSelect={setAlgo} />
        <AlgoButton id="svm" label="Support Vector Machine"   selected={algo==='svm'} onSelect={setAlgo} />
        <AlgoButton id="rf"  label="Random Forest"            selected={algo==='rf'}  onSelect={setAlgo} />
        <AlgoButton id="lr"  label="Logistic Regression"      selected={algo==='lr'}  onSelect={setAlgo} />
      </div>
    </div>
  )
})

const TextSpace = memo(function TextSpace({ text, setText, loading, algo, result, onClassify }) {
  return (
    <div className='window-box'>
      <div className="text-block">
        <input
          type="text"
          className="text-input"
          placeholder="Enter your text here..."
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div>
        <button
          className="analyze-button"
          onClick={onClassify}
          disabled={!algo || !text.trim() || loading}
        >
          {loading ? 'classifying…' : 'classify'}
        </button>
      </div>
      {result && (
        <div className="result">
          {result.error ? (
            <p className="error">Error: {result.error}</p>
          ) : (
            <>
              <p><b>Algorithm:</b> {result.algo.toUpperCase()}</p>
              <p><b>Prediction:</b> {result.label}</p>
              {typeof result.score === 'number' && (
                <p><b>Confidence:</b> {(result.score * 100).toFixed(1)}%</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
})

export default function App() {
  const [algo, setAlgo] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const apiBase = 'http://localhost:8000'

  const handleClassify = async () => {
    if (!algo || !text.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`${apiBase}/api/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, algo })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Request failed')
      }
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="aurora-container">
        <Aurora colorStops={["#3A29FF", "#BF92A4", "#FF3232"]} blend={0.5} amplitude={1.3} speed={0.5} />
      </div>
      <div className="app-container">
        <Algorithms algo={algo} setAlgo={setAlgo} />
        <TextSpace
          text={text}
          setText={setText}
          loading={loading}
          algo={algo}
          result={result}
          onClassify={handleClassify}
        />
      </div>
    </>
  )
}
