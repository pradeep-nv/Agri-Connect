import React, { useState, useRef } from 'react';
import Sidebar from '../../components/sidebar/Sidebar';
import Navbar from '../../components/navbar/Navbar';
import newRequest from '../../utils/newRequest';
import './DiseaseDetection.css';

// Severity colour mapping
const SEV = {
  High:   { color: '#dc2626', bg: '#fef2f2', dot: '🔴', label: 'High Risk'   },
  Medium: { color: '#d97706', bg: '#fffbeb', dot: '🟡', label: 'Medium Risk' },
  Low:    { color: '#16a34a', bg: '#f0fdf4', dot: '🟢', label: 'Low Risk'    },
  None:   { color: '#16a34a', bg: '#f0fdf4', dot: '✅', label: 'Healthy'     },
};

export default function DiseaseDetection() {
  const [file,      setFile]      = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan,    setAiPlan]    = useState(null);
  const [baselineLoading, setBaselineLoading] = useState(false);
  const [baselinePlan, setBaselinePlan] = useState(null);
  const [error,     setError]     = useState(null);
  const [dragOver,  setDragOver]  = useState(false);
  const inputRef = useRef(null);

  /* ── Helpers ─────────────────────────────────────────── */
  const selectFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const reset = () => {
    setFile(null); setPreview(null); setResult(null); setError(null); setAiPlan(null); setBaselinePlan(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const analyse = async () => {
    if (!file) { setError('Please upload a mango leaf image first.'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await newRequest.post('/api/disease/detect', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      setAiPlan(null); 
      setBaselinePlan(null); // reset AI plans on new analysis
    } catch (e) {
      setError(e.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAiPlan = async () => {
    if (!result || result.disease === 'Healthy') return;
    setAiLoading(true);
    try {
      const { data } = await newRequest.post('/api/disease-treatment', {
        disease: result.disease,
        confidence: result.confidence
      });
      setAiPlan(data.plan);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to fetch AI Treatment Plan.');
    } finally {
      setAiLoading(false);
    }
  };

  const fetchBaselinePlan = async () => {
    if (!result || result.disease === 'Healthy') return;
    setBaselineLoading(true);
    try {
      const { data } = await newRequest.post('/api/baseline-treatment', {});
      setBaselinePlan(data.plan);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to fetch Baseline AI Plan.');
    } finally {
      setBaselineLoading(false);
    }
  };

  const sev = result ? (SEV[result.severity] || SEV.Medium) : null;

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="dd-wrap">
      <Sidebar />
      <div className="dd-right">
        <Navbar />

        <div className="dd-body">

          {/* ── Page header ── */}
          <header className="dd-header">
            <span className="dd-header-leaf">🌿</span>
            <div>
              <h1 className="dd-h1">Mango Leaf Disease Detection</h1>
              <p className="dd-sub">
                Upload a mango leaf photo — the CNN model identifies the disease
                and provides precautionary measures instantly.
              </p>
            </div>
          </header>

          <div className="dd-grid">

            {/* ══ LEFT: upload panel ══════════════════════════════ */}
            <section className="dd-card dd-upload-panel">
              <h2 className="dd-card-title">📷 Upload Leaf Image</h2>

              {/* Drop-zone */}
              <div
                id="dd-dropzone"
                className={`dd-zone ${dragOver ? 'dd-zone--over' : ''} ${preview ? 'dd-zone--filled' : ''}`}
                onClick={() => !preview && inputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); selectFile(e.dataTransfer.files[0]); }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
              >
                {preview
                  ? <img src={preview} alt="Leaf preview" className="dd-preview" />
                  : (
                    <div className="dd-zone-inner">
                      <div className="dd-zone-icon">🍃</div>
                      <p className="dd-zone-title">Drag & drop your leaf image</p>
                      <p className="dd-zone-hint">or click to browse files</p>
                      <p className="dd-zone-fmt">JPG · PNG · WEBP &nbsp;|&nbsp; Max 10 MB</p>
                    </div>
                  )
                }
              </div>

              <input
                ref={inputRef}
                id="dd-file-input"
                type="file"
                accept="image/*"
                onChange={(e) => selectFile(e.target.files[0])}
                style={{ display: 'none' }}
              />

              {/* Buttons */}
              <div className="dd-btns">
                {preview && (
                  <button id="dd-change-btn" className="dd-btn dd-btn--sec"
                    onClick={() => inputRef.current?.click()}>
                    🔄 Change
                  </button>
                )}
                <button
                  id="dd-analyse-btn"
                  className={`dd-btn dd-btn--primary ${loading ? 'dd-btn--loading' : ''}`}
                  onClick={analyse}
                  disabled={loading || !file}
                >
                  {loading
                    ? <><span className="dd-spin" />Analysing…</>
                    : '🔍 Analyse Leaf'}
                </button>
                {(preview || result) && (
                  <button id="dd-reset-btn" className="dd-btn dd-btn--danger" onClick={reset}>✕</button>
                )}
              </div>

              {/* Error */}
              {error && <div id="dd-error" className="dd-error">⚠️ {error}</div>}

              {/* Tips */}
              <div className="dd-tips">
                <p className="dd-tips-title">📝 Tips for best results</p>
                <ul>
                  <li>📸 Use a clear, well-lit photo of a single leaf</li>
                  <li>🌿 Ensure the full leaf is visible in the frame</li>
                  <li>☀️ Natural daylight gives the best accuracy</li>
                  <li>🔍 Focus on the diseased area for sharper detail</li>
                </ul>
              </div>
            </section>

            {/* ══ RIGHT: results panel ════════════════════════════ */}
            <section className="dd-card dd-result-panel">

              {/* Empty state */}
              {!result && !loading && (
                <div className="dd-empty">
                  <div className="dd-empty-icon">🔬</div>
                  <h3>No Analysis Yet</h3>
                  <p>Upload a mango leaf image and click <strong>Analyse Leaf</strong></p>
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="dd-empty">
                  <div className="dd-pulse">🌿</div>
                  <h3>Analysing your leaf…</h3>
                  <p>CNN model is examining disease patterns in the image</p>
                </div>
              )}

              {/* Results */}
              {result && (
                <div id="dd-results" className="dd-results">

                  {/* Demo badge */}
                  {result.model_mode === 'demo' && (
                    <div className="dd-demo-banner">
                      ⚠️ <strong>Demo Mode</strong> — Place your trained CNN model files in{' '}
                      <code>backend/model/</code> and restart the server for real predictions.
                    </div>
                  )}

                  {/* Disease card */}
                  <div className="dd-disease-card" style={{ borderColor: sev.color }}>

                    <span className="dd-badge" style={{ background: sev.bg, color: sev.color }}>
                      {sev.dot} {sev.label}
                    </span>

                    <h2 id="dd-disease-name" className="dd-disease-name">{result.disease}</h2>
                    <p className="dd-disease-desc">{result.description}</p>

                    {/* Confidence & Latency bar */}
                    <div className="dd-conf">
                      <div className="dd-conf-row">
                        <span>CNN Confidence</span>
                        <span id="dd-confidence" className="dd-conf-val">{result.confidence}%</span>
                      </div>
                      <div className="dd-conf-track">
                        <div
                          className="dd-conf-fill"
                          style={{ width: `${result.confidence}%`, background: sev.color }}
                        />
                      </div>
                      {result.latency_ms > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                          <span>⏱️ Edge Inference Latency:</span>
                          <strong>{result.latency_ms} ms</strong>
                        </div>
                      )}
                    </div>

                    {/* CNN badge */}
                    <div className="dd-cnn-badge">
                      🧠 Powered by MobileNetV2 CNN
                    </div>
                  </div>

                  {/* Precautions */}
                  {result.disease !== 'Healthy' && (
                    <div className="dd-section">
                      <h3 className="dd-section-h">⚠️ Precautionary Measures</h3>
                      <ul className="dd-list">
                        {result.precautions.map((p, i) => (
                          <li key={i}>
                            <span className="dd-num">{i + 1}</span>{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Treatment */}
                  <div className="dd-section">
                    <h3 className="dd-section-h">💊 Treatment Steps</h3>
                    <ul className="dd-list dd-list--treat">
                      {result.treatment.map((t, i) => (
                        <li key={i}><span className="dd-arrow">→</span>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Prevention */}
                  <div className="dd-section">
                    <h3 className="dd-section-h">🛡️ Prevention Tips</h3>
                    <ul className="dd-list dd-list--prev">
                      {result.prevention.map((p, i) => (
                        <li key={i}><span className="dd-check">✓</span>{p}</li>
                      ))}
                    </ul>
                  </div>

                  {/* AI Treatment Plan Button */}
                  {result.disease !== 'Healthy' && (
                    <div className="dd-section" style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '20px', marginTop: '20px' }}>
                      <h3 className="dd-section-h">🔬 Research Ablation Test</h3>
                      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>
                        Compare the ML-grounded AI advice (using the exact CNN diagnosis) against the baseline AI advice (using only a generic farmer complaint).
                      </p>
                      
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {!aiPlan ? (
                          <button 
                            className={`dd-btn dd-btn--primary ${aiLoading ? 'dd-btn--loading' : ''}`}
                            style={{ flex: 1 }}
                            onClick={fetchAiPlan}
                            disabled={aiLoading}
                          >
                            {aiLoading ? <><span className="dd-spin" />Generating…</> : '1. Generate ML-Grounded Plan'}
                          </button>
                        ) : null}

                        {!baselinePlan ? (
                          <button 
                            className={`dd-btn dd-btn--sec ${baselineLoading ? 'dd-btn--loading' : ''}`}
                            style={{ flex: 1 }}
                            onClick={fetchBaselinePlan}
                            disabled={baselineLoading}
                          >
                            {baselineLoading ? <><span className="dd-spin" />Generating…</> : '2. Generate Baseline Plan'}
                          </button>
                        ) : null}
                      </div>

                      {/* Display Results */}
                      <div style={{ display: 'flex', gap: '15px', marginTop: '15px', flexDirection: 'column' }}>
                        {aiPlan && (
                          <div className="dd-ai-plan-result" style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                            <h4 style={{ color: '#16a34a', marginBottom: '10px' }}>✅ ML-Grounded AI Plan (Using CNN Output)</h4>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px' }}>{aiPlan}</p>
                          </div>
                        )}
                        
                        {baselinePlan && (
                          <div className="dd-ai-plan-result" style={{ backgroundColor: '#fef2f2', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #dc2626' }}>
                            <h4 style={{ color: '#dc2626', marginBottom: '10px' }}>❌ Baseline AI Plan (Ungrounded)</h4>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px' }}>{baselinePlan}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* High-severity CTA */}
                  {result.severity === 'High' && (
                    <div className="dd-cta">
                      <span className="dd-cta-icon">👨‍🌾</span>
                      <div className="dd-cta-text">
                        <strong>Severe disease detected!</strong>
                        <p>Consult an agricultural expert for hands-on guidance.</p>
                      </div>
                      <a href="/appointments" id="dd-consult-btn" className="dd-cta-btn">
                        Book Consultation
                      </a>
                    </div>
                  )}

                </div>
              )}
            </section>
          </div>{/* /dd-grid */}
        </div>{/* /dd-body */}
      </div>
    </div>
  );
}
