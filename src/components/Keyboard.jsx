import { useCallback, useEffect, useRef, useState } from 'react';
import './Keyboard.css';

const rows = [
  [
    { key: '`', shift: '~' }, { key: '1', shift: '!' },
    { key: '2', shift: '@' }, { key: '3', shift: '#' },
    { key: '4', shift: '$' }, { key: '5', shift: '%' },
    { key: '6', shift: '^' }, { key: '7', shift: '&' },
    { key: '8', shift: '*' }, { key: '9', shift: '(' },
    { key: '0', shift: ')' }, { key: '-', shift: '_' },
    { key: '=', shift: '+' }, { key: 'Backspace', width: 'backspace' },
  ],
  [
    { key: 'Tab', width: 'tab' },
    ...'qwertyuiop'.split('').map(key => ({ key, shift: key.toUpperCase() })),
    { key: '[', shift: '{' }, { key: ']', shift: '}' },
    { key: '\\', shift: '|' },
  ],
  [
    { key: 'Caps Lock', width: 'caps' },
    ...'asdfghjkl'.split('').map(key => ({ key, shift: key.toUpperCase() })),
    { key: ';', shift: ':' }, { key: "'", shift: '"' },
    { key: 'Enter', width: 'enter' },
  ],
  [
    { key: 'Shift', width: 'shift' },
    ...'zxcvbnm'.split('').map(key => ({ key, shift: key.toUpperCase() })),
    { key: ',', shift: '<' }, { key: '.', shift: '>' },
    { key: '/', shift: '?' }, { key: 'Shift', width: 'shift' },
  ],
  [
    { key: 'Ctrl', width: 'modifier' }, { key: 'Alt', width: 'modifier' },
    { key: ' ', width: 'space', label: 'SPACE' },
    { key: 'Ctrl', width: 'modifier' }, { key: 'Alt', width: 'modifier' },
    { key: 'ArrowLeft', label: '←', width: 'arrow' },
    { key: 'ArrowRight', label: '→', width: 'arrow' },
  ],
];

const layouts = {
  English: {},
  Hindi: {
    q: 'ौ', w: 'ै', e: 'ा', r: 'ी', t: 'ू', y: 'ब', u: 'ह', i: 'ग', o: 'द', p: 'ज',
    a: 'ो', s: 'े', d: '्', f: 'ि', g: 'ु', h: 'प', j: 'र', k: 'क', l: 'त',
    z: '्र', x: 'ं', c: 'म', v: 'न', b: 'व', n: 'ल', m: 'स',
  },
  Arabic: {
    q: 'ض', w: 'ص', e: 'ث', r: 'ق', t: 'ف', y: 'غ', u: 'ع', i: 'ه', o: 'خ', p: 'ح',
    a: 'ش', s: 'س', d: 'ي', f: 'ب', g: 'ل', h: 'ا', j: 'ت', k: 'ن', l: 'م',
    z: 'ئ', x: 'ء', c: 'ؤ', v: 'ر', b: 'لا', n: 'ى', m: 'ة',
  },
};

const testText =
  'The quick brown fox jumps over the lazy dog. Practice makes progress every day.';

const LEADERBOARD_KEY = 'keyspace-typing-leaderboard';

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function Keyboard() {
  const [text, setText] = useState('');
  const [shift, setShift] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [pressedKeys, setPressedKeys] = useState([]);
  const [soundOn, setSoundOn] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('English');
  const [copied, setCopied] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [testFinished, setTestFinished] = useState(false);
  const [testDuration, setTestDuration] = useState(60);
  const [leaderboard, setLeaderboard] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(LEADERBOARD_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const resultSavedRef = useRef(false);

  const inputRef = useRef(null);
  const startedAtRef = useRef(null);
  const audioRef = useRef(null);
  const testRunningRef = useRef(false);

  const playSound = useCallback(() => {
    if (!soundOn) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const context = audioRef.current || new AudioContextClass();
      audioRef.current = context;
      if (context.state === 'suspended') context.resume();

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 620;
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.045);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.045);
    } catch {
      // Sound is optional.
    }
  }, [soundOn]);

  const startTest = () => {
    if (testRunningRef.current) return;
    setText('');
    setSecondsLeft(testDuration);
    setTestFinished(false);
    resultSavedRef.current = false;
    startedAtRef.current = Date.now();
    testRunningRef.current = true;
    setTestRunning(true);
    inputRef.current?.focus();
  };

  const resetTest = () => {
    testRunningRef.current = false;
    setTestRunning(false);
    setTestFinished(false);
    setSecondsLeft(testDuration);
    startedAtRef.current = null;
    resultSavedRef.current = false;
    setText('');
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (!testRunning) return undefined;

    const timer = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const remaining = Math.max(0, testDuration - elapsedSeconds);
      setSecondsLeft(remaining);

      if (remaining === 0) {
        testRunningRef.current = false;
        setTestRunning(false);
        setTestFinished(true);
      }
    }, 200);

    return () => window.clearInterval(timer);
  }, [testRunning, testDuration]);

  useEffect(() => {
    const down = event => {
      if (event.key === 'Shift') setShift(true);
      if (event.key === 'CapsLock') setCapsLock(event.getModifierState('CapsLock'));
      setPressedKeys(current =>
        current.includes(event.key) ? current : [...current, event.key]
      );
    };

    const up = event => {
      if (event.key === 'Shift') setShift(false);
      setPressedKeys(current => current.filter(key => key !== event.key));
    };

    const clear = () => setPressedKeys([]);

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.close();
    };
  }, []);

  const insertText = useCallback((value) => {
    if (testFinished) return;

    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const updated = text.slice(0, start) + value + text.slice(end);
    setText(updated);

    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + value.length, start + value.length);
    });
  }, [text, testFinished]);

  const handleKey = item => {
    const key = item.key;
    const input = inputRef.current;

    if (key === 'Shift') {
      setShift(value => !value);
      input?.focus();
      return;
    }

    if (key === 'Caps Lock') {
      setCapsLock(value => !value);
      input?.focus();
      return;
    }

    if (key === 'Ctrl' || key === 'Alt') {
      input?.focus();
      return;
    }

    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      if (!input) return;
      const position = input.selectionStart;
      const next = key === 'ArrowLeft'
        ? Math.max(0, position - 1)
        : Math.min(text.length, position + 1);
      input.focus();
      input.setSelectionRange(next, next);
      return;
    }

    if (key === 'Backspace') {
      if (!input || testFinished) return;
      const start = input.selectionStart;
      const end = input.selectionEnd;

      if (start === end && start > 0) {
        setText(text.slice(0, start - 1) + text.slice(end));
        requestAnimationFrame(() => {
          input.focus();
          input.setSelectionRange(start - 1, start - 1);
        });
      } else if (start !== end) {
        setText(text.slice(0, start) + text.slice(end));
        requestAnimationFrame(() => {
          input.focus();
          input.setSelectionRange(start, start);
        });
      }
      playSound();
      setShift(false);
      return;
    }

    if (key === 'Enter' || key === 'Tab' || key === ' ') {
      insertText(key === 'Enter' ? '\n' : key === 'Tab' ? '\t' : ' ');
      playSound();
      setShift(false);
      return;
    }

    let value = item.key;
    if (language !== 'English' && layouts[language][key]) {
      value = layouts[language][key];
    } else if (shift && item.shift) {
      value = item.shift;
    }

    if (/^[a-z]$/i.test(key) && language === 'English') {
      value = capsLock !== shift ? key.toUpperCase() : key.toLowerCase();
    }

    insertText(value);
    playSound();
    setShift(false);
  };

  const handlePhysicalKeyDown = event => {
    if (event.key.length === 1 || event.key === 'Backspace') {
      playSound();
    }
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const correctChars = [...text].reduce((total, char, index) => total + (char === testText[index] ? 1 : 0), 0);
  const accuracy = text.length ? Math.round((correctChars / text.length) * 100) : 100;
  const elapsed = startedAtRef.current
    ? Math.max(0.1, Math.min(testDuration, (Date.now() - startedAtRef.current) / 1000))
    : 0;
  const wpm = elapsed > 0 ? Math.round((correctChars / 5) / (elapsed / 60)) : 0;

  useEffect(() => {
    try {
      window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    } catch {
      // Leaderboard remains usable for the current session if storage is unavailable.
    }
  }, [leaderboard]);

  useEffect(() => {
    if (!testFinished || resultSavedRef.current) return;
    resultSavedRef.current = true;
    const result = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      wpm,
      accuracy,
      correctChars,
      characters: text.length,
      duration: testDuration,
      date: new Date().toLocaleDateString(),
    };
    setLeaderboard(current => [...current, result]
      .sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy)
      .slice(0, 10));
  }, [testFinished]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      inputRef.current?.focus();
      inputRef.current?.select();
      setCopied(false);
    }
  };

  const getLabel = item => {
    if (item.key === ' ') return item.label || '';
    if (item.key === 'Backspace') return '⌫';
    if (item.key === 'ArrowLeft' || item.key === 'ArrowRight') return item.label;
    if (item.key === 'Shift') return 'Shift';
    if (item.key === 'Caps Lock') return 'Caps Lock';
    if (item.key === 'Enter') return 'Enter';
    if (item.key === 'Tab') return 'Tab';
    if (language !== 'English' && layouts[language][item.key]) return layouts[language][item.key];
    return item.key;
  };

  const isPressed = item =>
    pressedKeys.includes(item.key) ||
    (item.key.length === 1 &&
      pressedKeys.some(key => key.length === 1 && key.toLowerCase() === item.key.toLowerCase()));

  return (
    <main className={`keyboard theme-${theme}`}>
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">⌨</div>
          <div>
            <h1>KeySpace</h1>
            <p>Your personal typing studio</p>
          </div>
        </div>

        <div className="header-controls">
          <label className="select-control">
            <span>Language</span>
            <select value={language} onChange={event => setLanguage(event.target.value)}>
              {Object.keys(layouts).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>

          <label className="select-control">
            <span>Theme</span>
            <select value={theme} onChange={event => setTheme(event.target.value)}>
              <option value="dark">Midnight</option>
              <option value="light">Light</option>
              <option value="neon">Neon</option>
            </select>
          </label>

          <button
            type="button"
            className={`tool-button ${soundOn ? 'selected' : ''}`}
            onClick={() => setSoundOn(value => !value)}
          >
            {soundOn ? '♪ Sound on' : '♫ Sound off'}
          </button>
        </div>
      </header>

      <section className="workspace">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LIVE EDITOR</span>
            <h2>Start typing something<span className="accent-dot">.</span></h2>
            <p>Use your physical keyboard or click the keys below.</p>
          </div>
          <span className="live-status"><span /> Ready to type</span>
        </div>

        <div className="editor-card">
          <div className="editor-topbar">
            <div className="window-dots"><i /><i /><i /></div>
            <span>untitled.txt</span>
            <div className="editor-actions">
              <button type="button" onClick={handleCopy} className="small-button">
                {copied ? '✓ Copied' : 'Copy text'}
              </button>
              <button type="button" className="small-button danger-button" onClick={() => setText('')}>
                Clear
              </button>
            </div>
          </div>

          <textarea
            ref={inputRef}
            className="keyboard-textarea"
            aria-label="Typing editor"
            placeholder="Your words go here... type freely, or start a typing test below."
            value={text}
            onChange={event => {
              if (!testFinished) setText(event.target.value);
            }}
            onKeyDown={handlePhysicalKeyDown}
            spellCheck={false}
          />

          <div className="editor-footer">
            <span>{words} {words === 1 ? 'word' : 'words'}</span>
            <span>{text.length} characters</span>
            <span>{text.length ? 'Editing' : 'No text yet'}</span>
          </div>
        </div>
      </section>

      <section className="stats-grid" aria-label="Typing statistics">
        <div className="stat-card">
          <span className="stat-icon">⌁</span>
          <div><span className="stat-label">SPEED</span><strong>{wpm} <small>WPM</small></strong></div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">◎</span>
          <div><span className="stat-label">ACCURACY</span><strong>{accuracy}<small>%</small></strong></div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">◷</span>
          <div>
            <span className="stat-label">TIME LEFT</span>
            <strong>{`${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`}</strong>
          </div>
        </div>
      </section>

      <section className="keyboard-section">
        <div className="keyboard-section-heading">
          <div>
            <span className="eyebrow">ON-SCREEN KEYBOARD</span>
            <h2>Type with every keystroke.</h2>
          </div>
          <div className="keyboard-badges">
            <span>{language}</span>
            <span>{capsLock ? 'CAPS ON' : 'CAPS OFF'}</span>
            <span>{shift ? 'SHIFT ON' : 'SHIFT OFF'}</span>
          </div>
        </div>

        <div className="keyboardcontainer">
          <div className="container">
            {rows.map((row, rowIndex) => (
              <div className="row" key={rowIndex}>
                {row.map((item, keyIndex) => (
                  <button
                    type="button"
                    key={`${item.key}-${keyIndex}`}
                    className={[
                      'key',
                      item.width ? `key-${item.width}` : '',
                      item.key === 'Shift' && shift ? 'active' : '',
                      item.key === 'Caps Lock' && capsLock ? 'active' : '',
                      isPressed(item) ? 'physical-pressed' : '',
                    ].filter(Boolean).join(' ')}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => handleKey(item)}
                    aria-label={item.key === ' ' ? 'Space' : item.key}
                  >
                    {item.shift && language === 'English' && (
                      <span className="shift-symbol">{item.shift}</span>
                    )}
                    <span>{getLabel(item)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="typing-test-card">
        <div>
          <span className="eyebrow">{testDuration}-SECOND CHALLENGE</span>
          <h2>{testFinished ? 'Test complete!' : testRunning ? 'Keep going!' : 'Ready for a typing sprint?'}</h2>
          <p>{testText}</p>
          <div className="duration-picker" aria-label="Choose test duration">
            <span>Duration</span>
            {[30, 60, 120].map(seconds => (
              <button
                type="button"
                key={seconds}
                className={`duration-button ${testDuration === seconds ? 'selected' : ''}`}
                disabled={testRunning}
                onClick={() => {
                  setTestDuration(seconds);
                  setSecondsLeft(seconds);
                  setTestFinished(false);
                  setText('');
                  startedAtRef.current = null;
                  resultSavedRef.current = false;
                }}
              >
                {seconds}s
              </button>
            ))}
          </div>
        </div>
        <div className="test-actions">
          <span className="test-countdown">{formatTime(secondsLeft)} <small>remaining</small></span>
          <button
          type="button"
          className="primary-button"
          onClick={testRunning ? resetTest : testFinished ? startTest : startTest}
        >
          {testRunning ? 'Reset test' : testFinished ? 'Try again' : 'Start test'}
          </button>
        </div>
      </section>

      {testFinished && (
        <section className="results-panel" aria-live="polite">
          <div className="results-heading">
            <div>
              <span className="eyebrow">SESSION COMPLETE</span>
              <h2>Your typing results</h2>
              <p>Nice work! Every practice session helps you improve.</p>
            </div>
            <span className="results-trophy">🏆</span>
          </div>
          <div className="results-grid">
            <div className="result-stat"><span>Typing speed</span><strong>{wpm} <small>WPM</small></strong></div>
            <div className="result-stat"><span>Accuracy</span><strong>{accuracy}%</strong></div>
            <div className="result-stat"><span>Correct characters</span><strong>{correctChars}</strong></div>
            <div className="result-stat"><span>Test duration</span><strong>{testDuration}s</strong></div>
          </div>
          <button type="button" className="primary-button" onClick={startTest}>Take another test</button>
        </section>
      )}

      <section className="leaderboard-panel">
        <div className="leaderboard-heading">
          <div>
            <span className="eyebrow">YOUR PERSONAL BESTS</span>
            <h2>Typing leaderboard</h2>
            <p>Scores are saved in this browser on this device.</p>
          </div>
          <span className="leaderboard-trophy">♛</span>
        </div>
        {leaderboard.length ? (
          <div className="leaderboard-table-wrap">
            <table className="leaderboard-table">
              <thead><tr><th>Rank</th><th>Speed</th><th>Accuracy</th><th>Duration</th><th>Date</th></tr></thead>
              <tbody>
                {leaderboard.map((score, index) => (
                  <tr key={score.id}>
                    <td><span className={`rank-badge rank-${index + 1}`}>{index + 1}</span></td>
                    <td><strong>{score.wpm} WPM</strong></td>
                    <td>{score.accuracy}%</td>
                    <td>{score.duration}s</td>
                    <td>{score.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="leaderboard-empty">Your completed typing tests will appear here. Finish a test to add your first score.</div>
        )}
        {leaderboard.length > 0 && (
          <button type="button" className="small-button clear-leaderboard" onClick={() => {
            setLeaderboard([]);
            try { window.localStorage.removeItem(LEADERBOARD_KEY); } catch { /* ignore storage errors */ }
          }}>Clear leaderboard</button>
        )}
      </section>

      <footer className="app-footer">
        <span>KeySpace <span className="footer-separator">/</span> Virtual typing studio</span>
        <span>Made for better typing.</span>
      </footer>
    </main>
  );
}

export default Keyboard;
