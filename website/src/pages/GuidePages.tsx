import { useState } from 'react';
import { guides, type Guide } from '../content/guides';
import type { Usecase } from '../content/usecases';
import './guides.css';

function FileArtwork({ family }: { family: string }) {
  return <svg viewBox="0 0 240 150" aria-hidden="true" className={`guide-file-art art-${family}`}>
    {family === 'images' ? <><rect x="18" y="14" width="204" height="122" rx="10" className="art-photo"/><circle cx="172" cy="48" r="17" className="art-sun"/><path d="m20 117 53-57 51 53 35-36 62 58H20Z" className="art-hill"/><path d="m20 132 55-30 54 34H20Z" className="art-foreground"/></> : family === 'video' ? <><rect x="15" y="15" width="210" height="90" rx="9" className="art-photo"/><path d="m106 38 38 23-38 23Z" className="art-foreground"/><rect x="15" y="121" width="210" height="13" rx="4" className="art-track"/><rect x="65" y="117" width="106" height="21" rx="4" className="art-selection"/><path d="M66 113v29m105-29v29" className="art-line"/></> : family === 'spreadsheets' ? <><rect x="20" y="10" width="200" height="130" rx="8" className="art-sheet"/><path d="M20 36h200M20 62h200M20 88h200M20 114h200M70 36v104M120 36v104M170 36v104" className="art-grid"/><rect x="21" y="11" width="198" height="24" rx="5" className="art-table-head"/><path d="M35 23h20m30 0h20m30 0h20m30 0h20" className="art-line"/></> : family === 'subtitles' ? <><rect x="20" y="12" width="200" height="126" rx="9" className="art-sheet"/><text x="36" y="39">00:01 → 00:04</text><path d="M36 55h163M36 65h136M36 105h163M36 115h111" className="art-grid"/><text x="36" y="90">00:05 → 00:08</text></> : family === 'archives' ? <><rect x="36" y="43" width="168" height="95" rx="9" className="art-photo"/><path d="M36 65h168M104 44v94m23-94v94" className="art-grid"/><rect x="101" y="68" width="30" height="27" rx="4" className="art-foreground"/><path d="M79 35V15h82v20" className="art-selection"/></> : <><rect x="50" y="8" width="140" height="134" rx="7" className="art-sheet"/><text x="69" y="37"># Your words</text><path d="M69 56h101M69 70h83M69 84h101M69 98h94M69 112h62" className="art-grid"/></>}
  </svg>;
}

export function GuideExample({ guide }: { guide: Guide }) {
  const [paused, setPaused] = useState(false);
  return <figure className={`guide-example ${paused ? 'is-paused' : ''}`}>
    <div className="guide-example-top"><span>THE EXAMPLE / ON YOUR DEVICE</span><button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused}>{paused ? 'Resume motion' : 'Pause motion'}</button></div>
    <div className="guide-example-scene">
      <div className="guide-example-source"><FileArtwork family={guide.family}/><span className="guide-file-label">ORIGINAL</span><strong>{guide.source}</strong><small>Stays in place</small></div>
      <div className="guide-example-operation"><span className="guide-operation-orbit" aria-hidden="true">↗</span><span>{guide.operation}</span><span className="guide-operation-line" aria-hidden="true"/></div>
      <div className="guide-example-outputs"><span className="guide-file-label">NEW OUTPUT{guide.outputs.length > 1 ? 'S' : ''}</span>{guide.outputs.map((output, index) => <div className="guide-output-file" key={output} style={{ animationDelay: `${index * 180}ms` }}><span aria-hidden="true">↳</span><strong>{output}</strong></div>)}</div>
    </div>
    <figcaption>Illustrative workflow. Filenames are examples; this page does not process files.</figcaption>
  </figure>;
}

export function GuideIndex() {
  return <main className="guide-index guide-shell">
    <div className="guide-index-heading"><p className="guide-eyebrow">SMALL FILE PROBLEMS. REAL ANSWERS.</p><h1>Your files have<br/>places to be.<br/><em>Get them there.</em></h1><p>No twenty-tab detour. Pick the problem, follow the steps, and save a new copy on your own computer.</p><span className="guide-platforms">Windows x64 & Linux x64 · Local desktop workflows</span></div>
    <section className="guide-directory" aria-label="Practical Santra guides">
      {guides.map((guide, index) => <a className="guide-directory-row" href={`/guides/${guide.slug}`} key={guide.slug}>
        <span className="guide-directory-number">{String(index + 1).padStart(2, '0')}</span><div><span className="guide-eyebrow">{guide.category}</span><h2>{guide.headline}</h2><p>{guide.description}</p></div><span className="guide-directory-arrow" aria-hidden="true">↗</span>
      </a>)}
    </section>
    <div className="guide-index-foot"><p>Looking for a format first? See the supported routes and their limitations.</p><a href="/tools">Explore the tools <span aria-hidden="true">→</span></a></div>
  </main>;
}

export function GuideArticle({ guide, usecase = false }: { guide: Guide; usecase?: boolean }) {
  const related = guide.related.map(slug => guides.find(item => item.slug === slug)).filter((item): item is Guide => Boolean(item));
  return <main className="guide-article guide-shell">
    <nav className="guide-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href={usecase ? "/usecase" : "/guides"}>{usecase ? "Use cases" : "Guides"}</a><span aria-hidden="true">/</span><span>{guide.category}</span></nav>
    <header className="guide-article-header"><p className="guide-eyebrow">{guide.category} / {usecase ? "A REAL FILE WORKFLOW" : "A PRACTICAL GUIDE"}</p><h1>{guide.headline}</h1><p className="guide-pain">{guide.pain}</p><p className="guide-platforms">Windows x64 & Linux x64 · Desktop preview · Originals preserved by default</p></header>
    <GuideExample key={guide.slug} guide={guide}/>
    <div className="guide-reading-layout">
      <aside className="guide-contents" aria-label="On this page"><span className="guide-eyebrow">GET TO THE FIX</span><a href="#quick-answer">The short answer</a><a href="#steps">Do it step by step</a><a href="#limits">Check the limits</a>{guide.faq.length > 0 && <a href="#questions">Common questions</a>}<a href="/install" className="guide-contents-install">Get Santra <span aria-hidden="true">↗</span></a></aside>
      <article className="guide-reading">
        <section id="quick-answer" className="guide-answer"><p className="guide-eyebrow">THE SHORT ANSWER</p><h2>{guide.title}</h2><p>{guide.answer}</p></section>
        <section id="steps" className="guide-steps"><p className="guide-eyebrow">FROM FILE TO FINISHED</p><h2>Here’s the way through.</h2><ol>{guide.steps.map((step, index) => <li key={step.title}><span className="guide-step-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol></section>
        <section id="limits" className="guide-limits"><p className="guide-eyebrow">BEFORE YOU HIT SAVE</p><h2>Know what changes.</h2><ul>{guide.limits.map(limit => <li key={limit}>{limit}</li>)}</ul><a href={`/tools?family=${guide.family}`}>Check this family’s tools <span aria-hidden="true">→</span></a></section>
        {guide.faq.length > 0 && <section id="questions" className="guide-faq"><p className="guide-eyebrow">THE NEXT QUESTIONS</p><h2>A few things worth clearing up.</h2>{guide.faq.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</section>}
      </article>
    </div>
    {related.length > 0 && <section className="guide-related"><div><p className="guide-eyebrow">NEXT FILE, NEXT FIX</p><h2>Keep moving.</h2></div><div>{related.map(item => <a href={`/guides/${item.slug}`} key={item.slug}><span>{item.category}</span><strong>{item.title}</strong><span aria-hidden="true">↗</span></a>)}</div></section>}
    <section className="guide-closing"><div><p className="guide-eyebrow">TAKE THE SHORTER ROUTE</p><h2>Keep the file.<br/><em>Lose the friction.</em></h2><p>These workflows run in Santra desktop. Optional routes appear when a compatible local engine is detected.</p></div><a href="/install" className="guide-button">Get Santra for your computer <span aria-hidden="true">↗</span></a></section>
  </main>;
}

export function UsecaseArticle({ usecase }: { usecase: Usecase }) {
  const guide: Guide = {
    slug: usecase.slug, title: usecase.title, headline: usecase.pain,
    description: usecase.description, category: 'Use case', family: usecase.family,
    operation: usecase.operation, pain: usecase.description, answer: usecase.answer,
    source: usecase.source, outputs: usecase.outputs, steps: usecase.steps,
    limits: usecase.limits, faq: [], related: usecase.guides,
  };
  return <GuideArticle guide={guide} usecase/>;
}
