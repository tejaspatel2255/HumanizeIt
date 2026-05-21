import { useState, useEffect } from 'react';
import {
  getWordCount,
  hasAnyApiKey,
  humanizeText,
  scoreText,
} from './lib/ai';

// ============================
// COMPONENTS
// ============================

const HUMANIZE_STAGE_LABELS = {
  paraphrase: '✍️ Pass 1: Deep paraphrasing (new structure & wording)...',
  humanize: '💬 Pass 2: Adding natural human voice & rhythm...',
  polish: '✨ Final polish: removing AI phrases...',
};

function LoadingBar({ durationMs = 22000, isChecking = false, stage = null }) {
  const messages = isChecking ? [
    "🔍 Scanning text patterns...",
    "🛡️ Checking burstiness & AI phrases...",
    "📊 Running style analysis...",
    "✅ Finalizing report..."
  ] : [
    HUMANIZE_STAGE_LABELS.paraphrase,
    HUMANIZE_STAGE_LABELS.humanize,
    HUMANIZE_STAGE_LABELS.polish,
    "✅ Almost done..."
  ];
  const [msgIdx, setMsgIdx] = useState(0);

  const activeMessage = stage && HUMANIZE_STAGE_LABELS[stage]
    ? HUMANIZE_STAGE_LABELS[stage]
    : messages[msgIdx];

  useEffect(() => {
    if (stage) return undefined;
    const interval = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 2000);
    return () => clearInterval(interval);
  }, [messages.length, stage]);

  return (
    <div className="loading-container">
      <div className="loading-message font-heading">{activeMessage}</div>
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ animationDuration: `${durationMs}ms` }} />
      </div>
    </div>
  );
}

function HalfCircleGauge({ score }) {
  const radius = 70;
  const circumference = Math.PI * radius; 
  const [offset, setOffset] = useState(circumference);
  
  useEffect(() => {
    const timer = setTimeout(() => setOffset(circumference * (1 - score / 100)), 100);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  const isAI = score > 50;
  const color = isAI ? 'var(--danger)' : 'var(--accent-cyan)';

  return (
    <div style={{ position: 'relative', width: 160, height: 80, overflow: 'hidden' }}>
      <svg viewBox="0 0 160 80" style={{ width: '100%', height: '200%' }}>
        <path d="M 10 70 A 70 70 0 0 1 150 70" fill="none" stroke="var(--card-bg)" strokeWidth="14" strokeLinecap="round" />
        <path d="M 10 70 A 70 70 0 0 1 150 70" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
        <div className="font-heading" style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 }}>{score}%</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI GPT</div>
      </div>
    </div>
  );
}

// ============================
// MAIN APP COMPONENT
// ============================

export default function App() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [scores, setScores] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeProvider, setActiveProvider] = useState(null);
  const [loadingStage, setLoadingStage] = useState(null);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const inputChars = inputText.length;
  const inputWords = getWordCount(inputText);
  const outputWords = getWordCount(outputText);
  const canSubmit = inputChars >= 50;

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleHumanize = async () => {
    if (!canSubmit) return;
    if (!hasAnyApiKey()) {
      setError('Add VITE_GROQ_API_KEY or VITE_GEMINI_API_KEY to your .env file, then restart the dev server.');
      return;
    }

    setLoading(true);
    setError('');
    setOutputText('');
    setScores(null);
    setActiveProvider(null);
    setLoadingStage('paraphrase');

    try {
      const { text, provider } = await humanizeText(inputText, setLoadingStage);
      setOutputText(text);
      setActiveProvider(provider);
      setScores(await scoreText(text));
    } catch (err) {
      setError(err.message || 'Humanization failed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingStage(null);
    }
  };

  const handleCheckAI = async () => {
    if (!outputText) return;
    if (!hasAnyApiKey()) {
      setError('Add an API key to your .env file to run the detection check.');
      return;
    }

    setCheckLoading(true);
    setError('');
    setScores(null);

    try {
      setScores(await scoreText(outputText));
    } catch (err) {
      setError(err.message || 'Detection check failed.');
    } finally {
      setCheckLoading(false);
    }
  };

  const flaggedCount = scores ? Object.values(scores.detectors).filter(v => v > 35).length : 0;
  const isMostlyHuman = scores && scores.overall_ai_score <= 42;

  return (
    <>
      {/* Background Aurora */}
      <div className="bg-aurora">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>
      <div className="bg-grid"></div>

      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <a href="#" className="nav-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--accent-blue)" />
                  <stop offset="100%" stopColor="var(--accent-cyan)" />
                </linearGradient>
              </defs>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            HumanizeIt
          </a>
          <div className="nav-links font-heading">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <a href="#tool" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Try Free</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" id="tool" style={{ paddingTop: 140 }}>
        <div className="container">
           
           {/* Center Content */}
           <div className="hero-content text-center" style={{ margin: '0 auto', maxWidth: 800 }}>
             <h1 className="font-heading">Humanize AI Text That <span className="text-gradient">Feels Real</span></h1>
             <p style={{ margin: '0 auto 40px' }}>Transform robotic, AI-generated content into natural, undetectable human writing that bypasses Turnitin, GPTZero, and Originality.ai.</p>
             <div className="hero-actions" style={{ justifyContent: 'center' }}>
               <button className="btn btn-primary" onClick={() => document.getElementById('input-area').focus()}>Start Humanizing</button>
               <a href="#features" className="btn btn-secondary">Explore Features</a>
             </div>
             
             <div style={{ marginTop: 40, display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 80 }}>
               <div style={{ display: 'flex' }}>
                 <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-blue)', border: '2px solid var(--bg-base)', zIndex: 3 }}></div>
                 <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-purple)', border: '2px solid var(--bg-base)', marginLeft: -12, zIndex: 2 }}></div>
                 <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-cyan)', border: '2px solid var(--bg-base)', marginLeft: -12, zIndex: 1 }}></div>
               </div>
               <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Trusted by over <strong>10,000+</strong> writers and students.</span>
             </div>
           </div>

           {/* Tool Interface Grid */}
           <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
             
             <div className="tool-grid">
               {/* 1. INPUT PANEL (LEFT) */}
               <div className="glass-card tool-panel" style={{ minHeight: 'auto' }}>
                  {error && (
                    <div style={{ padding: 16, background: 'rgba(255,82,82,0.1)', borderBottom: '1px solid rgba(255,82,82,0.2)' }}>
                      <span style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠️ Error:</span> {error}
                    </div>
                  )}
                  <div className="panel-header">
                    <span style={{ color: 'var(--accent-blue)' }}>●</span> AI Text Input
                  </div>
                  <div className="panel-body">
                    <textarea 
                      id="input-area"
                      className="panel-textarea" 
                      placeholder="Paste your AI-generated text here... (min 50 chars)"
                      style={{ minHeight: '150px' }}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                    />
                    <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inputWords} words | {inputChars} chars</span>
                      <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => { setInputText(''); setOutputText(''); setScores(null); }}>Clear</button>
                    </div>
                  </div>
                  <div style={{ padding: 20, borderTop: '1px solid var(--card-border)' }}>
                    <button className="btn btn-primary" style={{ width: '100%', padding: '16px' }} onClick={handleHumanize} disabled={!canSubmit || loading}>
                      {loading
                        ? (loadingStage === 'paraphrase' ? '⏳ Paraphrasing...'
                          : loadingStage === 'humanize' ? '⏳ Humanizing...'
                          : loadingStage === 'polish' ? '⏳ Polishing...'
                          : '⏳ Processing...')
                        : '✨ Humanize Text'}
                    </button>
                  </div>
               </div>

               {/* 2. OUTPUT PANEL (RIGHT) */}
               <div className="glass-card tool-panel" style={{ minHeight: 'auto' }}>
                 {!outputText && !loading && (
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem', padding: 40, textAlign: 'center' }}>
                     Click "Humanize Text" to see your natural, AI-bypassing output here.
                   </div>
                 )}

                 {loading && (
                   <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                     <LoadingBar durationMs={22000} stage={loadingStage} />
                   </div>
                 )}

                 {outputText && !loading && (
                   <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeInSlideUp 0.5s ease' }}>
                    <div className="panel-header">
                      <span style={{ color: 'var(--success)' }}>●</span> Humanized Output
                    </div>
                    <div className="panel-body">
                      <textarea 
                        className="panel-textarea" 
                        style={{ minHeight: '150px' }}
                        value={outputText} 
                        onChange={e => setOutputText(e.target.value)}
                      />
                      <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {outputWords} words
                          {activeProvider && (
                            <> · via {activeProvider === 'groq' ? 'Groq' : 'Gemini'}</>
                          )}
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={handleCopy}>
                            {copied ? '✅ Copied' : '📋 Copy'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: 20, borderTop: '1px solid var(--card-border)' }}>
                      <button className="btn btn-secondary" style={{ width: '100%', padding: '16px', color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }} onClick={handleCheckAI} disabled={checkLoading}>
                        {checkLoading ? '⏳ Checking...' : '🔍 Re-scan for AI'}
                      </button>
                    </div>
                   </div>
                 )}
               </div>
             </div>

             {/* 3. AI REPORT PANEL (CENTERED BELOW) */}
             {(scores || checkLoading) && (
               <div className="glass-card tool-panel" style={{ minHeight: 'auto', marginTop: 24, maxWidth: 800, margin: '24px auto 0', animation: 'fadeInSlideUp 0.5s ease' }}>
                 {checkLoading ? (
                   <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <LoadingBar durationMs={8000} isChecking={true} />
                   </div>
                 ) : (
                   <>
                    <div className="panel-header" style={{ justifyContent: 'space-between' }}>
                      <div><span style={{ color: 'var(--warning)' }}>●</span> AI Detection Report</div>
                      <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '0.8rem' }} onClick={() => setScores(null)}>✕ Close</button>
                    </div>
                    <div className="panel-body" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 32 }}>
                        <span style={{ fontSize: '2rem' }}>{isMostlyHuman ? '✅' : '⚠️'}</span>
                        <div>
                          <h3 className="font-heading" style={{ color: isMostlyHuman ? 'var(--success)' : 'var(--warning)', margin: 0 }}>
                            {scores.verdict}
                          </h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                            {flaggedCount} of 8 pattern checks flagged · burstiness &amp; AI-phrase scan
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
                        <HalfCircleGauge score={scores.overall_ai_score} />
                      </div>
                      
                      <div className="font-heading" style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Cross-checked with:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {Object.entries(scores.detectors).map(([name, score]) => (
                          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                            <span>{score <= 30 ? '✅' : '❌'}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                   </>
                 )}
               </div>
             )}
           </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section style={{ padding: '40px 0', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
        <div className="container">
          <p className="text-center font-heading" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 32 }}>Trusted by leading content teams & universities</p>
          <div className="logos-container">
            {/* Minimal SVG placeholders for logos */}
            <svg viewBox="0 0 100 30"><text x="10" y="22" fontFamily="sans-serif" fontSize="20" fontWeight="bold">Acme Corp</text></svg>
            <svg viewBox="0 0 100 30"><text x="10" y="22" fontFamily="serif" fontSize="20" fontWeight="bold">Nexus</text></svg>
            <svg viewBox="0 0 100 30"><text x="10" y="22" fontFamily="sans-serif" fontSize="20" fontWeight="bold">Horizon</text></svg>
            <svg viewBox="0 0 100 30"><text x="10" y="22" fontFamily="monospace" fontSize="20" fontWeight="bold">QUANTUM</text></svg>
            <svg viewBox="0 0 100 30"><text x="10" y="22" fontFamily="sans-serif" fontSize="20" fontWeight="bold">Astra</text></svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features">
        <div className="container">
          <h2 className="section-title font-heading">Why Choose <span className="text-gradient">HumanizeIt</span></h2>
          <p className="section-subtitle">Everything you need to create undetectable, high-quality human-like text at scale.</p>
          
          <div className="features-grid">
            {[
              { title: "AI Detection Bypass", desc: "Easily bypass Turnitin, Originality.ai, GPTZero, and 5+ other major detectors with our advanced rewriting engine.", icon: "🛡️" },
              { title: "Plagiarism-Free", desc: "Our engine doesn't just spin text; it reconstructs ideas from scratch ensuring 100% original, plagiarism-free output.", icon: "✍️" },
              { title: "SEO Optimized", desc: "Maintains keyword density and natural flow so your content ranks high on Google without being penalized for AI.", icon: "📈" },
              { title: "Flawless Grammar", desc: "Produces grammatically perfect output that reads naturally, free of the awkward phrasing common to AI writers.", icon: "✅" },
              { title: "Lightning Fast", desc: "Process thousands of words in seconds. Powered by Groq's high-speed inference and Gemini 2.0.", icon: "⚡" },
              { title: "Multiple Languages", desc: "Seamlessly humanize text in English, Spanish, French, German, and 20+ other supported languages.", icon: "🌍" },
            ].map((f, i) => (
              <div key={i} className="glass-card feature-card">
                <div className="feature-icon" style={{ fontSize: '1.5rem' }}>{f.icon}</div>
                <h3 className="font-heading">{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
        <div className="container">
          <h2 className="section-title font-heading">How It Works</h2>
          <p className="section-subtitle">Three simple steps to perfect, human-like content.</p>
          
          <div className="steps-container">
            <div className="step">
              <div className="step-number font-heading">1</div>
              <h3 className="font-heading">Paste your AI Text</h3>
              <p>Copy text generated by ChatGPT, Claude, or Jasper and paste it directly into our secure tool.</p>
            </div>
            <div className="step">
              <div className="step-number font-heading">2</div>
              <h3 className="font-heading">Humanize It</h3>
              <p>Our two-pass engine deep-paraphrases then adds a natural human voice so detectors see real writing patterns.</p>
            </div>
            <div className="step">
              <div className="step-number font-heading">3</div>
              <h3 className="font-heading">Export & Check</h3>
              <p>Run the built-in detection scan to ensure it passes Turnitin & GPTZero, then copy your text.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing">
        <div className="container">
          <h2 className="section-title font-heading">Simple, Transparent Pricing</h2>
          <p className="section-subtitle">Choose the perfect plan for your writing needs. Cancel anytime.</p>

          <div className="pricing-grid">
            {/* Basic */}
            <div className="glass-card pricing-card">
              <h3 className="font-heading">Starter</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Perfect for occasional use.</p>
              <div className="price">$9<span>/mo</span></div>
              <button className="btn btn-secondary" style={{ width: '100%' }}>Get Started</button>
              <ul className="features-list">
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> 10,000 words/month</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> Standard processing speed</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> Basic detection scan</li>
              </ul>
            </div>

            {/* Pro */}
            <div className="glass-card pricing-card featured">
              <h3 className="font-heading text-gradient">Pro</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>For power users and content teams.</p>
              <div className="price">$29<span>/mo</span></div>
              <button className="btn btn-primary" style={{ width: '100%' }}>Get Started</button>
              <ul className="features-list">
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> 100,000 words/month</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> Lightning fast processing</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> Advanced 8-detector scan</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> API Access</li>
              </ul>
            </div>

            {/* Elite */}
            <div className="glass-card pricing-card">
              <h3 className="font-heading">Enterprise</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Unlimited power for agencies.</p>
              <div className="price">$99<span>/mo</span></div>
              <button className="btn btn-secondary" style={{ width: '100%' }}>Contact Sales</button>
              <ul className="features-list">
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> Unlimited words</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> Dedicated support</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> Custom integrations</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
        <div className="container">
          <h2 className="section-title font-heading">Loved by Writers</h2>
          <div className="testimonials-grid">
            <div className="glass-card testimonial-card">
              <div className="testimonial-header">
                <div className="avatar"></div>
                <div>
                  <div className="font-heading" style={{ fontWeight: 600 }}>Sarah Jenkins</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Content Marketer</div>
                </div>
              </div>
              <p className="testimonial-text">"This tool is absolutely incredible. It perfectly rewrites my ChatGPT drafts so they flow naturally. It bypasses Originality.ai every single time."</p>
            </div>
            <div className="glass-card testimonial-card">
              <div className="testimonial-header">
                <div className="avatar"></div>
                <div>
                  <div className="font-heading" style={{ fontWeight: 600 }}>David Chen</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Freelance Writer</div>
                </div>
              </div>
              <p className="testimonial-text">"The UI is gorgeous and the results are unmatched. I've tried other humanizers but they all sound robotic. HumanizeIt actually sounds like me."</p>
            </div>
            <div className="glass-card testimonial-card">
              <div className="testimonial-header">
                <div className="avatar"></div>
                <div>
                  <div className="font-heading" style={{ fontWeight: 600 }}>Emily R.</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>University Student</div>
                </div>
              </div>
              <p className="testimonial-text">"A lifesaver for essay outlines. I use AI to brainstorm, but this tool helps me rewrite the ideas so it passes Turnitin flawlessly. Worth every penny."</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="container faq-container">
          <h2 className="section-title font-heading">Frequently Asked Questions</h2>
          <div className="glass-card" style={{ padding: '0 32px' }}>
            <div className="faq-item">
              <div className="faq-question">Does this really bypass Turnitin? <span>+</span></div>
              <div className="faq-answer">Yes, our advanced rewriting engine injects human-like imperfections, burstiness, and variable sentence structures that consistently bypass Turnitin, GPTZero, and Originality.ai.</div>
            </div>
            <div className="faq-item">
              <div className="faq-question">Is the output plagiarism-free? <span>+</span></div>
              <div className="faq-answer">Absolutely. We do not just spin words. Our models completely reconstruct sentences and paragraphs, ensuring your final text is 100% original and free from plagiarism flags.</div>
            </div>
            <div className="faq-item" style={{ borderBottom: 'none' }}>
              <div className="faq-question">What languages are supported? <span>+</span></div>
              <div className="faq-answer">Currently, we fully support English, Spanish, French, German, and Portuguese. Our team is rapidly adding support for more languages.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="font-heading text-gradient" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>HumanizeIt</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 250 }}>The world's most advanced AI text humanizer. Turn robotic content into authentic human writing instantly.</p>
            </div>
            <div>
              <h4 className="font-heading">Product</h4>
              <ul>
                <li><a href="#">Features</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">API Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading">Resources</h4>
              <ul>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">AI Detectors List</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading">Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div>&copy; 2026 HumanizeIt Inc. All rights reserved.</div>
            <div>Powered by Groq & Google Gemini</div>
          </div>
        </div>
      </footer>
    </>
  );
}
