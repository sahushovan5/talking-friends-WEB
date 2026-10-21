import React, { useEffect, useRef, useState, useCallback } from 'react';
import YouTube from 'react-youtube';
import {
  Youtube,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  Radio,
  ExternalLink,
  Users
} from 'lucide-react';

export function YouTubePlayerCard({
  activeVideo, // { videoId, title, broadcasterId, isBroadcaster, initialTime, initialIsPlaying }
  broadcasterName = 'Broadcaster',
  onClose,
  socket,
  roomId
}) {
  if (!activeVideo || !activeVideo.videoId) return null;

  const playerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlayingLocal, setIsPlayingLocal] = useState(activeVideo.initialIsPlaying ?? true);
  const isBroadcaster = activeVideo.isBroadcaster;

  // Broadcaster: Broadcast initial state on mount
  useEffect(() => {
    if (!isBroadcaster || !socket || !socket.connected || !roomId) return;

    socket.emit('broadcast-youtube-state', {
      roomId,
      videoId: activeVideo.videoId,
      title: activeVideo.title,
      currentTime: 0,
      isPlaying: true
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
  }, [isBroadcaster, socket, activeVideo.broadcasterId, onClose]);

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

  return (
    <div
      className={`fixed z-40 transition-all duration-300 ${
        isMinimized
          ? 'bottom-24 right-4 sm:right-6 w-80 glass-panel rounded-2xl shadow-2xl overflow-hidden border border-slate-700/80'
          : 'top-20 right-4 sm:right-6 w-[92vw] sm:w-[480px] md:w-[560px] glass-panel rounded-2xl shadow-2xl overflow-hidden border border-slate-700/80'
      }`}
    >
      {/* Top Bar */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-lg bg-red-600/20 text-red-500">
            <Youtube className="w-4 h-4 fill-red-500" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate max-w-[220px] sm:max-w-[280px]">
              {activeVideo.title || 'YouTube Video'}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px]">
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

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isMinimized ? 'Expand Player' : 'Minimize Player'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
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
      {!isMinimized && (
        <div className="relative aspect-video w-full bg-black">
          <YouTube
            videoId={activeVideo.videoId}
            opts={opts}
            onReady={handlePlayerReady}
            onPlay={handlePlayerPlay}
            onPause={handlePlayerPause}
            className="w-full h-full"
            iframeClassName="w-full h-full"
          />
        </div>
      )}

      {/* Sync Status Banner */}
      <div className="px-3 py-1.5 bg-slate-900/90 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>{isBroadcaster ? 'Room Sync Active (You lead)' : 'Syncing in real-time'}</span>
        </div>
        <a
          href={`https://www.youtube.com/watch?v=${activeVideo.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-white flex items-center gap-1 hover:underline text-[10px]"
        >
          <span>Watch on YT</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
