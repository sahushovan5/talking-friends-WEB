import React, { useEffect, useRef } from 'react';

/**
 * Single peer audio player with automatic track binding
 */
function RemoteAudioPlayer({ peerId, stream }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current
        .play()
        .catch((err) => {
          console.warn(`[Audio playback] Autoplay blocked for peer ${peerId}:`, err);
        });
    }
  }, [peerId, stream]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      data-peer-id={peerId}
      style={{ display: 'none' }}
    />
  );
}

/**
 * Container component that maintains DOM <audio> elements for each peer stream
 */
export function AudioStreamsContainer({ audioStreams }) {
  const entries = Object.entries(audioStreams || {});

  if (entries.length === 0) return null;

  return (
    <div className="hidden" aria-hidden="true">
      {entries.map(([peerId, stream]) => (
        <RemoteAudioPlayer key={peerId} peerId={peerId} stream={stream} />
      ))}
    </div>
  );
}
