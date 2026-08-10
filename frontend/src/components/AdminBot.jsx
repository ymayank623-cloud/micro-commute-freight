import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import axios from 'axios';

const AdminBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { 
            sender: 'bot', 
            text: '👋 **Hello!** I am your **FlowLink Gemini AI Assistant**.\n\nAsk me anything in plain English about our **dynamic pricing (₹65 base + ₹12/km + ₹2/min + ₹5/kg)**, **surge & loyalty discounts**, **80km micro-commute limits**, or live fleet tracking!' 
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen, loading]);

    const handleSend = async (textToSend) => {
        const query = typeof textToSend === 'string' ? textToSend : input;
        if (!query.trim()) return;

        const userMsg = query.trim();
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/bot/chat`, { message: userMsg }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: res.data.reply 
            }]);
        } catch (err) {
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: '❌ **Notice:** AI assistant is temporarily offline. Please try again in a moment.' 
            }]);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { label: '💰 How is price calculated?', query: 'How does FlowLink calculate delivery prices?' },
        { label: '🚗 How to become a driver?', query: 'How can I register as a commuter driver and earn?' },
        { label: '📊 Live Platform Stats', query: 'Show live system stats and active shipments' },
        { label: '📍 80km Radius Rules', query: 'What are the micro-commute distance limits?' }
    ];

    const formatMessage = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #00F0FF;">$1</strong>')
            .replace(/`(.*?)`/g, '<code style="background: rgba(0, 240, 255, 0.15); color: #00F0FF; padding: 2px 6px; border-radius: 4px; font-size: 0.85em;">$1</code>')
            .replace(/\n/g, '<br/>');
    };

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00F0FF 0%, #8A2BE2 100%)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 8px 30px rgba(0, 240, 255, 0.4), 0 0 20px rgba(138, 43, 226, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '26px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.1) translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 240, 255, 0.6)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1) translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 240, 255, 0.4)';
                    }}
                >
                    <FaRobot />
                    <span style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        border: '2px solid #0A0F1C',
                        boxShadow: '0 0 8px #10B981'
                    }} />
                </button>
            )}

            {isOpen && (
                <div style={{
                    width: '390px',
                    height: '580px',
                    background: 'rgba(10, 15, 28, 0.88)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    borderRadius: '24px',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 240, 255, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(138, 43, 226, 0.15))',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #00F0FF, #8A2BE2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '18px',
                                boxShadow: '0 0 12px rgba(0, 240, 255, 0.4)'
                            }}>
                                <FaRobot />
                            </div>
                            <div>
                                <h6 style={{ margin: 0, fontWeight: '700', color: '#F8FAFC', fontSize: '15px', letterSpacing: '-0.2px' }}>
                                    FlowLink AI
                                </h6>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8' }}>
                                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                                    Online • Logistics Intelligence
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#94A3B8',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                        >
                            <FaTimes size={14} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        padding: '16px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '88%'
                            }}>
                                <div style={{
                                    background: msg.sender === 'user' 
                                        ? 'linear-gradient(135deg, #00F0FF, #0072FF)' 
                                        : 'rgba(255, 255, 255, 0.05)',
                                    color: msg.sender === 'user' ? '#FFFFFF' : '#E2E8F0',
                                    padding: '12px 16px',
                                    borderRadius: '18px',
                                    border: msg.sender === 'bot' ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                                    borderBottomRightRadius: msg.sender === 'user' ? '4px' : '18px',
                                    borderBottomLeftRadius: msg.sender === 'bot' ? '4px' : '18px',
                                    fontSize: '0.88rem',
                                    lineHeight: '1.5',
                                    wordBreak: 'break-word',
                                    boxShadow: msg.sender === 'user' ? '0 4px 15px rgba(0, 240, 255, 0.2)' : 'none'
                                }} dangerouslySetInnerHTML={{ 
                                    __html: formatMessage(msg.text)
                                }}>
                                </div>
                            </div>
                        ))}

                        {/* Clean Subtle Typing / Processing Indicator */}
                        {loading && (
                            <div style={{
                                alignSelf: 'flex-start',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                padding: '12px 18px',
                                borderRadius: '18px',
                                borderBottomLeftRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00F0FF', animation: 'pulse 1s infinite', animationDelay: '0s' }} />
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00F0FF', animation: 'pulse 1s infinite', animationDelay: '0.2s' }} />
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00F0FF', animation: 'pulse 1s infinite', animationDelay: '0.4s' }} />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div style={{
                        padding: '8px 14px',
                        display: 'flex',
                        gap: '6px',
                        overflowX: 'auto',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        background: 'rgba(0, 0, 0, 0.2)'
                    }}>
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(action.query)}
                                style={{
                                    whiteSpace: 'nowrap',
                                    background: 'rgba(0, 240, 255, 0.08)',
                                    border: '1px solid rgba(0, 240, 255, 0.2)',
                                    color: '#00F0FF',
                                    padding: '5px 10px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0, 240, 255, 0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>

                    {/* Input Form */}
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
                        style={{
                            display: 'flex',
                            gap: '8px',
                            padding: '12px 14px',
                            background: 'rgba(10, 15, 28, 0.95)',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                    >
                        <input 
                            type="text" 
                            value={input} 
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask anything or give a command..."
                            autoFocus
                            style={{ 
                                flex: 1,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                outline: 'none',
                                padding: '10px 16px',
                                fontSize: '0.88rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '14px',
                                color: '#F8FAFC',
                                caretColor: '#00F0FF',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = '#00F0FF'}
                            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || loading} 
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                background: input.trim() && !loading ? 'linear-gradient(135deg, #00F0FF, #8A2BE2)' : 'rgba(255, 255, 255, 0.05)',
                                border: 'none',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                                fontSize: '15px',
                                opacity: (!input.trim() || loading) ? 0.4 : 1,
                                transition: 'all 0.2s',
                                boxShadow: input.trim() && !loading ? '0 0 12px rgba(0, 240, 255, 0.4)' : 'none'
                            }}
                        >
                            <FaPaperPlane />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AdminBot;
