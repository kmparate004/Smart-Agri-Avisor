
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { User } from '../types';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Props {
    user: User;
    currentContext?: any;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const renderMessage = (text: string) => {
    return (
        <div className="space-y-3">
            {text.replace(/\\n/g, '\n').split('\n').map((line, lineIdx) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return <div key={lineIdx} className="h-2" />;

                const parseLineContent = (content: string) => {
                    const parts = content.split(/(\*\*.*?\*\*)/g);
                    return parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className="text-emerald-900 font-bold">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    });
                };

                if (trimmedLine.startsWith('###') || (trimmedLine.includes(':') && trimmedLine.length < 60 && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('*'))) {
                    const headerText = trimmedLine.replace(/^###\s*/, '').replace(/\*\*/g, '').trim();
                    return (
                        <div key={lineIdx} className="pt-2 border-b border-emerald-100/30 pb-1 mb-2">
                            <h4 className="text-emerald-800 font-extrabold text-[13.5px] uppercase tracking-wide">
                                {headerText}
                            </h4>
                        </div>
                    );
                }

                if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*') || /^\d+\./.test(trimmedLine)) {
                    const content = trimmedLine.replace(/^[•\-\*\d+\.]\s*/, '').trim();
                    return (
                        <div key={lineIdx} className="flex gap-3 items-start my-1.5 pl-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-sm" />
                            <p className="text-[14.5px] text-slate-700 leading-[1.6] flex-1">
                                {parseLineContent(content)}
                            </p>
                        </div>
                    );
                }

                return (
                    <p key={lineIdx} className="text-[14px] text-slate-600 leading-[1.6]">
                        {parseLineContent(trimmedLine)}
                    </p>
                );
            })}
        </div>
    );
};

const AgriChat: React.FC<Props> = ({ user, currentContext, messages, setMessages, loading, setLoading }) => {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, loading]);


    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const history = messages.slice(-10);
            // Include user's name in context for personalized responses
            const enrichedContext = { ...currentContext, userName: user.name };
            const answer = await geminiService.askQuestion(user.phone, userMsg, enrichedContext, history);

            // Start simulated streaming
            setLoading(false);
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            const words = answer.split(' ');
            let currentContent = '';

            for (let i = 0; i < words.length; i++) {
                currentContent += (i === 0 ? '' : ' ') + words[i];
                const updatedContent = currentContent;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        role: 'assistant',
                        content: updatedContent
                    };
                    return newMessages;
                });
                // Dynamic speed based on word length
                await new Promise(resolve => setTimeout(resolve, 15 + Math.random() * 20));
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Mandi network busy. Please try again." }]);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-[700px] md:h-[calc(100vh-170px)] flex flex-col bg-[#FDFEFE] rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden mt-6 relative animate-in fade-in duration-700">

            {/* Minimalist Premium Header */}
            <div className="px-10 py-7 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between z-10">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-600 rounded-[20px] flex items-center justify-center text-white shadow-[0_10px_20px_rgba(5,150,105,0.2)]">
                        <i className="fas fa-leaf text-2xl"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1.5">Agri-Advisor AI</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Live Grounding Enabled</p>
                        </div>
                    </div>
                </div>
                {currentContext?.location?.district && (
                    <div className="bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100 flex items-center gap-2.5 shadow-sm">
                        <i className="fas fa-location-dot text-emerald-600 text-xs"></i>
                        <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">{currentContext.location.district}</span>
                    </div>
                )}
            </div>

            {/* Conversational Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-10 py-10 space-y-8 scroll-smooth"
                style={{
                    background: 'radial-gradient(circle at center, #ffffff 0%, #f9fafb 100%)'
                }}
            >
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`}>
                        <div className={`flex flex-col group ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[75%]`}>
                            <div className={`px-6 py-4 rounded-[28px] shadow-sm relative transition-all duration-300 ${msg.role === 'user'
                                ? 'bg-[#E3F2ED] text-emerald-950 border border-emerald-200/40 rounded-tr-none'
                                : 'bg-white/90 backdrop-blur-sm text-slate-700 border border-slate-100 rounded-tl-none ring-1 ring-slate-50'
                                }`}>
                                <div className="text-[14.5px] leading-[1.6] font-medium tracking-tight">
                                    {renderMessage(msg.content)}
                                </div>
                            </div>
                            <span className={`text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2 flex items-center gap-2 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <i className={`fas ${msg.role === 'user' ? 'fa-user' : 'fa-robot'} text-[8px]`}></i>
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 px-6 py-4 rounded-[28px] rounded-tl-none shadow-sm">
                            <div className="flex gap-2">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Interaction Footer */}
            <div className="px-10 pb-8 pt-4 bg-white/80 backdrop-blur-md border-t border-slate-100">
                <form onSubmit={handleSend} className="relative group">
                    <div className="absolute inset-0 bg-emerald-500/5 rounded-[24px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <div className={`relative flex items-center bg-slate-50 border transition-all duration-300 rounded-[24px] p-2 pr-4 ${loading ? 'border-slate-100' : 'border-slate-200 focus-within:border-emerald-500 focus-within:bg-white focus-within:shadow-xl focus-within:shadow-emerald-100/30'}`}>
                        <div className="pl-6 pr-2 text-slate-400">
                            <i className="fas fa-keyboard"></i>
                        </div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message here..."
                            className="flex-1 bg-transparent border-none py-4 px-2 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-0 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition-all ${!input.trim() || loading
                                ? 'bg-slate-200 text-slate-400'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 active:scale-90'
                                }`}
                        >
                            {loading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-paper-plane"></i>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AgriChat;
