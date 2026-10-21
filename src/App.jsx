import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getSocket, connectSocket, disconnectSocket, getBrowserId } from './services/socket';
import { useWebRTC } from './hooks/useWebRTC';
import { Lobby } from './components/Lobby';
import { RoomHeader } from './components/RoomHeader';
import { ParticipantGrid } from './components/ParticipantGrid';
import { ChatDrawer } from './components/ChatDrawer';
import { ControlsBar } from './components/ControlsBar';
import { SettingsModal } from './components/SettingsModal';
import { AudioStreamsContainer } from './components/AudioStreamsContainer';
import { YouTubeModal } from './components/YouTubeModal';
import { YouTubePlayerCard } from './components/YouTubePlayerCard';
import { WatchPartyStudio } from './components/WatchPartyStudio';

export default function App() {
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [initialRoomId, setInitialRoomId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [roomSettings, setRoomSettings] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentSocketId, setCurrentSocketId] = useState('');
  const [activeRooms, setActiveRooms] = useState([]);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null); // { videoId, title, broadcasterId, isBroadcaster, initialTime, initialIsPlaying }
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const tabId = useMemo(() => 'tab_' + Math.random().toString(36).substring(2, 9), []);

  // Check URL query param for direct navigation (?room=xyz or /room/xyz)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromQuery = urlParams.get('room');
    if (roomFromQuery) {
      setInitialRoomId(roomFromQuery);
    } else {
      const match = window.location.pathname.match(/\/room\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        setInitialRoomId(match[1]);
      }
    }
  }, []);

  // Reference to handleLeaveRoom to avoid circular hook initialization / TDZ issues
  const leaveRoomRef = useRef(null);

  const handleKicked = useCallback((reason) => {
    setErrorMessage(reason || 'You were kicked from the room.');
    if (leaveRoomRef.current) {
      leaveRoomRef.current(false);
    }
  }, []);

  // WebRTC Audio Mesh Hook
  const {
    localStream,
    isMuted,
    toggleMute,
    setMutedForcefully,
    isSpeakingLocal,
    speakingPeers,
    audioDevices,
    selectedDeviceId,
    switchAudioDevice,
    initLocalStream,
    audioStreams,
    cleanup: cleanupWebRTC
  } = useWebRTC({
    roomId,
    isRoomActive: inRoom,
    currentUserId: currentSocketId,
    onKicked: handleKicked
  });

  // Leave room logic
  const handleLeaveRoom = useCallback(
    (notifyServer = true) => {
      const socket = getSocket();
      if (notifyServer && socket && socket.connected && roomId) {
        socket.emit('leave-room', { roomId });
      }

      cleanupWebRTC();
      setInRoom(false);
      setRoomId('');
      setParticipants([]);
      setRoomSettings(null);
      setMessages([]);
      setIsChatOpen(false);
      setUnreadCount(0);
      setIsSettingsOpen(false);
      setActiveVideo((current) => {
        if (current?.isBroadcaster && socket && socket.connected && roomId) {
          socket.emit('stop-youtube', { roomId });
        }
        return null;
      });
      setIsYouTubeModalOpen(false);
      setIsPlayerMinimized(false);

      // Clean URL without page reload
      if (window.history.pushState) {
        window.history.pushState(null, '', window.location.pathname);
      }
    },
    [roomId, cleanupWebRTC]
  );

  // Keep leaveRoomRef in sync
  leaveRoomRef.current = handleLeaveRoom;

  // Listen for other tabs in the same browser joining a room (1 browser = 1 room)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('echomesh_browser_sync');

    channel.onmessage = (event) => {
      const { type, roomId: newRoomId, tabId: senderTabId } = event.data || {};
      if (type === 'ROOM_JOINED' && senderTabId !== tabId) {
        setInRoom((currentlyInRoom) => {
          if (currentlyInRoom) {
            setErrorMessage(`Disconnected: You joined room "${newRoomId}" in another tab. Only 1 room per browser is allowed.`);
            if (leaveRoomRef.current) {
              leaveRoomRef.current(false);
            }
          }
          return false;
        });
      }
    };

    return () => {
      channel.close();
    };
  }, [tabId]);

  // Check if current user is room owner
  const isOwner = useMemo(() => {
    if (!roomSettings || !currentSocketId) return false;
    return roomSettings.ownerSocketId === currentSocketId;
  }, [roomSettings, currentSocketId]);

  // Current participant object
  const currentParticipant = useMemo(() => {
    return participants.find((p) => p.socketId === currentSocketId) || null;
  }, [participants, currentSocketId]);

  // Setup Socket listeners for room & chat lifecycle
  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => {
      setCurrentSocketId(socket.id);
    };

    const onRoomCreated = (data) => {
      setIsLoading(false);
      setCurrentSocketId(socket.id);
      setRoomId(data.roomId);
      setParticipants(data.participants || []);
      setRoomSettings(data.roomSettings);
      setInRoom(true);

      // Initialize local microphone
      initLocalStream().catch((err) => {
        console.warn('Microphone permission denied or unavailable:', err);
      });

      // Broadcast to other tabs in this browser (1 browser = 1 room)
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const syncChannel = new BroadcastChannel('echomesh_browser_sync');
          syncChannel.postMessage({ type: 'ROOM_JOINED', roomId: data.roomId, tabId });
          syncChannel.close();
        } catch (e) {}
      }

      // Update URL query param for quick sharing
      if (window.history.pushState) {
        const newUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(
          data.roomId
        )}`;
        window.history.pushState(null, '', newUrl);
      }
    };

    const onRoomJoined = (data) => {
      setIsLoading(false);
      setCurrentSocketId(socket.id);
      setRoomId(data.roomId);
      setParticipants(data.participants || []);
      setRoomSettings(data.roomSettings);
      setInRoom(true);

      // Initialize local microphone (starts muted)
      initLocalStream().catch((err) => {
        console.warn('Microphone permission denied or unavailable:', err);
      });

      // Broadcast to other tabs in this browser (1 browser = 1 room)
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const syncChannel = new BroadcastChannel('echomesh_browser_sync');
          syncChannel.postMessage({ type: 'ROOM_JOINED', roomId: data.roomId, tabId });
          syncChannel.close();
        } catch (e) {}
      }

      // Update URL query param for quick sharing
      if (window.history.pushState) {
        const newUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(
          data.roomId
        )}`;
        window.history.pushState(null, '', newUrl);
      }
    };

    const onJoinError = (data) => {
      setIsLoading(false);
      setErrorMessage(data?.message || 'Could not join room.');
    };

    const onUserJoined = (newcomer) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === newcomer.socketId)) return prev;
        return [...prev, newcomer];
      });
    };

    const onUserLeft = ({ socketId: leftId }) => {
      setParticipants((prev) => prev.filter((p) => p.socketId !== leftId));
    };

    const onOwnerUpdated = ({ newOwnerId }) => {
      setRoomSettings((prev) => (prev ? { ...prev, ownerSocketId: newOwnerId } : prev));
      setParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          isOwner: p.socketId === newOwnerId
        }))
      );
    };

    const onRoomSettingsUpdated = (updatedSettings) => {
      setRoomSettings((prev) => ({
        ...prev,
        ...updatedSettings
      }));

      // If speaking was disabled globally, forcefully mute local mic
      if (updatedSettings.allowSpeaking === false) {
        setMutedForcefully(true);
      }
    };

    const onUserMuted = ({ targetId, muteSpeaking, muteChat }) => {
      // Update participant list state
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.socketId === targetId) {
            return {
              ...p,
              ...(typeof muteSpeaking === 'boolean'
                ? { isMuted: muteSpeaking, isMutedByHost: muteSpeaking }
                : {}),
              ...(typeof muteChat === 'boolean' ? { isChatMuted: muteChat } : {})
            };
          }
          return p;
        })
      );

      // If we are the target user, enforce mute
      if (targetId === socket.id) {
        if (typeof muteSpeaking === 'boolean') {
          setMutedForcefully(muteSpeaking);
        }
      }
    };

    const onUserAudioStateChanged = ({ socketId: peerId, isMuted: peerMuted }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === peerId ? { ...p, isMuted: peerMuted } : p))
      );
    };

    const onNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      setIsChatOpen((open) => {
        if (!open) {
          setUnreadCount((count) => count + 1);
        }
        return open;
      });
    };

    const onChatError = ({ message }) => {
      setErrorMessage(message);
    };

    const onActiveRoomsUpdated = (roomsList) => {
      setActiveRooms(roomsList || []);
    };

    const onPeerYouTubeUpdated = ({ socketId: peerId, mediaState }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === peerId ? { ...p, mediaState } : p))
      );

      // If the current user is watching this peer's stream, follow to the new video!
      setActiveVideo((current) => {
        if (!current || current.isBroadcaster || current.broadcasterId !== peerId) {
          return current;
        }

        if (!mediaState || !mediaState.videoId) {
          return null;
        }

        const elapsed = mediaState.isPlaying
          ? (Date.now() - (mediaState.updatedAt || Date.now())) / 1000
          : 0;
        const currentPartTime = (Number(mediaState.currentTime) || 0) + elapsed;

        return {
          videoId: mediaState.videoId,
          title: mediaState.title || current.title,
          broadcasterId: peerId,
          isBroadcaster: false,
          initialTime: currentPartTime,
          initialIsPlaying: mediaState.isPlaying
        };
      });
    };

    const onPeerYouTubeAction = ({ broadcasterId, action, videoId, title, currentTime }) => {
      if (action === 'change-video' && videoId) {
        setActiveVideo((current) => {
          if (current && !current.isBroadcaster && current.broadcasterId === broadcasterId) {
            return {
              videoId,
              title: title || 'YouTube Video',
              broadcasterId,
              isBroadcaster: false,
              initialTime: Number(currentTime) || 0,
              initialIsPlaying: true
            };
          }
          return current;
        });
      }
    };

    const onPeerYouTubeStopped = ({ socketId: peerId }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === peerId ? { ...p, mediaState: null } : p))
      );
      setActiveVideo((current) => {
        if (current && current.broadcasterId === peerId) {
          return null;
        }
        return current;
      });
    };

    socket.on('connect', onConnect);
    socket.on('room-created', onRoomCreated);
    socket.on('room-joined', onRoomJoined);
    socket.on('join-error', onJoinError);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('owner-updated', onOwnerUpdated);
    socket.on('room-settings-updated', onRoomSettingsUpdated);
    socket.on('user-muted', onUserMuted);
    socket.on('user-audio-state-changed', onUserAudioStateChanged);
    socket.on('new-message', onNewMessage);
    socket.on('chat-error', onChatError);
    socket.on('active-rooms-updated', onActiveRoomsUpdated);
    socket.on('peer-youtube-updated', onPeerYouTubeUpdated);
    socket.on('peer-youtube-action', onPeerYouTubeAction);
    socket.on('peer-youtube-stopped', onPeerYouTubeStopped);

    // Initial fetch of active rooms
    socket.emit('get-active-rooms', (res) => {
      if (res && res.rooms) {
        setActiveRooms(res.rooms);
      }
    });

    if (socket.connected) {
      setCurrentSocketId(socket.id);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('room-created', onRoomCreated);
      socket.off('room-joined', onRoomJoined);
      socket.off('join-error', onJoinError);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('owner-updated', onOwnerUpdated);
      socket.off('room-settings-updated', onRoomSettingsUpdated);
      socket.off('user-muted', onUserMuted);
      socket.off('user-audio-state-changed', onUserAudioStateChanged);
      socket.off('new-message', onNewMessage);
      socket.off('chat-error', onChatError);
      socket.off('active-rooms-updated', onActiveRoomsUpdated);
      socket.off('peer-youtube-updated', onPeerYouTubeUpdated);
      socket.off('peer-youtube-action', onPeerYouTubeAction);
      socket.off('peer-youtube-stopped', onPeerYouTubeStopped);
    };
  }, [initLocalStream, setMutedForcefully]);

  // Broadcaster name for active YouTube video
  const activeBroadcasterName = useMemo(() => {
    if (!activeVideo) return '';
    if (activeVideo.isBroadcaster) return 'You';
    const peer = participants.find((p) => p.socketId === activeVideo.broadcasterId);
    return peer?.username || 'Peer';
  }, [activeVideo, participants]);

  // YouTube Watch Together Handlers
  const handleStartYouTubeVideo = ({ videoId, title }) => {
    setIsPlayerMinimized(false);
    setActiveVideo({
      videoId,
      title,
      broadcasterId: currentSocketId,
      isBroadcaster: true,
      initialTime: 0,
      initialIsPlaying: true
    });
  };

  const handleTuneInYouTube = (peer) => {
    if (!peer.mediaState) return;

    // Calculate synchronized position factoring in elapsed time if playing
    const elapsed = peer.mediaState.isPlaying
      ? (Date.now() - (peer.mediaState.updatedAt || Date.now())) / 1000
      : 0;
    const currentPartTime = (Number(peer.mediaState.currentTime) || 0) + elapsed;

    setIsPlayerMinimized(false);
    setActiveVideo({
      videoId: peer.mediaState.videoId,
      title: peer.mediaState.title,
      broadcasterId: peer.socketId,
      isBroadcaster: false,
      initialTime: currentPartTime,
      initialIsPlaying: peer.mediaState.isPlaying
    });
  };

  const handleCloseYouTube = () => {
    setIsPlayerMinimized(false);
    if (activeVideo?.isBroadcaster) {
      const socket = getSocket();
      if (socket && socket.connected && roomId) {
        socket.emit('stop-youtube', { roomId });
      }
    }
    setActiveVideo(null);
  };

  // Create room action
  const handleCreateRoom = ({ username, maxParticipants }) => {
    setIsLoading(true);
    setErrorMessage('');
    const socket = connectSocket();
    const browserId = getBrowserId();

    socket.emit(
      'create-room',
      { username, maxParticipants, browserId },
      (response) => {
        if (response && !response.success) {
          setIsLoading(false);
          setErrorMessage(response.error || 'Failed to create room');
        }
      }
    );
  };

  // Join room action
  const handleJoinRoom = ({ roomId: targetRoomId, username }) => {
    setIsLoading(true);
    setErrorMessage('');
    const socket = connectSocket();
    const browserId = getBrowserId();

    socket.emit(
      'join-room',
      { roomId: targetRoomId, username, browserId },
      (response) => {
        if (response && !response.success) {
          setIsLoading(false);
          setErrorMessage(response.error || 'Failed to join room');
        }
      }
    );
  };

  // Send message action
  const handleSendMessage = (text) => {
    const socket = getSocket();
    if (!socket || !socket.connected || !roomId) return;
    socket.emit('send-message', { roomId, text });
  };

  // Moderation: Kick user
  const handleKickUser = (targetId) => {
    const socket = getSocket();
    if (!socket || !socket.connected || !roomId) return;
    socket.emit('kick-user', { roomId, targetId });
  };

  // Moderation: Update room settings
  const handleUpdateRoomSettings = (newSettings) => {
    const socket = getSocket();
    if (!socket || !socket.connected || !roomId) return;
    socket.emit('update-room-settings', { roomId, ...newSettings });
  };

  // Moderation: Mute speaking
  const handleToggleMuteSpeaking = (targetId, muteSpeaking) => {
    const socket = getSocket();
    if (!socket || !socket.connected || !roomId) return;
    socket.emit('mute-user', { roomId, targetId, muteSpeaking });
  };

  // Moderation: Mute chat
  const handleToggleMuteChat = (targetId, muteChat) => {
    const socket = getSocket();
    if (!socket || !socket.connected || !roomId) return;
    socket.emit('mute-user', { roomId, targetId, muteChat });
  };

  // Copy share invite link
  const handleCopyInvite = () => {
    const url = `${window.location.origin}/?room=${encodeURIComponent(roomId)}`;
    navigator.clipboard.writeText(url).then(() => {
      // transient feedback
    });
  };

  const handleToggleChat = () => {
    setIsChatOpen((prev) => {
      if (!prev) {
        setUnreadCount(0);
      }
      return !prev;
    });
  };

  // If not in a room, render Lobby
  if (!inRoom) {
    return (
      <Lobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        activeRooms={activeRooms}
        initialRoomId={initialRoomId}
        isLoading={isLoading}
        error={errorMessage}
      />
    );
  }

  const isSpeakingDisabled =
    roomSettings?.allowSpeaking === false || currentParticipant?.isMutedByHost === true;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <RoomHeader
        roomId={roomId}
        participantCount={participants.length}
        maxParticipants={roomSettings?.maxParticipants || 10}
        roomSettings={roomSettings}
        isOwner={isOwner}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLeaveRoom={() => handleLeaveRoom(true)}
      />

      {/* Center Main Stage (Dynamic Theater Mode / Standard Centered Grid) */}
      <main className="flex-1 flex flex-col relative z-10 pb-24 px-3 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto transition-all duration-500 ease-in-out">
        {errorMessage && (
          <div className="max-w-md mx-auto my-2 px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage('')}
              className="ml-3 font-bold hover:text-white"
            >
              &times;
            </button>
          </div>
        )}

        {/* Dynamic Studio Layout: Option 2 Studio Watch Party vs. Standard Centered Grid */}
        {activeVideo && !isPlayerMinimized ? (
          <WatchPartyStudio
            participants={participants}
            currentUserId={currentSocketId}
            isOwner={isOwner}
            isSpeakingLocal={isSpeakingLocal}
            speakingPeers={speakingPeers}
            isLocalMuted={isMuted}
            maxParticipants={roomSettings?.maxParticipants || 10}
            onKick={handleKickUser}
            onToggleMuteSpeaking={handleToggleMuteSpeaking}
            onToggleMuteChat={handleToggleMuteChat}
            onCopyInvite={handleCopyInvite}
            onTuneInYouTube={handleTuneInYouTube}
            activeVideo={activeVideo}
            broadcasterName={activeBroadcasterName}
            onCloseYouTube={handleCloseYouTube}
            onToggleMinimize={() => setIsPlayerMinimized(true)}
            socket={getSocket()}
            roomId={roomId}
            messages={messages}
            onSendMessage={handleSendMessage}
            ownerSocketId={roomSettings?.ownerSocketId}
            isChatAllowed={roomSettings?.allowChat ?? true}
            isUserChatMuted={currentParticipant?.isChatMuted ?? false}
          />
        ) : (
          /* Normal State: Centered Full-Width Grid */
          <div className="flex-1 flex flex-col justify-center transition-all duration-500 ease-in-out">
            <ParticipantGrid
              participants={participants}
              currentUserId={currentSocketId}
              isOwner={isOwner}
              isSpeakingLocal={isSpeakingLocal}
              speakingPeers={speakingPeers}
              isLocalMuted={isMuted}
              maxParticipants={roomSettings?.maxParticipants || 10}
              onKick={handleKickUser}
              onToggleMuteSpeaking={handleToggleMuteSpeaking}
              onToggleMuteChat={handleToggleMuteChat}
              onCopyInvite={handleCopyInvite}
              onTuneInYouTube={handleTuneInYouTube}
              activeBroadcasterId={activeVideo?.broadcasterId}
              compact={false}
            />

            {/* If video is minimized, render as floating PiP card in the corner */}
            {activeVideo && isPlayerMinimized && (
              <YouTubePlayerCard
                activeVideo={activeVideo}
                broadcasterName={activeBroadcasterName}
                onClose={handleCloseYouTube}
                socket={getSocket()}
                roomId={roomId}
                isMinimized={true}
                onToggleMinimize={() => setIsPlayerMinimized(false)}
                embedded={false}
              />
            )}
          </div>
        )}
      </main>

      {/* Ephemeral Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUserId={currentSocketId}
        ownerSocketId={roomSettings?.ownerSocketId}
        isChatAllowed={roomSettings?.allowChat ?? true}
        isUserChatMuted={currentParticipant?.isChatMuted ?? false}
      />

      {/* Fixed Bottom Controls Bar */}
      <ControlsBar
        isMuted={isMuted}
        onToggleMute={toggleMute}
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={switchAudioDevice}
        isChatOpen={isChatOpen}
        onToggleChat={handleToggleChat}
        unreadCount={unreadCount}
        isOwner={isOwner}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLeaveRoom={() => handleLeaveRoom(true)}
        isSpeakingLocal={isSpeakingLocal}
        isSpeakingDisabled={isSpeakingDisabled}
        onOpenYouTube={() => setIsYouTubeModalOpen(true)}
        hasActiveYouTube={Boolean(activeVideo)}
      />

      {/* Room Host Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        roomSettings={roomSettings}
        participants={participants}
        currentUserId={currentSocketId}
        onUpdateSettings={handleUpdateRoomSettings}
        onKick={handleKickUser}
        onToggleMuteSpeaking={handleToggleMuteSpeaking}
        onToggleMuteChat={handleToggleMuteChat}
      />

      {/* YouTube Watch Together Modal */}
      <YouTubeModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        onSelectVideo={handleStartYouTubeVideo}
        socket={getSocket()}
      />

      {/* Audio Element stream attachments (hidden) */}
      <AudioStreamsContainer audioStreams={audioStreams} />
    </div>
  );
}
