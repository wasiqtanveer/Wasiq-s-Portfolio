import React, { useState, useRef } from 'react';
import gsap from 'gsap';

export default function Waaazek() {
  const [status, setStatus] = useState('idle');
  const botRef = useRef();

  const handleClick = () => {
    if (status === 'clicked') return;
    setStatus('clicked');

    // Slide off-screen to the right
    gsap.to(botRef.current, {
      x: '120%', 
      duration: 0.6,
      ease: 'power3.in'
    });

    // Wait 2.5s, then slide back
    setTimeout(() => {
      gsap.to(botRef.current, {
        x: '0%',
        duration: 0.8,
        ease: 'power3.out',
        onComplete: () => setStatus('idle')
      });
    }, 2500);
  };

  return (
    <div 
      ref={botRef}
      className="absolute top-[100px] md:top-[120px] right-0 z-[90] flex items-center pr-4 cursor-pointer group will-change-transform"
      onClick={handleClick}
      aria-label="Waaazek Bot"
    >
      {/* Speech Bubble */}
      <div className="relative bg-surface border border-border px-4 py-2 mr-4 font-mono text-[10px] md:text-[11px] text-muted tracking-widest uppercase transition-colors group-hover:border-green group-hover:text-text shadow-lg animate-[float_3s_ease-in-out_infinite]">
        {status === 'idle' ? 'Hello! I am Waaazek.' : 'Not charged yet! 🔋'}
        {/* Tail pointing right */}
        <div className="absolute top-1/2 -right-[6px] -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-border group-hover:border-l-green transition-colors" />
      </div>

      {/* Robot Graphic */}
      <div className="relative flex flex-col items-center animate-[float_3s_ease-in-out_infinite] animate-delay-[0.2s]">
        {/* Antenna */}
        <div className="w-[2px] h-[8px] bg-muted relative">
          <div className="absolute -top-[3px] -left-[2px] w-[6px] h-[6px] rounded-full transition-colors duration-300 shadow-[0_0_8px_#39FF14]" style={{ backgroundColor: status === 'idle' ? '#39FF14' : '#ff3939', boxShadow: status === 'idle' ? '0 0 8px #39FF14' : '0 0 8px #ff3939' }} />
        </div>
        {/* Head */}
        <div className="w-[30px] h-[26px] bg-surface border-2 border-muted rounded-md flex justify-center items-center gap-1.5 transition-colors group-hover:border-green relative overflow-hidden">
          {/* Eyes */}
          <div className="w-[6px] h-[3px] rounded-full transition-colors duration-300" style={{ backgroundColor: status === 'idle' ? '#39FF14' : '#ff3939', boxShadow: status === 'idle' ? '0 0 5px #39FF14' : '0 0 5px #ff3939' }} />
          <div className="w-[6px] h-[3px] rounded-full transition-colors duration-300" style={{ backgroundColor: status === 'idle' ? '#39FF14' : '#ff3939', boxShadow: status === 'idle' ? '0 0 5px #39FF14' : '0 0 5px #ff3939' }} />
        </div>
        {/* Neck */}
        <div className="w-[6px] h-[3px] bg-border" />
        {/* Body (peeking out) */}
        <div className="w-[36px] h-[14px] bg-surface border-2 border-b-0 border-muted rounded-t-lg transition-colors group-hover:border-green flex justify-center pt-1 overflow-hidden">
          <div className="w-[16px] h-[2px] bg-border" />
        </div>
      </div>
    </div>
  );
}
