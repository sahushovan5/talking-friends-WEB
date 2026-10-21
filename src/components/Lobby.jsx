import React, { useState, useEffect } from 'react';
import {
  Radio,
  Users,
  Mic,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Wifi,
  Lock,
  Volume2
} from 'lucide-react';

export function Lobby({
  onCreateRoom,
  onJoinRoom,
  initialRoomId = '',
  isLoading = false,
  error = ''
}) {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('echomesh_username') || `User_${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [maxParticipants, setMaxParticipants] = useState(6);
  const [joinRoomId, setJoinRoomId] = useState(initialRoomId);
  const [activeTab, setActiveTab] = useState(initialRoomId ? 'join' : 'create');

  useEffect(() => {
    if (initialRoomId) {
      setJoinRoomId(initialRoomId);
      setActiveTab('join');
    }
  }, [initialRoomId]);

  const handleUsernameChange = (val) => {
    setUsername(val);
    try {
      localStorage.setItem('echomesh_username', val);
    } catch (e) {
      // ignore
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || isLoading) return;
    onCreateRoom({ username: username.trim(), maxParticipants });
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !joinRoomId.trim() || isLoading) return;
    onJoinRoom({ roomId: joinRoomId.trim(), username: username.trim() });
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-mesh-pattern flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar / Branding */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              EchoMesh
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Raw WebRTC P2P Voice & Chat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Zero-Persistence Mode</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto my-auto py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ephemeral Multi-User Voice Mesh</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            Pure Voice, <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">Zero Traces</span>.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            High-fidelity peer-to-peer audio mesh network. No database, no recordings, no message persistence.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="max-w-md mx-auto mb-6 p-1 rounded-xl bg-slate-900 border border-slate-800 flex">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'join'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Join Room
          </button>
        </div>

        {/* Card Forms */}
        <div className="max-w-md mx-auto glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {activeTab === 'create' ? (
            <form onSubmit={handleCreateSubmit} className="space-y-5 relative">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Room Capacity
                  </label>
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800">
                    {maxParticipants} Peers
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>2 (Duo)</span>
                  <span>6 (Squad)</span>
                  <span>10 (Max Mesh)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !username.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.99] text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create & Launch Room</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-5 relative">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  required
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="e.g. echo-xyz123"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !username.trim() || !joinRoomId.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.99] text-white font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Join Voice Room</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Technical Highlights Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-10">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
            <Mic className="w-4 h-4 text-indigo-400 mx-auto mb-1.5" />
            <div className="text-xs font-semibold text-slate-200">Audio-Only Mesh</div>
            <div className="text-[11px] text-slate-500">Ultra-low latency</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
            <Lock className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
            <div className="text-xs font-semibold text-slate-200">Zero Persistence</div>
            <div className="text-[11px] text-slate-500">No database footprint</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
            <Volume2 className="w-4 h-4 text-sky-400 mx-auto mb-1.5" />
            <div className="text-xs font-semibold text-slate-200">Audio Analysers</div>
            <div className="text-[11px] text-slate-500">Live speaker ring</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1.5" />
            <div className="text-xs font-semibold text-slate-200">Decoupled API</div>
            <div className="text-[11px] text-slate-500">Web & Native ready</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-600 font-medium">
        EchoMesh &bull; Strict JavaScript ES Modules &bull; Raw WebRTC Peer-to-Peer
      </footer>
    </div>
  );
}
