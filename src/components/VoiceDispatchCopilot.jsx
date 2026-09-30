import React, { useState, useEffect, useRef } from 'react';
import { useGrid } from '../context/GridContext';
import {
  Mic,
  MicOff,
  Send,
  Bot,
  User,
  X,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { playBreakerCloseSound, playAlarmChirp } from '../utils/audioEffects';

export const VoiceDispatchCopilot = ({ onNavigateTab }) => {
  const {
    gridFrequencyHz,
    totalDemandMw,
    totalGenerationMw,
    substation,
    triggerFLISRSimulation,
    triggerSolarDipSimulation,
    triggerPeakLoadADRSimulation,
    toggleTheme,
    theme
  } = useGrid();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Greetings, Operator. I am GridPulse SCADA Copilot. You can speak or type dispatch commands like "Report grid status", "Isolate Feeder 2", "Dispatch battery", or "Run cyber scan".',
      time: new Date().toLocaleTimeString('en-IN', { hour12: false })
    }
  ]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleProcessCommand(transcript);
        setIsListening(false);
      };

      recognition.onerror = (e) => {
        console.warn('[Copilot Voice] Speech recognition error', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert("Voice speech recognition is not supported in this browser. You can type commands below!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Synthesize voice reply
  const speakText = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  // NLP Command Parser & Dispatcher
  const handleProcessCommand = (commandText) => {
    const q = commandText.toLowerCase().trim();
    if (!q) return;

    // Add user message
    const userMsg = {
      sender: 'user',
      text: commandText,
      time: new Date().toLocaleTimeString('en-IN', { hour12: false })
    };

    let replyText = '';
    let actionType = 'NORMAL';

    if (q.includes('status') || q.includes('frequency') || q.includes('health')) {
      replyText = `Grid frequency is operating at ${gridFrequencyHz.toFixed(2)} Hz. Total substation demand is ${substation?.totalLoadMw || 23.5} MW against generation of ${substation?.totalGenMw || 28.0} MW. All 4 primary feeders are nominal.`;
      actionType = 'INFO';
    } else if (q.includes('isolate') || q.includes('flisr') || q.includes('fault') || q.includes('trip feeder 2')) {
      replyText = 'Initiating autonomous FLISR self-healing sequence on Feeder 2. Breakers CB-02 and sectionalizers SW-2A/SW-2B are actuating.';
      triggerFLISRSimulation();
      if (onNavigateTab) onNavigateTab('flisr');
      actionType = 'ACTION';
    } else if (q.includes('battery') || q.includes('bess') || q.includes('discharge')) {
      replyText = 'Discharging Substation 20 MWh Battery Storage at +5.0 MW to support bus voltage and compensate solar ramp.';
      if (onNavigateTab) onNavigateTab('topology');
      actionType = 'ACTION';
    } else if (q.includes('cyber') || q.includes('security') || q.includes('hack')) {
      replyText = 'Opening Cyber-Physical Security & Anti-Spoofing Center. Running State Estimation Chi-Square residual integrity check.';
      if (onNavigateTab) onNavigateTab('cyber');
      actionType = 'NAVIGATE';
    } else if (q.includes('market') || q.includes('price') || q.includes('iex') || q.includes('tariff')) {
      replyText = 'Switching to Real-Time Electricity Market. Current IEX clearing price is ₹3.85 per kWh with Merit Order Despatch optimized.';
      if (onNavigateTab) onNavigateTab('market');
      actionType = 'NAVIGATE';
    } else if (q.includes('v2g') || q.includes('ev') || q.includes('fleet')) {
      replyText = 'Navigating to Delhi EV Fleet V2G Aggregator. 1,520 connected vehicles available for peak shaving.';
      if (onNavigateTab) onNavigateTab('v2g');
      actionType = 'NAVIGATE';
    } else if (q.includes('theme') || q.includes('dark') || q.includes('light')) {
      toggleTheme();
      replyText = `Theme toggled to ${theme === 'dark' ? 'Light Day SCADA' : 'Dark Control Room'} mode.`;
      actionType = 'UI';
    } else if (q.includes('predictive') || q.includes('transformer') || q.includes('dga')) {
      replyText = 'Loading Transformer Health Index and Duval Triangle DGA diagnostics.';
      if (onNavigateTab) onNavigateTab('predictive');
      actionType = 'NAVIGATE';
    } else {
      replyText = `Understood: "${commandText}". Command verified against SCADA dispatch schema. Telemetry parameters remain nominal.`;
      actionType = 'INFO';
    }

    playBreakerCloseSound();

    const botMsg = {
      sender: 'bot',
      text: replyText,
      time: new Date().toLocaleTimeString('en-IN', { hour12: false })
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setInputText('');
    speakText(replyText);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleProcessCommand(inputText);
    }
  };

  return (
    <>
      {/* Floating Toggle Button in Bottom-Right */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 6px 20px rgba(139, 92, 246, 0.45)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'transform 0.2s ease'
        }}
        title="Open AI SCADA Voice Copilot"
      >
        {isOpen ? <X size={24} /> : <Bot size={26} />}
      </button>

      {/* Floating Copilot Dialog Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            width: '360px',
            maxWidth: 'calc(100vw - 48px)',
            height: '480px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: '14px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#8b5cf6', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} color="#fff" />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>SCADA AI Copilot</strong>
                <span style={{ fontSize: '0.68rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="status-dot normal" style={{ width: '6px', height: '6px' }} /> Natural Language Voice Dispatch
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setVoiceEnabled(prev => !prev)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: voiceEnabled ? 'var(--accent-cyan)' : 'var(--text-muted)', padding: '4px' }}
                title={voiceEnabled ? 'Mute AI voice synthesizer' : 'Enable AI voice synthesizer'}
              >
                {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem' }}>
            {messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: isUser ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-stat-box)',
                    border: `1px solid ${isUser ? 'rgba(139, 92, 246, 0.4)' : 'var(--border-subtle)'}`,
                    borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    padding: '10px 12px',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div>{m.text}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                    {m.time}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Command Suggestions */}
          <div style={{ padding: '6px 12px', display: 'flex', gap: '6px', overflowX: 'auto', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-stat-box)' }}>
            <button
              onClick={() => handleProcessCommand('Report grid status')}
              style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}
            >
              Report status
            </button>
            <button
              onClick={() => handleProcessCommand('Isolate Feeder 2')}
              style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer', whiteSpace: 'nowrap', color: '#ef4444' }}
            >
              Isolate Feeder 2
            </button>
            <button
              onClick={() => handleProcessCommand('Open Cyber Security')}
              style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer', whiteSpace: 'nowrap', color: '#8b5cf6' }}
            >
              Cyber scan
            </button>
            <button
              onClick={() => handleProcessCommand('Show Electricity Market')}
              style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer', whiteSpace: 'nowrap', color: '#10b981' }}
            >
              Market prices
            </button>
          </div>

          {/* Input Bar */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)' }}>
            <button
              onClick={toggleListen}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isListening ? '#ef4444' : 'rgba(139, 92, 246, 0.15)',
                color: isListening ? '#fff' : '#8b5cf6',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title={isListening ? 'Stop listening' : 'Start speaking command'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <input
              type="text"
              placeholder={isListening ? "Listening to voice..." : "Type or speak dispatch command..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                background: 'var(--bg-stat-box)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />

            <button
              onClick={() => handleProcessCommand(inputText)}
              disabled={!inputText.trim()}
              style={{
                background: 'var(--accent-cyan)',
                color: '#070b14',
                border: 'none',
                borderRadius: '6px',
                width: '36px',
                height: '36px',
                cursor: inputText.trim() ? 'pointer' : 'default',
                opacity: inputText.trim() ? 1 : 0.4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
