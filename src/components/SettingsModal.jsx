import React, { useState } from 'react';
import {
  X,
  Shield,
  Users,
  MessageSquare,
  Volume2,
  VolumeX,
  UserX,
  MessageSquareOff,
  Check
} from 'lucide-react';

export function SettingsModal({
  isOpen,
  onClose,
  roomSettings,
  participants = [],
  currentUserId,
  onUpdateSettings,
  onKick,
  onToggleMuteSpeaking,
  onToggleMuteChat
}) {
  if (!isOpen || !roomSettings) return null;

  const [maxParticipants, setMaxParticipants] = useState(roomSettings.maxParticipants || 10);
  const [allowChat, setAllowChat] = useState(roomSettings.allowChat ?? true);
  const [allowSpeaking, setAllowSpeaking] = useState(roomSettings.allowSpeaking ?? true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateSettings({
      maxParticipants,
      allowChat,
      allowSpeaking
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const otherParticipants = participants.filter((p) => p.socketId !== currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Host Controls & Moderation</h3>
              <p className="text-xs text-slate-400">Configure room privileges and participants</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Room Settings Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Max Capacity</span>
                </label>
                <span className="text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                  {maxParticipants} Peers
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Speaking Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${allowSpeaking ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                  {allowSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Allow Voice Speaking</div>
                  <div className="text-[11px] text-slate-400">When disabled, everyone in the room is muted</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowSpeaking}
                  onChange={(e) => setAllowSpeaking(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Chat Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${allowChat ? 'bg-indigo-500/15 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                  {allowChat ? <MessageSquare className="w-4 h-4" /> : <MessageSquareOff className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Allow Live Chat</div>
                  <div className="text-[11px] text-slate-400">Enable or disable ephemeral chat relay</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowChat}
                  onChange={(e) => setAllowChat(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <span>Save Room Settings</span>
              )}
            </button>
          </form>

          {/* Participant Moderation Section */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Room Participants ({participants.length})
            </h4>

            {otherParticipants.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No other peers currently in the room.</p>
            ) : (
              <div className="space-y-2">
                {otherParticipants.map((peer) => (
                  <div
                    key={peer.socketId}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{peer.username}</div>
                      <div className="text-[10px] font-mono text-slate-500">{peer.socketId.slice(0, 10)}...</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleMuteSpeaking(peer.socketId, !peer.isMuted)}
                        className={`p-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          peer.isMuted
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                        title={peer.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                      >
                        {peer.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => onToggleMuteChat(peer.socketId, !peer.isChatMuted)}
                        className={`p-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          peer.isChatMuted
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                        title={peer.isChatMuted ? 'Unmute chat' : 'Mute chat'}
                      >
                        <MessageSquareOff className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onKick(peer.socketId)}
                        className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors"
                        title="Kick from room"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
