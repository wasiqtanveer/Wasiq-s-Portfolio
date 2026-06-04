import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import './Waaazek.css';
import { renderMarkdown } from './waaazekMarkdown';

const STORAGE_KEY = 'waaazek_chat';

// Rehydrate a prior conversation (same browsing session) so closing/reopening
// or a refresh doesn't wipe the chat. Times are revived back into Date objects.
const loadStoredMessages = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(m => ({ ...m, time: new Date(m.time) }));
  } catch {
    return [];
  }
};

const Waaazek = () => {
  const [messages, setMessages] = useState(loadStoredMessages);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pillsVisible, setPillsVisible] = useState(true);
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [idleMessage, setIdleMessage] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesBoxRef = useRef(null);
  const chatRef = useRef(null);
  const wrapperRef = useRef(null);
  const idleRef = useRef(null);
  const inputRef = useRef(null);
  const idleMsgIndex = useRef(0);
  const atBottomRef = useRef(true); // is the user pinned to the bottom of the log?

  const IDLE_MESSAGES = [
    "PSST! NEED HELP? 👋",
    "HI THERE! I'M WAAAZEK",
    "ASK ME ABOUT WASIQ!",
    "I DON'T BITE... MUCH 🤖"
  ];

  const pills = [
    "What can Wasiq build?",
    "Is he available for hire?",
    "Tell me about his projects",
    "How do I contact Wasiq?"
  ];

  useEffect(() => {
    // Initial entry animation is handled below based on isOpen, but we trigger the first mount specifically
  }, []);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      gsap.fromTo(wrapperRef.current, 
        { x: '100%', opacity: 0 }, 
        { x: 0, opacity: 1, duration: 0.8, delay: 3, ease: 'elastic.out(1, 0.6)' }
      );
      isInitialMount.current = false;
    } else {
      if (isOpen) {
        gsap.to(wrapperRef.current, {
          x: '100%',
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          pointerEvents: 'none'
        });
      } else {
        gsap.to(wrapperRef.current, {
          x: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'elastic.out(1, 0.6)',
          pointerEvents: 'all'
        });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const seen = localStorage.getItem('waaazek_seen');
    if (!seen) {
      setTimeout(() => setBadgeVisible(true), 5000);
    }
  }, []);

  const isOpenRef = useRef(isOpen);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  const isPastHeroRef = useRef(false);
  useEffect(() => {
    let rafId = 0;
    const read = () => {
      rafId = 0;
      isPastHeroRef.current = window.scrollY > window.innerHeight * 0.8;
    };
    const onScroll = () => { if (!rafId) rafId = requestAnimationFrame(read); };
    window.addEventListener('scroll', onScroll, { passive: true });
    read();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (idleRef.current) clearInterval(idleRef.current);
      return;
    }

    const triggerPeek = () => {
      if (isOpenRef.current || isPastHeroRef.current) return;
      
      setIdleMessage(IDLE_MESSAGES[idleMsgIndex.current]);
      idleMsgIndex.current = (idleMsgIndex.current + 1) % IDLE_MESSAGES.length;

      gsap.to(wrapperRef.current, { right: 16, duration: 0.5, ease: 'elastic.out(1, 0.6)' });
      gsap.fromTo('.waaazek-speech', { opacity: 0 }, { opacity: 1, duration: 0.3 });

      setTimeout(() => {
        if (!isOpenRef.current) {
          gsap.to(wrapperRef.current, { right: -52, duration: 0.4, ease: 'power2.in' });
          gsap.to('.waaazek-speech', { opacity: 0, duration: 0.3 });
        }
      }, 2500);
    };

    const initialDelay = setTimeout(() => {
      if (idleRef.current) clearInterval(idleRef.current);
      idleRef.current = setInterval(triggerPeek, 6000);
    }, 4000);

    return () => {
      clearTimeout(initialDelay);
      if (idleRef.current) clearInterval(idleRef.current);
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (isOpen) return;
    if (idleRef.current) {
      clearInterval(idleRef.current);
      idleRef.current = null;
    }
    gsap.killTweensOf(wrapperRef.current);
    gsap.killTweensOf('.waaazek-speech');
    
    // Explicit hover hover
    gsap.to(wrapperRef.current, { right: 16, duration: 0.5, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    gsap.to('.waaazek-speech', { opacity: 1, duration: 0.3 });
  };

  const handleMouseLeave = () => {
    if (isOpen) return;
    
    // Explicit hover out
    gsap.to(wrapperRef.current, { right: -52, duration: 0.5, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    gsap.to('.waaazek-speech', { opacity: 0, duration: 0.3 });
    
    if (idleRef.current) clearInterval(idleRef.current);
    idleRef.current = setInterval(() => {
      if (isOpenRef.current || isPastHeroRef.current) return;
      setIdleMessage(IDLE_MESSAGES[idleMsgIndex.current]);
      idleMsgIndex.current = (idleMsgIndex.current + 1) % IDLE_MESSAGES.length;
      gsap.to(wrapperRef.current, { right: 16, duration: 0.5, ease: 'elastic.out(1, 0.6)' });
      gsap.fromTo('.waaazek-speech', { opacity: 0 }, { opacity: 1, duration: 0.3 });
      setTimeout(() => {
        if (!isOpenRef.current) {
          gsap.to(wrapperRef.current, { right: -52, duration: 0.4, ease: 'power2.in' });
          gsap.to('.waaazek-speech', { opacity: 0, duration: 0.3 });
        }
      }, 2500);
    }, 6000);
  };

  // Smart auto-scroll: only follow new content if the user is already pinned to
  // the bottom. If they've scrolled up to re-read, we leave them be and surface
  // a "jump to latest" button instead of yanking them down.
  useEffect(() => {
    if (atBottomRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showWelcome, isLoading]);

  // Track whether the user is at the bottom of the message log.
  useEffect(() => {
    const box = messagesBoxRef.current;
    if (!box) return;
    const onScroll = () => {
      const dist = box.scrollHeight - box.scrollTop - box.clientHeight;
      const atBottom = dist < 40;
      atBottomRef.current = atBottom;
      setShowScrollBtn(!atBottom);
    };
    box.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => box.removeEventListener('scroll', onScroll);
  }, [isOpen]);

  const scrollToBottom = () => {
    atBottomRef.current = true;
    setShowScrollBtn(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Persist the conversation for the session so close/reopen/refresh keeps it.
  useEffect(() => {
    try {
      if (messages.length) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* storage full / disabled — non-fatal */ }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0 && !showWelcome && !isLoading) {
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          setShowWelcome(true);
          
          gsap.fromTo('.waaazek-pill', 
            { y: 8, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.3, stagger: 0.08, delay: 0.1 }
          );
        }, 1200);
      }
    }
  }, [isOpen, messages.length, showWelcome, isLoading]);

  const openChat = () => {
    if(!isOpen) {
      setIsOpen(true);
      setBadgeVisible(false);
      localStorage.setItem('waaazek_seen', 'true');
    } else {
      setIsOpen(false);
    }
  };

  const closeChat = (e) => {
    e?.stopPropagation();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpenRef.current && chatRef.current && !chatRef.current.contains(e.target) && wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isLoading && isOpen && inputRef.current) {
      // Small timeout to allow input to re-enable before focusing
      setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [isLoading, isOpen]);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Single shared AudioContext — creating one per keystroke leaks contexts
  // (browsers cap ~6, then it silently stops working). Lazily created/resumed.
  const audioCtxRef = useRef(null);
  const playTypingSound = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AC();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350 + Math.random() * 50, ctx.currentTime);
      gain.gain.setValueAtTime(0.015, ctx.currentTime); // Very quiet
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {
      // Ignore if autoplay blocked or unsupported
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (e.target.value.length > inputValue.length) {
      playTypingSound();
    }
    // Auto-grow the textarea up to a cap, then let it scroll internally.
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || cooldown) return;

    const userMsg = { role: 'user', text: trimmed, time: new Date() };
    // Build the history that goes to the model FROM the conversation up to and
    // including this user turn, in order. (Previously the new turn was omitted
    // and the trailing bot message left the sequence ending on 'model', which
    // muddled multi-turn context.) The server appends userMessage itself, so we
    // forward only the prior turns here — now correctly ordered.
    const history = messages.map(m => ({
      role: m.role === 'bot' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    if (inputRef.current) inputRef.current.style.height = 'auto'; // reset grow
    setPillsVisible(false);
    setIsLoading(true);
    setCooldown(true);

    // Word-boundary CV intent — substring matching fired on "service",
    // "discover", "recover", etc. Now only real "cv/resume/download" words.
    const wantsCv = /\b(cv|resume|résumé|download)\b|portfolio pdf/i.test(trimmed);

    const pushBot = (botText) =>
      setMessages(prev => [...prev, { role: 'bot', text: botText, time: new Date() }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, userMessage: trimmed }),
      });

      let data = {};
      try { data = await response.json(); } catch { /* non-JSON error body */ }

      if (!response.ok) {
        // Status-aware messaging so users get a useful hint, not a generic line.
        if (response.status === 429) {
          pushBot(data.reply || "I'm getting a lot of messages right now — give me a few seconds and try again! 🤖");
        } else if (response.status === 400) {
          pushBot(data.reply || "Hmm, I couldn't read that one — mind rephrasing?");
        } else {
          pushBot("My brain glitched for a sec! ⚡ Try again, or reach Wasiq at mwasqit@gmail.com");
        }
        return;
      }

      pushBot(data.reply || "Hmm I had trouble — reach Wasiq at mwasqit@gmail.com");

      if (wantsCv) {
        setTimeout(() => {
          downloadCV();
          pushBot('[ CV downloading now ↓ ]');
        }, 800);
      }

    } catch {
      // Network-level failure (offline, DNS, CORS, aborted).
      pushBot("Looks like the connection dropped! 📡 Check your internet and try again, or email Wasiq at mwasqit@gmail.com");
    } finally {
      setIsLoading(false);
      setTimeout(() => setCooldown(false), 2000);
    }
  };

  const downloadCV = () => {
    const link = document.createElement('a');
    link.href = '/Wasiq_CV_v2.pdf';
    link.download = 'Wasiq_Tanveer_CV.pdf';
    link.click();
  };

  const handleKeyDown = (e) => {
    // Enter sends; Shift+Enter inserts a newline (multiline support).
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // Copy a bot reply to the clipboard with a brief "copied" confirmation.
  const copyMessage = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(c => (c === idx ? null : c)), 1500);
    } catch {
      /* clipboard blocked — silently ignore */
    }
  };

  // Clear the whole conversation and reset to the welcome state.
  const clearChat = (e) => {
    e?.stopPropagation();
    setMessages([]);
    setShowWelcome(false);
    setPillsVisible(true);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    // Re-show the welcome + pills shortly after, like a fresh open.
    setTimeout(() => {
      setShowWelcome(true);
      gsap.fromTo('.waaazek-pill',
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, stagger: 0.08, delay: 0.1 }
      );
    }, 150);
  };

  return (
    <>
      <div 
        className={`waaazek-wrapper`} 
        ref={wrapperRef}
        onClick={openChat}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ transform: 'translateX(100%)', opacity: 0 }}
      >
        <div className="waaazek-robot-container">
          {badgeVisible && <div className="waaazek-badge" />}
          
          <svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
            <g className="waaazek-head-group">
              {/* Antenna */}
              <rect x="48.5" y="6" width="3" height="14" fill="rgba(57,255,20,0.4)" />
              <circle className="waaazek-antenna-tip" cx="50" cy="5" r="5" fill="#39FF14" />
              
              {/* Ear bolts */}
              <circle cx="16" cy="46" r="3" fill="rgba(57,255,20,0.3)" />
              <circle cx="84" cy="46" r="3" fill="rgba(57,255,20,0.3)" />
              
              {/* Head */}
              <rect x="22" y="20" width="56" height="52" rx="10" fill="#111110" stroke="#39FF14" strokeWidth="1.5" />
              
              {/* Face screen */}
              <rect x="30" y="30" width="40" height="30" rx="6" fill="#0a0a08" stroke="rgba(57,255,20,0.2)" />
              
              {/* Eyes */}
              <g filter="drop-shadow(0 0 4px rgba(57,255,20,0.9))">
                <rect className="waaazek-eye waaazek-eye-left" x="38" y="38" width="9" height="8" rx="2" fill="#39FF14" />
                <rect className="waaazek-eye" x="53" y="38" width="9" height="8" rx="2" fill="#39FF14" />
              </g>
              
              {/* Mouth */}
              <path d="M42 50 Q 50 54 58 50" stroke="rgba(57,255,20,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </g>
            
            {/* Body */}
            <g>
              {/* Arm bumps */}
              <circle cx="21" cy="85" r="6" fill="#111110" stroke="rgba(57,255,20,0.2)" />
              <circle cx="79" cy="85" r="6" fill="#111110" stroke="rgba(57,255,20,0.2)" />
              
              {/* Main body */}
              <rect x="27" y="72" width="46" height="26" rx="8" fill="#111110" stroke="rgba(57,255,20,0.2)" />
              
              {/* Chest slots */}
              <line x1="38" y1="80" x2="62" y2="80" stroke="rgba(57,255,20,0.25)" strokeWidth="1" strokeLinecap="round" />
              <line x1="38" y1="85" x2="62" y2="85" stroke="rgba(57,255,20,0.25)" strokeWidth="1" strokeLinecap="round" />
              <line x1="38" y1="90" x2="62" y2="90" stroke="rgba(57,255,20,0.25)" strokeWidth="1" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        <div className="waaazek-speech" style={{ display: isOpen ? 'none' : '' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#39FF14' }}>
            {idleMessage || "HI! I'M WAAAZEK 👋"}
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: '#4a4a42', marginTop: '4px' }}>
            [ click to chat ]
          </div>
        </div>
      </div>

      <div 
        className="waaazek-chat-container" 
        ref={chatRef} 
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        style={{ 
          opacity: isOpen ? 1 : 0, 
          pointerEvents: isOpen ? 'all' : 'none', 
          transform: isOpen ? 'scale(1)' : 'scale(0.85)', 
          transition: 'opacity 0.3s, transform 0.3s' 
        }}
      >
        <div className="waaazek-chat-header">
          <div className="waaazek-chat-avatar">W</div>
          <div>
            <div className="waaazek-chat-name">WAAAZEK</div>
            <div className="waaazek-chat-subtitle">Wasiq's AI Companion</div>
          </div>
          <div className="waaazek-chat-online">
            <div className="waaazek-online-dot"></div>
            <div className="waaazek-online-text">ONLINE</div>
            {messages.length > 0 && (
              <button
                className="waaazek-clear-btn"
                onClick={clearChat}
                title="Clear chat"
                aria-label="Clear chat"
              >
                ⟲
              </button>
            )}
            <button className="waaazek-close-btn" onClick={closeChat} aria-label="Close chat">×</button>
          </div>
        </div>

        <div className="waaazek-messages" ref={messagesBoxRef}>
          {showWelcome && (
            <div className="waaazek-bot-bubble">
              <div className="waaazek-bot-avatar">W</div>
              <div className="waaazek-bot-text">
                Hey there! 👋 I'm Waaazek, Wasiq's AI companion. Ask me anything about him!
              </div>
            </div>
          )}

          {showWelcome && pillsVisible && (
            <div className="waaazek-pills">
              {pills.map((pill, i) => (
                <button
                  key={i}
                  className="waaazek-pill"
                  onClick={() => sendMessage(pill)}
                >
                  {pill}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'waaazek-user-bubble' : 'waaazek-bot-bubble'}>
              {msg.role === 'bot' && <div className="waaazek-bot-avatar">W</div>}
              <div className="waaazek-msg-col">
                <div className={msg.role === 'user' ? 'waaazek-user-text' : 'waaazek-bot-text'}>
                  {msg.role === 'bot' ? renderMarkdown(msg.text) : msg.text}
                </div>
                <div className={msg.role === 'user' ? 'waaazek-user-time' : 'waaazek-time-row'}>
                  <span>{formatTime(msg.time)}</span>
                  {msg.role === 'bot' && (
                    <button
                      className="waaazek-copy-btn"
                      onClick={() => copyMessage(msg.text, i)}
                      title="Copy"
                      aria-label="Copy message"
                    >
                      {copiedIdx === i ? 'copied ✓' : 'copy'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="waaazek-bot-bubble">
              <div className="waaazek-bot-avatar">W</div>
              <div className="waaazek-bot-text">
                <div className="waaazek-typing">
                  <div className="waaazek-typing-dot"></div>
                  <div className="waaazek-typing-dot"></div>
                  <div className="waaazek-typing-dot"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Jump-to-latest — only when the user has scrolled up */}
        {showScrollBtn && (
          <button className="waaazek-scroll-btn" onClick={scrollToBottom} aria-label="Scroll to latest">
            ↓
          </button>
        )}

        <div className="waaazek-input-area">
          <textarea
            ref={inputRef}
            rows={1}
            className="waaazek-input"
            placeholder={isLoading ? "Waaazek is thinking..." : "Ask about Wasiq…  (Shift+Enter for new line)"}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={1000}
          />
          <button
            className="waaazek-send-btn"
            onClick={() => sendMessage(inputValue)}
            disabled={isLoading || !inputValue.trim()}
            aria-label="Send message"
          >
            {isLoading ? <div className="waaazek-spinner"></div> : "→"}
          </button>
        </div>
      </div>
    </>
  );
};

export default Waaazek;