import React, { useState } from 'react';
import {
  Radio,
  Copy,
  Check,
  Users,
  LogOut,
  Sliders,
  Shield,
  Volume2,
  VolumeX,
  MessageSquare,
  MessageSquareOff
} from 'lucide-react';

export function RoomHeader({
  roomId,
  participantCount,
  maxParticipants,
  roomSettings,
  isOwner,
  onOpenSettings,
  onLeaveRoom
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?room=${encodeURIComponent(roomId)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Brand & Room Info */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <Radio className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="hidden sm:inline font-bold text-sm tracking-tight text-white">
            EchoMesh
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Room Code Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider hidden md:inline">
            Room:
          </span>
          <span className="font-mono text-xs sm:text-sm font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/80 px-2.5 py-1 rounded-lg truncate">
            {roomId}
          </span>

          <button
            onClick={handleCopyLink}
            title="Copy room invitation link"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all active:scale-95 border border-slate-700/60"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Share Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Middle Status / Badges */}
      <div className="hidden lg:flex items-center gap-3">
        {roomSettings && (
          <>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                roomSettings.allowSpeaking
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              {roomSettings.allowSpeaking ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span>{roomSettings.allowSpeaking ? 'Mic Open' : 'Muted by Host'}</span>
            </div>

            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                roomSettings.allowChat
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}
            >
              {roomSettings.allowChat ? (
                <MessageSquare className="w-3.5 h-3.5" />
              ) : (
                <MessageSquareOff className="w-3.5 h-3.5" />
              )}
              <span>{roomSettings.allowChat ? 'Chat Active' : 'Chat Closed'}</span>
            </div>
          </>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Capacity Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {participantCount}
            <span className="text-slate-500 font-normal">/{maxParticipants}</span>
          </span>
        </div>

        {/* Room Owner Settings Trigger */}
        {isOwner && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all"
            title="Room Host Settings"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Host Controls</span>
          </button>
        )}

        {/* Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all active:scale-95"
          title="Leave Room"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </header>
  );
}
