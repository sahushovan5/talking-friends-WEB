import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../services/socket';

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' }
];

/**
 * Custom hook to manage WebRTC Audio Mesh, Peer Connections,
 * AudioContext Analysers for speaking detection, and microphone devices.
 */
export function useWebRTC({ roomId, isRoomActive, currentUserId, onKicked }) {
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(true); // Default to muted upon joining
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);
  const [speakingPeers, setSpeakingPeers] = useState({}); // { [peerId]: boolean }
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [audioStreams, setAudioStreams] = useState({}); // { [peerId]: MediaStream }

  // Map of peer connections: Map<peerSocketId, { connection: RTCPeerConnection, candidateQueue: [] }>
  const peersRef = useRef(new Map());
  // Map of peer AudioContext analysers: Map<peerSocketId, { analyser: AnalyserNode, source: MediaStreamAudioSourceNode }>
  const peerAnalysersRef = useRef(new Map());
  // AudioContext reference
  const audioContextRef = useRef(null);
  const localAnalyserRef = useRef(null);
  const localSourceRef = useRef(null);
  const animFrameRef = useRef(null);
  const localStreamRef = useRef(null);
  const isMutedRef = useRef(true); // Default to muted upon joining

  // Keep ref updated
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Initialize or resume shared AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch((err) => console.warn('AudioContext resume failed:', err));
    }
    return audioContextRef.current;
  }, []);

  // Fetch available microphone devices
  const refreshAudioDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter((device) => device.kind === 'audioinput');
      setAudioDevices(mics);
      if (mics.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(mics[0].deviceId);
      }
    } catch (err) {
      console.warn('Could not enumerate audio devices:', err);
    }
  }, [selectedDeviceId]);

  // Set up local microphone stream
  const initLocalStream = useCallback(
    async (deviceId) => {
      try {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        const audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        };

        if (deviceId) {
          audioConstraints.deviceId = { exact: deviceId };
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: false
        });

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Apply current mute state
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMutedRef.current;
        });

        // Set up Web Audio Analyser for local mic
        const ctx = getAudioContext();
        if (ctx) {
          if (localSourceRef.current) {
            try {
              localSourceRef.current.disconnect();
            } catch (e) {
              // ignore
            }
          }
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.4;
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);

          localAnalyserRef.current = analyser;
          localSourceRef.current = source;
        }

        await refreshAudioDevices();
        return stream;
      } catch (err) {
        console.error('Failed to get user media (microphone):', err);
        throw err;
      }
    },
    [getAudioContext, refreshAudioDevices]
  );

  // Switch microphone device dynamically
  const switchAudioDevice = useCallback(
    async (newDeviceId) => {
      try {
        setSelectedDeviceId(newDeviceId);
        const newStream = await initLocalStream(newDeviceId);
        const newTrack = newStream.getAudioTracks()[0];

        if (!newTrack) return;

        // Replace track on all existing peer connections
        peersRef.current.forEach(({ connection }) => {
          const sender = connection.getSenders().find((s) => s.track && s.track.kind === 'audio');
          if (sender) {
            sender.replaceTrack(newTrack).catch((err) => {
              console.error('Failed to replace track on peer connection:', err);
            });
          }
        });
      } catch (err) {
        console.error('Error switching microphone device:', err);
      }
    },
    [initLocalStream]
  );

  // Toggle local mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }

      // Notify socket server
      const socket = getSocket();
      if (socket && socket.connected && roomId) {
        socket.emit('toggle-audio-state', { roomId, isMuted: next });
      }

      return next;
    });
  }, [roomId]);

  // Set mute forcefully (e.g. by host moderation)
  const setMutedForcefully = useCallback(
    (mutedState) => {
      setIsMuted(mutedState);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !mutedState;
        });
      }
      const socket = getSocket();
      if (socket && socket.connected && roomId) {
        socket.emit('toggle-audio-state', { roomId, isMuted: mutedState });
      }
    },
    [roomId]
  );

  // Remove a peer connection & clean up audio/analysers
  const removePeer = useCallback((peerId) => {
    const peerData = peersRef.current.get(peerId);
    if (peerData) {
      try {
        peerData.connection.ontrack = null;
        peerData.connection.onicecandidate = null;
        peerData.connection.close();
      } catch (e) {
        // ignore
      }
      peersRef.current.delete(peerId);
    }

    // Clean up peer audio analyser
    const analyserData = peerAnalysersRef.current.get(peerId);
    if (analyserData) {
      try {
        analyserData.source.disconnect();
      } catch (e) {
        // ignore
      }
      peerAnalysersRef.current.delete(peerId);
    }

    setAudioStreams((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });

    setSpeakingPeers((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  // Create an RTCPeerConnection for a target peer
  const createPeerConnection = useCallback(
    (peerId) => {
      const socket = getSocket();
      const pc = new RTCPeerConnection({
        iceServers: DEFAULT_ICE_SERVERS
      });

      const peerData = {
        connection: pc,
        candidateQueue: []
      };
      peersRef.current.set(peerId, peerData);

      // Add local audio tracks
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && socket.connected) {
          socket.emit('signal-ice-candidate', {
            targetId: peerId,
            candidate: event.candidate
          });
        }
      };

      // Handle incoming remote audio track
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (!remoteStream) return;

        setAudioStreams((prev) => ({
          ...prev,
          [peerId]: remoteStream
        }));

        // Attach to Web Audio API for peer speaking detection
        const ctx = getAudioContext();
        if (ctx) {
          try {
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.4;
            const source = ctx.createMediaStreamSource(remoteStream);
            source.connect(analyser);

            peerAnalysersRef.current.set(peerId, { analyser, source });
          } catch (err) {
            console.warn(`Could not attach analyser for peer ${peerId}:`, err);
          }
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          removePeer(peerId);
        }
      };

      return pc;
    },
    [getAudioContext, removePeer]
  );

  // Setup loop to detect speaking for local and remote peers
  useEffect(() => {
    let isRunning = true;
    const dataArray = new Uint8Array(128);

    const checkAudioLevels = () => {
      if (!isRunning) return;

      // 1. Check local speaking
      if (localAnalyserRef.current && !isMutedRef.current) {
        localAnalyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Speaking threshold
        setIsSpeakingLocal(avg > 14);
      } else {
        setIsSpeakingLocal(false);
      }

      // 2. Check remote peers speaking
      const nextSpeaking = {};
      peerAnalysersRef.current.forEach(({ analyser }, peerId) => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        if (avg > 14) {
          nextSpeaking[peerId] = true;
        }
      });

      setSpeakingPeers(nextSpeaking);

      animFrameRef.current = requestAnimationFrame(checkAudioLevels);
    };

    animFrameRef.current = requestAnimationFrame(checkAudioLevels);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Socket signaling event bindings
  useEffect(() => {
    if (!isRoomActive) return;

    const socket = getSocket();
    if (!socket) return;

    // 1. User Joined -> We are existing peer; initiate offer to newcomer
    const handleUserJoined = async ({ socketId: newcomerId }) => {
      if (!newcomerId || newcomerId === socket.id) return;
      console.log(`[WebRTC] Peer joined room: ${newcomerId}. Initiating offer.`);

      try {
        const pc = createPeerConnection(newcomerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('signal-offer', {
          targetId: newcomerId,
          sdp: pc.localDescription
        });
      } catch (err) {
        console.error(`[WebRTC] Failed to create offer for ${newcomerId}:`, err);
      }
    };

    // 2. Signal Offer -> We are newcomer; create answer
    const handleSignalOffer = async ({ callerId, sdp }) => {
      if (!callerId || !sdp) return;
      console.log(`[WebRTC] Received offer from ${callerId}. Creating answer.`);

      try {
        let peerData = peersRef.current.get(callerId);
        let pc = peerData ? peerData.connection : null;

        if (!pc) {
          pc = createPeerConnection(callerId);
          peerData = peersRef.current.get(callerId);
        }

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        // Process any queued ICE candidates
        if (peerData && peerData.candidateQueue.length > 0) {
          for (const cand of peerData.candidateQueue) {
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch((e) => console.warn(e));
          }
          peerData.candidateQueue = [];
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('signal-answer', {
          targetId: callerId,
          sdp: pc.localDescription
        });
      } catch (err) {
        console.error(`[WebRTC] Failed to handle offer from ${callerId}:`, err);
      }
    };

    // 3. Signal Answer -> Existing peer receives answer from newcomer
    const handleSignalAnswer = async ({ callerId, sdp }) => {
      if (!callerId || !sdp) return;
      console.log(`[WebRTC] Received answer from ${callerId}.`);

      try {
        const peerData = peersRef.current.get(callerId);
        if (peerData && peerData.connection) {
          await peerData.connection.setRemoteDescription(new RTCSessionDescription(sdp));

          // Process any queued ICE candidates
          if (peerData.candidateQueue.length > 0) {
            for (const cand of peerData.candidateQueue) {
              await peerData.connection.addIceCandidate(new RTCIceCandidate(cand)).catch((e) => console.warn(e));
            }
            peerData.candidateQueue = [];
          }
        }
      } catch (err) {
        console.error(`[WebRTC] Failed to handle answer from ${callerId}:`, err);
      }
    };

    // 4. Signal ICE Candidate -> Add ICE candidate or queue if remote description isn't ready
    const handleSignalIceCandidate = async ({ callerId, candidate }) => {
      if (!callerId || !candidate) return;

      const peerData = peersRef.current.get(callerId);
      if (!peerData || !peerData.connection) return;

      const pc = peerData.connection;

      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn(`[WebRTC] Error adding ICE candidate from ${callerId}:`, err);
        }
      } else {
        // Queue until remote description is set
        peerData.candidateQueue.push(candidate);
      }
    };

    // 5. User Left -> Close and cleanup peer
    const handleUserLeft = ({ socketId }) => {
      if (!socketId) return;
      console.log(`[WebRTC] User left: ${socketId}`);
      removePeer(socketId);
    };

    // 6. Kicked event
    const handleKicked = (data) => {
      console.warn('[WebRTC] You have been kicked:', data);
      if (typeof onKicked === 'function') {
        onKicked(data?.reason || 'You have been kicked by the host.');
      }
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('signal-offer', handleSignalOffer);
    socket.on('signal-answer', handleSignalAnswer);
    socket.on('signal-ice-candidate', handleSignalIceCandidate);
    socket.on('user-left', handleUserLeft);
    socket.on('kicked', handleKicked);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('signal-offer', handleSignalOffer);
      socket.off('signal-answer', handleSignalAnswer);
      socket.off('signal-ice-candidate', handleSignalIceCandidate);
      socket.off('user-left', handleUserLeft);
      socket.off('kicked', handleKicked);
    };
  }, [isRoomActive, createPeerConnection, removePeer, onKicked]);

  // Cleanup on room exit or unmount
  const cleanup = useCallback(() => {
    // Close all peer connections
    peersRef.current.forEach((peerData) => {
      try {
        peerData.connection.ontrack = null;
        peerData.connection.onicecandidate = null;
        peerData.connection.close();
      } catch (e) {
        // ignore
      }
    });
    peersRef.current.clear();

    // Disconnect peer analysers
    peerAnalysersRef.current.forEach(({ source }) => {
      try {
        source.disconnect();
      } catch (e) {
        // ignore
      }
    });
    peerAnalysersRef.current.clear();

    // Stop local media stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // Disconnect local analyser
    if (localSourceRef.current) {
      try {
        localSourceRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      localSourceRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch((e) => console.warn(e));
      audioContextRef.current = null;
    }

    setAudioStreams({});
    setSpeakingPeers({});
    setIsSpeakingLocal(false);
    setIsMuted(true);
    isMutedRef.current = true;
  }, []);

  return {
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
    cleanup
  };
}
