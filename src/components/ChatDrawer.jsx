import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Shield,
  Clock,
  AlertCircle,
  Crown
} from 'lucide-react';

export function ChatDrawer({
  isOpen,
  onClose,
  messages = [],
  onSendMessage,
  currentUserId,
  ownerSocketId,
  isChatAllowed = true,
  isUserChatMuted = false
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !isChatAllowed || isUserChatMuted) return;

    onSendMessage(inputText.trim());
    setInputText('');
  };

  const isInputDisabled = !isChatAllowed || isUserChatMuted;

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-30 w-full sm:w-96 glass-panel border-l border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Drawer Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            Live Room Chat
          </h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            Zero-Persistence
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Ephemeral Warning Banner */}
      <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-900/40 text-[11px] text-indigo-300 flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
        <span>Messages are ephemeral and never stored on the server.</span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-medium">No messages yet</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Say hello to everyone in the room!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.senderId === currentUserId;
            const isHost = msg.senderId === ownerSocketId;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    {msg.username}
                    {isHost && (
                      <Crown className="w-3 h-3 text-amber-400 fill-amber-400" title="Host" />
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {timeStr}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-normal break-words leading-relaxed shadow-sm ${
                    isSelf
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Moderation Notice if Chat Disabled */}
      {isInputDisabled && (
        <div className="p-3 mx-3 mb-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {!isChatAllowed
              ? 'Chat has been disabled by the room host.'
              : 'You have been muted from chat by the host.'}
          </span>
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-2">
          <input
            type="text"
            disabled={isInputDisabled}
            value={inputText}
            maxLength={1000}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isInputDisabled
                ? 'Chat is currently restricted...'
                : 'Send an ephemeral message...'
            }
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={isInputDisabled || !inputText.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </aside>
  );
}
