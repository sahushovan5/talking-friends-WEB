import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  MessageSquare,
  Send,
  Sparkles,
  Radio,
  Clock,
  UserPlus,
  Volume2
} from 'lucide-react';
import { YouTubeIcon } from './YouTubeIcon';
import { YouTubePlayerCard } from './YouTubePlayerCard';
import { ParticipantCard } from './ParticipantCard';

export function WatchPartyStudio({
  participants = [],
  currentUserId,
  isOwner,
  isSpeakingLocal,
  speakingPeers = {},
  isLocalMuted,
  maxParticipants = 10,
  onKick,
  onToggleMuteSpeaking,
  onToggleMuteChat,
  onCopyInvite,
  onTuneInYouTube,
  activeVideo,
  broadcasterName,
  onCloseYouTube,
  onToggleMinimize,
  socket,
  roomId,
  messages = [],
  onSendMessage,
  ownerSocketId,
  isChatAllowed = true,
  isUserChatMuted = false
}) {
  const [mobileTab, setMobileTab] = useState('chat'); // 'chat' | 'voice'
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef(null);

  // Auto-scroll chat messages to bottom
  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, mobileTab]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !isChatAllowed || isUserChatMuted) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const isChatInputDisabled = !isChatAllowed || isUserChatMuted;

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-4 lg:gap-6 items-stretch justify-center w-full max-w-7xl mx-auto my-auto animate-fadeIn transition-all duration-500">
      {/* ============================================================== */}
      {/* DESKTOP SIDEBAR: Voice Speakers (Top) + Live Chat (Bottom)      */}
      {/* ============================================================== */}
      <aside className="hidden md:flex w-80 lg:w-96 flex-shrink-0 flex-col glass-panel rounded-2xl lg:rounded-3xl border border-slate-800/90 shadow-2xl overflow-hidden bg-slate-950/85 backdrop-blur-xl h-[calc(100vh-175px)] min-h-[520px]">
        {/* --- Top Half: Room Speakers List --- */}
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/40 flex-shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Voice Lounge ({participants.length})</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {participants.length}/{maxParticipants}
            </span>
          </div>

          {/* Scrollable list of voice participants in compact cards */}
          <div className="space-y-2 max-h-48 lg:max-h-56 overflow-y-auto pr-1">
            {participants.map((p) => {
              const isSelf = p.socketId === currentUserId;
              const isSpeaking = isSelf ? isSpeakingLocal : Boolean(speakingPeers[p.socketId]);
              const participantMuted = isSelf ? isLocalMuted : p.isMuted;
              const isTunedIntoThisUser = activeVideo?.broadcasterId === p.socketId;

              return (
                <ParticipantCard
                  key={p.socketId}
                  participant={{
                    ...p,
                    isMuted: participantMuted
                  }}
                  isSelf={isSelf}
                  isOwner={isOwner}
                  isSpeaking={isSpeaking}
                  currentUserId={currentUserId}
                  onKick={onKick}
                  onToggleMuteSpeaking={onToggleMuteSpeaking}
                  onToggleMuteChat={onToggleMuteChat}
                  onTuneInYouTube={onTuneInYouTube}
                  isTunedIntoThisUser={isTunedIntoThisUser}
                  compact={true}
                />
              );
            })}

            {/* Compact Invite Slot */}
            {participants.length < maxParticipants && (
              <div
                onClick={onCopyInvite}
                className="glass-card rounded-xl p-2.5 border-2 border-dashed border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <UserPlus className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
                <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-300">
                  Invite Peer (Copy link)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* --- Bottom Half: Real-time Watch Party Chat --- */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/60">
          {/* Chat Header Bar */}
          <div className="px-3.5 py-2 border-b border-slate-800/60 bg-slate-900/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Live Chat</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Ephemeral
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                <MessageSquare className="w-6 h-6 mb-1.5 opacity-30" />
                <p className="text-xs font-medium">No messages yet</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Drop a message while watching together!
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
                      <span className="font-bold text-[11px] text-slate-400">
                        {isSelf ? 'You' : msg.senderName}
                      </span>
                      {isHost && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-400 font-bold">
                          Host
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600">{timeStr}</span>
                    </div>

                    <div
                      className={`px-3 py-2 rounded-2xl max-w-[85%] text-xs leading-relaxed break-words shadow-sm ${
                        isSelf
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Integrated Chat Input */}
          <form
            onSubmit={handleSendChat}
            className="p-2.5 border-t border-slate-800/80 bg-slate-900/60 flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                isUserChatMuted
                  ? 'Chat is disabled for you by host'
                  : !isChatAllowed
                  ? 'Chat is disabled in this room'
                  : 'Say something in watch party...'
              }
              disabled={isChatInputDisabled}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isChatInputDisabled || !chatInput.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* THEATER VIDEO PLAYER (Desktop Right Stage / Mobile Top Screen) */}
      {/* ============================================================== */}
      <section className="flex-1 min-w-0 flex flex-col justify-center h-full">
        <YouTubePlayerCard
          activeVideo={activeVideo}
          broadcasterName={broadcasterName}
          onClose={onCloseYouTube}
          socket={socket}
          roomId={roomId}
          isMinimized={false}
          onToggleMinimize={onToggleMinimize}
          embedded={true}
        />

        {/* ============================================================== */}
        {/* MOBILE VIEW CONTROLS (< 768px): Tabbed Switcher (Voice / Chat) */}
        {/* ============================================================== */}
        <div className="md:hidden mt-3 glass-panel rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/90 flex flex-col">
          {/* Segmented Switcher */}
          <div className="flex border-b border-slate-800 bg-slate-900/50 p-1">
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                mobileTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Watch Party Chat ({messages.length})</span>
            </button>

            <button
              onClick={() => setMobileTab('voice')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                mobileTab === 'voice'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Voice Speakers ({participants.length})</span>
            </button>
          </div>

          {/* Mobile Tab Content */}
          {mobileTab === 'voice' ? (
            <div className="p-3 space-y-2 max-h-56 overflow-y-auto">
              {participants.map((p) => {
                const isSelf = p.socketId === currentUserId;
                const isSpeaking = isSelf ? isSpeakingLocal : Boolean(speakingPeers[p.socketId]);
                const participantMuted = isSelf ? isLocalMuted : p.isMuted;
                const isTunedIntoThisUser = activeVideo?.broadcasterId === p.socketId;

                return (
                  <ParticipantCard
                    key={p.socketId}
                    participant={{
                      ...p,
                      isMuted: participantMuted
                    }}
                    isSelf={isSelf}
                    isOwner={isOwner}
                    isSpeaking={isSpeaking}
                    currentUserId={currentUserId}
                    onKick={onKick}
                    onToggleMuteSpeaking={onToggleMuteSpeaking}
                    onToggleMuteChat={onToggleMuteChat}
                    onTuneInYouTube={onTuneInYouTube}
                    isTunedIntoThisUser={isTunedIntoThisUser}
                    compact={true}
                  />
                );
              })}

              {participants.length < maxParticipants && (
                <div
                  onClick={onCopyInvite}
                  className="glass-card rounded-xl p-2.5 border-2 border-dashed border-slate-800 hover:border-indigo-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-400">
                    Invite Peer (Copy link)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-64">
              <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    No messages yet. Send a message!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-slate-400 mb-0.5">
                          {isSelf ? 'You' : msg.senderName}
                        </span>
                        <div
                          className={`px-3 py-1.5 rounded-xl max-w-[85%] text-xs ${
                            isSelf
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              <form
                onSubmit={handleSendChat}
                className="p-2 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Say something..."
                  disabled={isChatInputDisabled}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isChatInputDisabled || !chatInput.trim()}
                  className="p-2 rounded-xl bg-indigo-600 text-white"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
