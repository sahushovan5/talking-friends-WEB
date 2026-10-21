import React from 'react';
import {
  Crown,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageSquareOff,
  UserX,
  ShieldAlert
} from 'lucide-react';

// Generates consistent soft gradient background based on username string
function getAvatarGradient(name = '') {
  const gradients = [
    'from-indigo-600 to-purple-600',
    'from-blue-600 to-cyan-600',
    'from-emerald-600 to-teal-600',
    'from-rose-600 to-pink-600',
    'from-amber-600 to-orange-600',
    'from-violet-600 to-fuchsia-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export function ParticipantCard({
  participant,
  isSelf = false,
  isOwner = false,
  isSpeaking = false,
  currentUserId,
  onKick,
  onToggleMuteSpeaking,
  onToggleMuteChat
}) {
  const {
    socketId,
    username,
    isOwner: participantIsOwner,
    isMuted,
    isChatMuted
  } = participant;

  const initials = (username || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`relative glass-card rounded-2xl p-5 flex flex-col items-center justify-between transition-all duration-200 group ${
        isSpeaking
          ? 'border-emerald-500 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/10'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Badges */}
      <div className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {participantIsOwner && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold"
              title="Room Host"
            >
              <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Host</span>
            </span>
          )}
          {isSelf && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
              You
            </span>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-1.5">
          {isChatMuted && (
            <div
              className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30"
              title="Chat disabled for this user"
            >
              <MessageSquareOff className="w-3.5 h-3.5" />
            </div>
          )}

          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${
              isMuted
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                : isSpeaking
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={isMuted ? 'Microphone Muted' : isSpeaking ? 'Speaking' : 'Microphone Ready'}
          >
            {isMuted ? (
              <MicOff className="w-3.5 h-3.5" />
            ) : (
              <Mic className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      </div>

      {/* Avatar Graphic with Dynamic Pulse Ring */}
      <div className="relative my-3">
        {/* Active Speaking Animated Pulse Aura */}
        {isSpeaking && !isMuted && (
          <div className="absolute inset-0 -m-2 rounded-full border-2 border-emerald-400/80 animate-ping opacity-75 pointer-events-none" />
        )}

        <div
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr ${getAvatarGradient(
            username
          )} p-1 shadow-xl transition-transform duration-200 ${
            isSpeaking ? 'scale-105 ring-4 ring-emerald-500/40' : ''
          }`}
        >
          <div className="w-full h-full rounded-full bg-slate-900/90 flex items-center justify-center text-white text-xl sm:text-2xl font-bold tracking-wider select-none">
            {initials}
          </div>
        </div>

        {/* Live Audio Waves Badge on avatar when speaking */}
        {isSpeaking && !isMuted && (
          <div className="absolute bottom-0 right-0 bg-emerald-500 text-slate-950 p-1 rounded-full shadow-lg border-2 border-slate-900 flex items-center justify-center">
            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
          </div>
        )}
      </div>

      {/* Username Display */}
      <div className="text-center w-full px-2 mt-2">
        <h3
          className="text-sm font-bold text-white truncate max-w-full"
          title={username}
        >
          {username}
        </h3>
        <p className="text-[11px] font-mono text-slate-500 truncate">
          {socketId.slice(0, 8)}...
        </p>
      </div>

      {/* Host Quick Moderation Actions (on non-self peers) */}
      {isOwner && !isSelf && (
        <div className="w-full pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-around gap-1">
          <button
            onClick={() => onToggleMuteSpeaking(socketId, !isMuted)}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              isMuted
                ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute participant microphone'}
          >
            {isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onToggleMuteChat(socketId, !isChatMuted)}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              isChatMuted
                ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title={isChatMuted ? 'Unmute chat' : 'Mute participant chat'}
          >
            <MessageSquareOff className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onKick(socketId)}
            className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 text-xs transition-all"
            title="Kick from room"
          >
            <UserX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
