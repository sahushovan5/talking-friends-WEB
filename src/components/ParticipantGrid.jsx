import React from 'react';
import { ParticipantCard } from './ParticipantCard';
import { UserPlus } from 'lucide-react';

export function ParticipantGrid({
  participants = [],
  currentUserId,
  isOwner,
  isSpeakingLocal,
  speakingPeers = {},
  isLocalMuted,
  maxParticipants,
  onKick,
  onToggleMuteSpeaking,
  onToggleMuteChat,
  onCopyInvite
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
      <div className="max-w-6xl w-full mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {participants.map((p) => {
            const isSelf = p.socketId === currentUserId;
            const isSpeaking = isSelf ? isSpeakingLocal : Boolean(speakingPeers[p.socketId]);
            const participantMuted = isSelf ? isLocalMuted : p.isMuted;

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
              />
            );
          })}

          {/* Empty slot placeholder prompting to invite friends */}
          {participants.length < maxParticipants && (
            <div
              onClick={onCopyInvite}
              className="glass-card rounded-2xl p-6 border-2 border-dashed border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/40 transition-all flex flex-col items-center justify-center cursor-pointer group min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-full bg-slate-800/80 group-hover:bg-indigo-600/20 text-slate-400 group-hover:text-indigo-400 flex items-center justify-center mb-3 transition-colors">
                <UserPlus className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-300 group-hover:text-indigo-300 text-center">
                Invite Peer
              </p>
              <p className="text-[11px] text-slate-500 text-center mt-1">
                Click to copy link
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
