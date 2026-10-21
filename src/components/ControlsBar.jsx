import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  MessageSquare,
  Sliders,
  LogOut,
  ChevronUp,
  Settings,
  Shield,
  Volume2
} from 'lucide-react';
import { YouTubeIcon } from './YouTubeIcon';

export function ControlsBar({
  isMuted,
  onToggleMute,
  audioDevices = [],
  selectedDeviceId,
  onSelectDevice,
  isChatOpen,
  onToggleChat,
  unreadCount = 0,
  isOwner,
  onOpenSettings,
  onLeaveRoom,
  isSpeakingLocal,
  isSpeakingDisabled = false,
  onOpenYouTube,
  hasActiveYouTube = false
}) {
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);

  const selectedDevice = audioDevices.find((d) => d.deviceId === selectedDeviceId);

  return (
    <div className="fixed bottom-0 inset-x-0 z-20 p-3 sm:p-4 pointer-events-none flex justify-center">
      <div className="glass-panel border border-slate-700/60 rounded-2xl sm:rounded-full px-3 sm:px-6 py-2.5 sm:py-3 shadow-2xl flex items-center gap-2 sm:gap-4 pointer-events-auto backdrop-blur-xl">
        {/* Mic Toggle & Device Dropdown */}
        <div className="relative flex items-center">
          <button
            onClick={onToggleMute}
            disabled={isSpeakingDisabled}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl sm:rounded-full font-semibold text-xs sm:text-sm transition-all active:scale-95 shadow-md ${
              isSpeakingDisabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                : isMuted
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : isSpeakingLocal
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/40 shadow-emerald-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
            title={
              isSpeakingDisabled
                ? 'Microphone disabled by host'
                : isMuted
                ? 'Unmute Microphone'
                : 'Mute Microphone'
            }
          >
            {isMuted ? (
              <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            <span className="hidden sm:inline">
              {isSpeakingDisabled
                ? 'Mic Locked'
                : isMuted
                ? 'Unmute'
                : isSpeakingLocal
                ? 'Speaking...'
                : 'Mute'}
            </span>
          </button>

          {/* Micro Device Selector Trigger */}
          {audioDevices.length > 0 && (
            <button
              onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
              className="ml-1 p-2 rounded-lg sm:rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Select Microphone Hardware"
            >
              <ChevronUp
                className={`w-4 h-4 transition-transform duration-200 ${
                  isDeviceMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}

          {/* Audio Input Device Popover */}
          {isDeviceMenuOpen && (
            <div className="absolute bottom-full left-0 mb-3 w-64 sm:w-72 glass-panel rounded-2xl p-3 border border-slate-700 shadow-2xl z-30">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                Select Audio Input
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {audioDevices.map((device, index) => {
                  const isSelected = device.deviceId === selectedDeviceId;
                  return (
                    <button
                      key={device.deviceId || index}
                      onClick={() => {
                        onSelectDevice(device.deviceId);
                        setIsDeviceMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">
                        {device.label || `Microphone ${index + 1}`}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-800" />

        {/* YouTube Watch Together Button */}
        <button
          onClick={onOpenYouTube}
          className={`p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 border ${
            hasActiveYouTube
              ? 'bg-red-600/20 border-red-500/40 text-red-400 shadow-md shadow-red-600/20'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700/60'
          }`}
          title="Watch YouTube Together"
        >
          <YouTubeIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="hidden sm:inline">YouTube</span>
          {hasActiveYouTube && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        {/* Chat Toggle Button */}
        <button
          onClick={onToggleChat}
          className={`relative p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 ${
            isChatOpen
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white'
          }`}
          title="Toggle Chat"
        >
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          <span className="hidden sm:inline">Chat</span>

          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center animate-pulse shadow-md">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Host Settings Trigger */}
        {isOwner && (
          <button
            onClick={onOpenSettings}
            className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-amber-400 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 border border-amber-500/20"
            title="Room Host Settings"
          >
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-800" />

        {/* Leave Room Action */}
        <button
          onClick={onLeaveRoom}
          className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-rose-950/20"
          title="Leave Room"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </div>
  );
}
