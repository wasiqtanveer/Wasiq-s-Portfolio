import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import './Waaazek.css';

const Waaazek = () => {
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pillsVisible, setPillsVisible] = useState(true);
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [idleMessage, setIdleMessage] = useState('');
  
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);
  const wrapperRef = useRef(null);
  const idleRef = useRef(null);
  const idleMsgIndex = useRef(0);

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
    const onScroll = () => {
      isPastHeroRef.current = window.scrollY > window.innerHeight * 0.8;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showWelcome, isLoading]);

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
    e.stopPropagation();
    setIsOpen(false);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading || cooldown) return;
    
    setMessages(prev => [...prev, {
      role: 'user', text, time: new Date()
    }]);
    
    setInputValue('');
    setPillsVisible(false);
    setIsLoading(true);
    setCooldown(true);

    const cvKeywords = ['cv', 'resume', 'download', 'portfolio pdf'];
    const wantsCv = cvKeywords.some(k => text.toLowerCase().includes(k));

    try {
      const history = messages.map(m => ({
        role: m.role === 'bot' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          userMessage: text
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        role: 'bot',
        text: data.reply || "Hmm I had trouble — reach Wasiq at mwasqit@gmail.com",
        time: new Date()
      }]);

      if (wantsCv) {
        setTimeout(() => {
          downloadCV();
          setMessages(prev => [...prev, {
            role: 'bot',
            text: '[ CV downloading now ↓ ]',
            time: new Date()
          }]);
        }, 800);
      }

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: "Something went wrong! Reach Wasiq at mwasqit@gmail.com 🔋",
        time: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => setCooldown(false), 2000);
    }
  };

  const downloadCV = () => {
    const link = document.createElement('a');
    link.href = '/Wasiq_CV.pdf';
    link.download = 'Wasiq_Tanveer_CV.pdf';
    link.click();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage(inputValue);
    }
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
            <button className="waaazek-close-btn" onClick={closeChat}>×</button>
          </div>
        </div>

        <div className="waaazek-messages">
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
              <div>
                <div className={msg.role === 'user' ? 'waaazek-user-text' : 'waaazek-bot-text'}>
                  {msg.text}
                </div>
                <div className={msg.role === 'user' ? 'waaazek-user-time' : 'waaazek-time'}>
                  {formatTime(msg.time)}
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

        <div className="waaazek-input-area">
          <input 
            type="text" 
            className="waaazek-input" 
            placeholder={isLoading ? "Waaazek is thinking..." : "Ask about Wasiq..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button 
            className="waaazek-send-btn" 
            onClick={() => sendMessage(inputValue)}
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? <div className="waaazek-spinner"></div> : "→"}
          </button>
        </div>
      </div>
    </>
  );
};

export default Waaazek;