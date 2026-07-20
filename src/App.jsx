import { useEffect, useRef, useState } from 'react'

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

/* ---------------- clearance form (live) ---------------- */

const INBOX = 'kaizerswilhem@gmail.com'

function ClearanceForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | sending | done | error

  const submit = async () => {
    if (!/.+@.+\..+/.test(email) || state === 'sending') return
    setState('sending')
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${INBOX}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email,
          _subject: 'Clearance request — FILE NO. 0517-A',
          _captcha: 'false',
        }),
      })
      if (!res.ok) throw new Error('bad status')
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <section className="clearance" aria-label="Request clearance">
      <h2>Request clearance</h2>
      <p className="hint">
        Leave an address. When the file is declassified, you hear about it
        before anyone else does.
      </p>
      {state === 'done' ? (
        <p className="received" role="status">
          Application received. We&rsquo;ll find you.
        </p>
      ) : (
        <>
          <div className="clearance-row">
            <input
              type="email"
              value={email}
              placeholder="agent@example.com"
              aria-label="Email address"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <button onClick={submit} disabled={state === 'sending'}>
              {state === 'sending' ? 'Filing\u2026' : 'Submit for review'}
            </button>
          </div>
          {state === 'error' && (
            <p className="form-error" role="alert">
              Transmission failed. Check the address and try again.
            </p>
          )}
        </>
      )}
    </section>
  )
}

/* ---------------- field test (exhibit B) ---------------- */

const RUN_SECONDS = 20
const PASS_SCORE = 12
const TARGET_LIFE_MS = 1100
const SPAWN_EVERY_MS = 620

function FieldTest() {
  const [phase, setPhase] = useState('brief') // brief | running | debrief
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(RUN_SECONDS)
  const [targets, setTargets] = useState([])
  const nextId = useRef(0)

  useEffect(() => {
    if (phase !== 'running') return
    const clock = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhase('debrief')
          return 0
        }
        return t - 1
      })
    }, 1000)
    const spawner = setInterval(() => {
      const id = nextId.current++
      setTargets((ts) => [
        ...ts,
        { id, x: 6 + Math.random() * 84, y: 8 + Math.random() * 78 },
      ])
      setTimeout(
        () => setTargets((ts) => ts.filter((t) => t.id !== id)),
        TARGET_LIFE_MS
      )
    }, SPAWN_EVERY_MS)
    return () => {
      clearInterval(clock)
      clearInterval(spawner)
    }
  }, [phase])

  const start = () => {
    setScore(0)
    setTimeLeft(RUN_SECONDS)
    setTargets([])
    setPhase('running')
  }

  const hit = (id) => {
    setTargets((ts) => ts.filter((t) => t.id !== id))
    setScore((s) => s + 1)
  }

  const passed = score >= PASS_SCORE

  return (
    <section className="fieldtest" aria-label="Field aptitude test">
      <h2>Exhibit B: field aptitude test</h2>
      <p className="hint">
        The file room is bugged. Neutralize every listening device{' '}
        <span className="bug-glyph" aria-hidden="true">◉</span> before it goes
        dark. {PASS_SCORE} confirmed hits in {RUN_SECONDS} seconds earns
        provisional clearance.
      </p>

      <div className="test-meter">
        <span>Hits: {String(score).padStart(2, '0')}</span>
        <span>Clock: 0:{String(timeLeft).padStart(2, '0')}</span>
      </div>

      <div className="playarea" role="application" aria-label="File room sweep">
        {phase === 'brief' && (
          <button className="start-btn" onClick={start}>
            Begin sweep
          </button>
        )}
        {phase === 'running' &&
          targets.map((t) => (
            <button
              key={t.id}
              className="target"
              style={{ left: `${t.x}%`, top: `${t.y}%` }}
              onPointerDown={() => hit(t.id)}
              aria-label="Listening device"
            >
              ◉
            </button>
          ))}
        {phase === 'debrief' && (
          <div className="debrief">
            {passed ? (
              <>
                <div className="mini-stamp">PROVISIONAL CLEARANCE</div>
                <p>
                  {score} devices neutralized. Addendum unsealed below.
                </p>
              </>
            ) : (
              <p>
                {score} of {PASS_SCORE} required. The bugs remain. Application
                to try again: approved.
              </p>
            )}
            <button className="start-btn" onClick={start}>
              Run it back
            </button>
          </div>
        )}
      </div>

      {passed && phase === 'debrief' && (
        <p className="addendum">
          <strong>Addendum (unsealed):</strong> playtests begin before the
          file does not exist anymore. Cleared personnel are drawn from the
          clearance list on the dossier page. You know what to do.
        </p>
      )}
    </section>
  )
}

/* ---------------- app shell with folder tabs ---------------- */

export default function App() {
  const [tab, setTab] = useState('dossier')

  return (
    <div className="folder">
      <nav className="tabs" aria-label="File sections">
        <button
          className={tab === 'dossier' ? 'tab active' : 'tab'}
          onClick={() => setTab('dossier')}
        >
          Dossier
        </button>
        <button
          className={tab === 'test' ? 'tab active' : 'tab'}
          onClick={() => setTab('test')}
        >
          Exhibit B
        </button>
      </nav>

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

        {tab === 'dossier' ? (
          <>
            <h1 className="headline">
              Project <Redacted sealed width={9}>nope</Redacted>
            </h1>
            <p className="subject-line">Subject: what we are building</p>

            <div className="brief">
              <p>
                We are a small team making a{' '}
                <Redacted>competitive game</Redacted> for people who think the
                genre peaked <Redacted>ten years ago</Redacted> and have been
                waiting for someone to prove them wrong.
              </p>
              <p>
                It is not a <Redacted>battle royale</Redacted>. It is not
                another <Redacted>hero shooter</Redacted>. The rest of this
                paragraph is classified, which is exactly how we like it.
              </p>
            </div>

            <dl className="fields">
              <div className="field">
                <dt>Status</dt>
                <dd>Heads down. Building.</dd>
              </div>
              <div className="field">
                <dt>Sector</dt>
                <dd>
                  Games &mdash; the kind you argue about with friends at 2 a.m.
                </dd>
              </div>
              <div className="field">
                <dt>Personnel</dt>
                <dd>
                  <Redacted width={14}>classified</Redacted> humans, several
                  keyboards
                </dd>
              </div>
              <div className="field">
                <dt>Opened</dt>
                <dd>2026</dd>
              </div>
            </dl>

            <ClearanceForm />
          </>
        ) : (
          <FieldTest />
        )}

        <footer className="foot">
          <span>Est. 2026</span>
          <span>If you can read this, you hovered.</span>
        </footer>
      </main>
    </div>
  )
}
