import React, { useEffect, useRef, useState, useCallback } from 'react';
import YouTube from 'react-youtube';
import {
  X,
  Maximize2,
  Minimize2,
  Volume2,
  Radio,
  ExternalLink,
  Users
} from 'lucide-react';
import { YouTubeIcon } from './YouTubeIcon';

export function YouTubePlayerCard({
  activeVideo, // { videoId, title, broadcasterId, isBroadcaster, initialTime, initialIsPlaying }
  broadcasterName = 'Broadcaster',
  onClose,
  socket,
  roomId,
  isMinimized: isMinimizedProp,
  onToggleMinimize,
  embedded = false
}) {
  if (!activeVideo || !activeVideo.videoId) return null;

  const playerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isMinimizedInternal, setIsMinimizedInternal] = useState(false);
  const isMinimized = isMinimizedProp !== undefined ? isMinimizedProp : isMinimizedInternal;
  const toggleMinimized = onToggleMinimize || (() => setIsMinimizedInternal((prev) => !prev));
  const [isPlayingLocal, setIsPlayingLocal] = useState(activeVideo.initialIsPlaying ?? true);
  const isBroadcaster = activeVideo.isBroadcaster;

  // Reset readiness when videoId changes
  useEffect(() => {
    setIsPlayerReady(false);
  }, [activeVideo.videoId]);

  // Broadcaster: Broadcast initial state on mount or when videoId changes
  useEffect(() => {
    if (!isBroadcaster || !socket || !socket.connected || !roomId) return;

    socket.emit('broadcast-youtube-state', {
      roomId,
      videoId: activeVideo.videoId,
      title: activeVideo.title,
      currentTime: 0,
      isPlaying: true
    });

    socket.emit('youtube-player-action', {
      roomId,
      action: 'change-video',
      videoId: activeVideo.videoId,
      title: activeVideo.title,
      currentTime: 0
    });
  }, [isBroadcaster, socket, roomId, activeVideo.videoId, activeVideo.title]);

  // Periodic heartbeat sync from broadcaster to keep all watchers in sync
  useEffect(() => {
    if (!isBroadcaster || !socket || !socket.connected || !roomId || !isPlayerReady) return;

    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime() || 0;
        const playerState = playerRef.current.getPlayerState();
        const playing = playerState === 1; // 1 = YT.PlayerState.PLAYING

        socket.emit('broadcast-youtube-state', {
          roomId,
          videoId: activeVideo.videoId,
          title: activeVideo.title,
          currentTime: time,
          isPlaying: playing
        });
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isBroadcaster, socket, roomId, activeVideo.videoId, activeVideo.title, isPlayerReady]);

  // Player Ready Handler
  const handlePlayerReady = (event) => {
    playerRef.current = event.target;
    setIsPlayerReady(true);

    if (isBroadcaster) {
      // Broadcaster starts playing
      event.target.playVideo();
    } else {
      // Watcher: Seek to the broadcaster's current timestamp immediately
      const startSec = Number(activeVideo.initialTime) || 0;
      event.target.seekTo(startSec, true);
      if (activeVideo.initialIsPlaying !== false) {
        event.target.playVideo();
      } else {
        event.target.pauseVideo();
      }
    }
  };

  // Broadcaster player action triggers
  const handlePlayerPlay = () => {
    setIsPlayingLocal(true);
    if (!isBroadcaster || !socket || !socket.connected || !roomId) return;

    const currentTime = playerRef.current?.getCurrentTime?.() || 0;
    socket.emit('youtube-player-action', {
      roomId,
      action: 'play',
      currentTime
    });
  };

  const handlePlayerPause = () => {
    setIsPlayingLocal(false);
    if (!isBroadcaster || !socket || !socket.connected || !roomId) return;

    const currentTime = playerRef.current?.getCurrentTime?.() || 0;
    socket.emit('youtube-player-action', {
      roomId,
      action: 'pause',
      currentTime
    });
  };

  // Watcher: Listen to incoming actions and drift sync from the broadcaster
  useEffect(() => {
    if (isBroadcaster || !socket) return;

    const handlePeerAction = (data) => {
      if (data.broadcasterId !== activeVideo.broadcasterId || !playerRef.current) return;
      // If action specifies a videoId that does not match our current video, ignore until updated
      if (data.videoId && data.videoId !== activeVideo.videoId) return;

      const targetTime = Number(data.currentTime) || 0;

      if (data.action === 'play') {
        playerRef.current.seekTo(targetTime, true);
        playerRef.current.playVideo();
        setIsPlayingLocal(true);
      } else if (data.action === 'pause') {
        playerRef.current.seekTo(targetTime, true);
        playerRef.current.pauseVideo();
        setIsPlayingLocal(false);
      } else if (data.action === 'seek') {
        playerRef.current.seekTo(targetTime, true);
      }
    };

    const handlePeerUpdated = (data) => {
      if (data.socketId !== activeVideo.broadcasterId || !playerRef.current || !data.mediaState) return;

      const media = data.mediaState;
      // CRITICAL: If broadcaster has switched to a new videoId, ignore drift seek on the old video!
      if (media.videoId && media.videoId !== activeVideo.videoId) {
        return;
      }

      // Calculate expected time factoring in elapsed transit time if playing
      const elapsed = media.isPlaying ? (Date.now() - media.updatedAt) / 1000 : 0;
      const expectedTime = (Number(media.currentTime) || 0) + elapsed;

      const currentTime = playerRef.current.getCurrentTime?.() || 0;
      // If client drifted by more than 2.5 seconds, gently seekTo
      if (Math.abs(currentTime - expectedTime) > 2.5) {
        playerRef.current.seekTo(expectedTime, true);
      }

      if (media.isPlaying && playerRef.current.getPlayerState?.() !== 1) {
        playerRef.current.playVideo();
        setIsPlayingLocal(true);
      } else if (!media.isPlaying && playerRef.current.getPlayerState?.() === 1) {
        playerRef.current.pauseVideo();
        setIsPlayingLocal(false);
      }
    };

    const handlePeerStopped = (data) => {
      if (data.socketId === activeVideo.broadcasterId) {
        onClose();
      }
    };

    socket.on('peer-youtube-action', handlePeerAction);
    socket.on('peer-youtube-updated', handlePeerUpdated);
    socket.on('peer-youtube-stopped', handlePeerStopped);

    return () => {
      socket.off('peer-youtube-action', handlePeerAction);
      socket.off('peer-youtube-updated', handlePeerUpdated);
      socket.off('peer-youtube-stopped', handlePeerStopped);
    };
  }, [isBroadcaster, socket, activeVideo.broadcasterId, activeVideo.videoId, onClose]);

  const handleClosePlayer = () => {
    if (isBroadcaster && socket && socket.connected && roomId) {
      socket.emit('stop-youtube', { roomId });
    }
    onClose();
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: isBroadcaster ? 1 : 1, // Watchers also have volume control
      modestbranding: 1,
      rel: 0,
      playsinline: 1
    }
  };

  const isFloatingPiP = !embedded || isMinimized;

  return (
    <div
      className={`transition-all duration-300 overflow-hidden ${
        isFloatingPiP
          ? 'fixed bottom-24 right-4 sm:right-6 z-40 w-80 sm:w-96 glass-panel rounded-2xl shadow-2xl border border-slate-700/80 bg-slate-950/95'
          : 'w-full flex-1 flex flex-col glass-panel rounded-2xl lg:rounded-3xl border border-slate-700/80 shadow-2xl bg-slate-950/90 backdrop-blur-xl'
      }`}
    >
      {/* Top Bar */}
      <div
        className={`bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 ${
          isFloatingPiP ? 'px-3 py-2' : 'px-4 sm:px-6 py-3'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 sm:p-1.5 rounded-lg bg-red-600/20 text-red-500 flex-shrink-0">
            <YouTubeIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          </div>
          <div className="min-w-0">
            <h4
              className={`font-bold text-white truncate ${
                isFloatingPiP
                  ? 'text-xs max-w-[170px]'
                  : 'text-xs sm:text-sm lg:text-base max-w-[200px] sm:max-w-md lg:max-w-xl'
              }`}
              title={activeVideo.title}
            >
              {activeVideo.title || 'YouTube Video'}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
              {isBroadcaster ? (
                <span className="text-indigo-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  Broadcasting as Host
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Synced with {broadcasterName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={toggleMinimized}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isMinimized ? 'Expand to Theater Stage' : 'Minimize to Corner'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleClosePlayer}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title={isBroadcaster ? 'Stop Stream for Room' : 'Leave Video Stream'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div
        className={`relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden ${
          isFloatingPiP ? 'h-44 sm:h-52' : 'flex-1 min-h-[220px] sm:min-h-[340px] md:min-h-[400px] lg:min-h-[460px]'
        }`}
      >
        <YouTube
          key={activeVideo.videoId}
          videoId={activeVideo.videoId}
          opts={opts}
          onReady={handlePlayerReady}
          onPlay={handlePlayerPlay}
          onPause={handlePlayerPause}
          className="w-full h-full"
          iframeClassName="w-full h-full"
        />
      </div>

      {/* Sync Status Banner */}
      <div className="px-3 sm:px-4 py-2 bg-slate-900/90 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="font-medium text-slate-300">
            {isBroadcaster ? 'Room Sync Active (Broadcasting)' : 'Synchronized Playback Active'}
          </span>
        </div>
        <a
          href={`https://www.youtube.com/watch?v=${activeVideo.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-white flex items-center gap-1 hover:underline text-[10px]"
        >
          <span>Watch on YouTube</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
