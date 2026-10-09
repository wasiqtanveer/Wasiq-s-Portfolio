import { useState, useEffect, useRef } from 'react';
import './Waaazek.css';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../siteConfig';
import { renderMarkdown } from './waaazekMarkdown';
import KnotMark from './experience/KnotMark';

const STORAGE_KEY = 'waaazek_chat';
const prompts = ['What can Wasiq build?', 'Tell me about his projects', 'Is he available for hire?', 'How do I contact Wasiq?'];

function ChatIcon({ name }) {
  const paths = {
    chat: 'M20 11a8 8 0 0 1-8 8H5l-3 3V11a9 9 0 0 1 18 0ZM7 9h8M7 13h5',
    close: 'm6 6 12 12M6 18 18 6',
    reset: 'M3 11a9 9 0 1 1 2.5 7M3 4v7h7',
    arrow: 'M12 20V4m-7 7 7-7 7 7',
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function loadStoredMessages() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(m => ['user', 'bot'].includes(m.role) && typeof m.text === 'string').map(m => ({ ...m, time: new Date(m.time) }));
  } catch { return []; }
}

export default function Waaazek() {
  const [messages, setMessages] = useState(loadStoredMessages);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [instant, setInstant] = useState(false);
  const chatRef = useRef(null);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const messagesBoxRef = useRef(null);
  const atBottomRef = useRef(true);
  const timers = useRef(new Set());
  const requestRef = useRef(null);

  const schedule = (callback, ms) => {
    const timer = setTimeout(() => { timers.current.delete(timer); callback(); }, ms);
    timers.current.add(timer);
  };

  useEffect(() => {
    const pending = timers.current;
    return () => { pending.forEach(clearTimeout); requestRef.current?.abort(); };
  }, []);

  useEffect(() => {
    try {
      if (messages.length) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch { /* The chat also works when browser storage is unavailable. */ }
  }, [messages]);

  // Scroll only the conversation, never the portfolio behind it.
  const scrollToBottom = () => {
    atBottomRef.current = true;
    setShowScrollBtn(false);
    const box = messagesBoxRef.current;
    box?.scrollTo({ top: box.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    if (!isOpen || !atBottomRef.current) return;
    const box = messagesBoxRef.current;
    box?.scrollTo({ top: messages.length ? box.scrollHeight : 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (!isOpen || isLoading || !window.matchMedia('(pointer: fine)').matches) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [isOpen, isLoading]);

  useEffect(() => {
    if (!isOpen) return;
    const outside = (event) => {
      if (!chatRef.current?.contains(event.target) && !wrapperRef.current?.contains(event.target)) setIsOpen(false);
    };
    const escape = (event) => {
      if (event.key !== 'Escape') return;
      setInstant(true);
      setIsOpen(false);
      wrapperRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [isOpen]);

  const closeChat = (event) => {
    setInstant(event.detail === 0);
    setIsOpen(false);
    wrapperRef.current?.focus({ preventScroll: true });
  };

  const downloadCV = () => {
    const link = document.createElement('a');
    link.href = '/Wasiq_CV_v2.pdf';
    link.download = 'Wasiq_Tanveer_CV.pdf';
    link.click();
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || cooldown) return;
    const history = messages.map(m => ({ role: m.role === 'bot' ? 'model' : 'user', parts: [{ text: m.text }] }));
    atBottomRef.current = true;
    setMessages(prev => [...prev, { role: 'user', text: trimmed, time: new Date() }]);
    setInputValue('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsLoading(true);
    setCooldown(true);
    const wantsCv = /\b(cv|resume|résumé|download)\b|portfolio pdf/i.test(trimmed);
    const pushBot = (text) => setMessages(prev => [...prev, { role: 'bot', text, time: new Date() }]);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, userMessage: trimmed }), signal: controller.signal,
      });
      let data = {};
      try { data = await response.json(); } catch { /* A non-JSON error still gets a useful fallback. */ }
      if (!response.ok) {
        if (response.status === 429) pushBot(data.reply || "I'm getting a lot of messages right now — give me a few seconds and try again!");
        else if (response.status === 400) pushBot(data.reply || "I couldn't read that one — mind rephrasing?");
        else pushBot("I couldn't connect just now. Try again, or reach Wasiq at " + CONTACT_EMAIL);
        return;
      }
      pushBot(data.reply || 'I had trouble finding an answer — reach Wasiq at ' + CONTACT_EMAIL);
      if (wantsCv) schedule(() => { downloadCV(); pushBot('Your CV download is on its way. ↓'); }, 800);
    } catch (error) {
      if (error.name !== 'AbortError') pushBot('The connection dropped. Try again, or email Wasiq at ' + CONTACT_EMAIL);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        schedule(() => setCooldown(false), 2000);
      }
    }
  };

  const clearChat = () => {
    if (isLoading || (messages.length && !window.confirm('Clear this conversation? It cannot be undone.'))) return;
    setMessages([]);
    setCopiedIdx(null);
    atBottomRef.current = true;
    setShowScrollBtn(false);
  };

  const copyMessage = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(index);
      schedule(() => setCopiedIdx(current => current === index ? null : current), 1500);
    } catch { /* Clipboard access may be disabled by the browser. */ }
  };

  return <>
    <button type="button" className="waaazek-wrapper" ref={wrapperRef}
      onClick={(event) => { setInstant(event.detail === 0); setIsOpen(open => !open); }}
      aria-label={(isOpen ? 'Close' : 'Open') + ' chat with Waaazek, the site assistant'} aria-expanded={isOpen} aria-controls="waaazek-chat">
      <ChatIcon name={isOpen ? 'close' : 'chat'} /><span>{isOpen ? 'Close chat' : 'Ask Waaazek'}</span><span className="waaazek-launch-arrow" aria-hidden="true">↗</span>
    </button>

    <section id="waaazek-chat" className="waaazek-chat-container" ref={chatRef} role="dialog" aria-modal="false" aria-labelledby="waaazek-title"
      data-open={isOpen} data-instant={instant} aria-hidden={!isOpen} inert={!isOpen} data-lenis-prevent="true">
      <header className="waaazek-chat-header">
        <span className="waaazek-chat-avatar" aria-hidden="true"><KnotMark /></span>
        <div className="waaazek-chat-identity"><h2 id="waaazek-title">Waaazek</h2><p>Wasiq’s AI assistant</p></div>
        <div className="waaazek-header-actions">
          {messages.length > 0 && <button type="button" className="waaazek-icon-btn" onClick={clearChat} disabled={isLoading} title="Clear chat" aria-label="Clear chat"><ChatIcon name="reset" /></button>}
          <button type="button" className="waaazek-icon-btn" onClick={closeChat} aria-label="Close chat"><ChatIcon name="close" /></button>
        </div>
      </header>

      <div className="waaazek-conversation">
        <div className="waaazek-messages" ref={messagesBoxRef} role="log" aria-label="Conversation with Waaazek" aria-live="polite" aria-relevant="additions text" tabIndex={0}
          onScroll={(event) => { const box = event.currentTarget; atBottomRef.current = box.scrollHeight - box.scrollTop - box.clientHeight < 40; setShowScrollBtn(!atBottomRef.current); }}>
          {!messages.length && <div className="waaazek-welcome">
            <span className="waaazek-eyebrow">A CONVERSATION STARTER</span>
            <h3>A little help,<br /><em>right here.</em></h3>
            <p>Curious about Wasiq’s work, skills, or your next project? Let’s get into it.</p>
            <div className="waaazek-pills">{prompts.map(pill => <button type="button" className="waaazek-pill" key={pill} onClick={() => sendMessage(pill)} disabled={cooldown || isLoading}><span>{pill}</span><span aria-hidden="true">↗</span></button>)}</div>
          </div>}

          {messages.map((message, index) => <div key={index} className={message.role === 'user' ? 'waaazek-user-bubble' : 'waaazek-bot-bubble'}>
            {message.role === 'bot' && <span className="waaazek-bot-avatar" aria-hidden="true"><KnotMark /></span>}
            <div className="waaazek-msg-col">
              <div className={message.role === 'user' ? 'waaazek-user-text' : 'waaazek-bot-text'}>{message.role === 'bot' ? renderMarkdown(message.text) : message.text}</div>
              <div className="waaazek-time-row"><span>{message.role === 'bot' ? 'Waaazek' : 'You'} · {message.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {message.role === 'bot' && <button type="button" className="waaazek-copy-btn" onClick={() => copyMessage(message.text, index)} aria-label="Copy message">{copiedIdx === index ? 'Copied ✓' : 'Copy'}</button>}
              </div>
            </div>
          </div>)}
          {isLoading && <div className="waaazek-bot-bubble"><span className="waaazek-bot-avatar" aria-hidden="true"><KnotMark /></span><div className="waaazek-typing" role="status"><span>Thinking</span><i /><i /><i /></div></div>}
        </div>
        {showScrollBtn && <button type="button" className="waaazek-scroll-btn" onClick={scrollToBottom} aria-label="Scroll to latest">Latest messages <span aria-hidden="true">↓</span></button>}
      </div>

      <form className="waaazek-input-area" onSubmit={(event) => { event.preventDefault(); sendMessage(inputValue); }}>
        <div className="waaazek-composer">
          <textarea ref={inputRef} rows={1} className="waaazek-input" aria-label="Your message" placeholder={isLoading ? 'Waaazek is thinking…' : 'Ask about Wasiq…'}
            value={inputValue} disabled={isLoading} maxLength={1000}
            onChange={(event) => { setInputValue(event.target.value); event.target.style.height = 'auto'; event.target.style.height = Math.min(event.target.scrollHeight, 112) + 'px'; }}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); sendMessage(inputValue); } }} />
          <button type="submit" className="waaazek-send-btn" disabled={isLoading || cooldown || !inputValue.trim()} aria-label="Send message"><ChatIcon name="arrow" /></button>
        </div>
        <div className="waaazek-input-note"><span>Ideas start with a hello.</span><a href={CONTACT_MAILTO}>Prefer email? <span aria-hidden="true">↗</span></a></div>
      </form>
    </section>
  </>;
}
