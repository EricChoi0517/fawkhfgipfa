import { useRef, useState } from 'react'

const GLYPHS = '#%&@$!?/\\<>0123456789ABCDEFXKZ'

/**
 * A redacted span. Hover (or keyboard-focus) de-scrambles it into the
 * real text. `sealed` redactions never give anything up.
 */
function Redacted({ children, sealed = false, width = null }) {
  const real = String(children)
  const blank = '\u2588'.repeat(width ?? Math.max(4, real.length))
  const [shown, setShown] = useState(blank)
  const timer = useRef(null)

  const scrambleTo = (target) => {
    clearInterval(timer.current)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(target)
      return
    }
    let tick = 0
    timer.current = setInterval(() => {
      tick += 1
      const settled = Math.floor((tick / 10) * target.length)
      setShown(
        target
          .split('')
          .map((ch, i) =>
            i < settled || ch === ' '
              ? ch
              : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          )
          .join('')
      )
      if (settled >= target.length) clearInterval(timer.current)
    }, 32)
  }

  const reveal = () => !sealed && scrambleTo(real)
  const conceal = () => {
    clearInterval(timer.current)
    setShown(blank)
  }

  return (
    <span
      className={sealed ? 'redacted sealed' : 'redacted'}
      tabIndex={0}
      role="button"
      aria-label={sealed ? 'Redacted. Nice try.' : `Redacted, reveals: ${real}`}
      title={sealed ? 'Nice try.' : undefined}
      onMouseEnter={reveal}
      onMouseLeave={conceal}
      onFocus={reveal}
      onBlur={conceal}
    >
      {sealed ? blank : shown}
    </span>
  )
}

function ClearanceForm() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const submit = () => {
    if (!/.+@.+\..+/.test(email)) return
    setDone(true)
  }

  return (
    <section className="clearance" aria-label="Request clearance">
      <h2>Request clearance</h2>
      <p className="hint">
        Leave an address. When the file is declassified, you hear about it
        before anyone else does.
      </p>
      {done ? (
        <p className="received" role="status">
          Application received. We&rsquo;ll find you.
        </p>
      ) : (
        <div className="clearance-row">
          <input
            type="email"
            value={email}
            placeholder="agent@example.com"
            aria-label="Email address"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <button onClick={submit}>Submit for review</button>
        </div>
      )}
    </section>
  )
}

export default function App() {
  return (
    <main className="sheet">
      <header>
        <div className="file-header">
          <span>File no. 0517&#8209;A</span>
          <span className="warn">Internal &mdash; do not distribute</span>
        </div>
        <div className="file-sub">
          <span>Origin: a game studio</span>
          <span>Copies: 1 of 1</span>
        </div>
      </header>

      <div className="stamp" aria-hidden="true">
        CLASSIFIED
      </div>

      <h1 className="headline">
        Project <Redacted sealed width={9}>nope</Redacted>
      </h1>
      <p className="subject-line">Subject: what we are building</p>

      <div className="brief">
        <p>
          We are a small team making a <Redacted>competitive game</Redacted>{' '}
          for people who think the genre peaked{' '}
          <Redacted>ten years ago</Redacted> and have been waiting for someone
          to prove them wrong.
        </p>
        <p>
          It is not a <Redacted>battle royale</Redacted>. It is not another{' '}
          <Redacted>hero shooter</Redacted>. The rest of this paragraph is
          classified, which is exactly how we like it.
        </p>
      </div>

      <dl className="fields">
        <div className="field">
          <dt>Status</dt>
          <dd>Heads down. Building.</dd>
        </div>
        <div className="field">
          <dt>Sector</dt>
          <dd>Games &mdash; the kind you argue about with friends at 2 a.m.</dd>
        </div>
        <div className="field">
          <dt>Personnel</dt>
          <dd>
            <Redacted width={14}>classified</Redacted> humans, several keyboards
          </dd>
        </div>
        <div className="field">
          <dt>Opened</dt>
          <dd>2026</dd>
        </div>
      </dl>

      <ClearanceForm />

      <footer className="foot">
        <span>Est. 2026</span>
        <span>If you can read this, you hovered.</span>
      </footer>
    </main>
  )
}
