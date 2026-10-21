import React, { useState, useEffect, useMemo } from 'react';
import {
  Radio,
  Users,
  Mic,
  MicOff,
  Zap,
  ArrowRight,
  Sparkles,
  Lock,
  Volume2,
  VolumeX,
  MessageSquare,
  MessageSquareOff,
  Plus,
  Hash,
  Search,
  RefreshCw,
  X,
  User,
  Crown,
  Check,
  AlertCircle
} from 'lucide-react';
import { getSocket } from '../services/socket';

// Helper for consistent avatar gradient
function getAvatarGradient(name = '') {
  const gradients = [
    'from-indigo-600 to-purple-600',
    'from-blue-600 to-cyan-600',
    'from-emerald-600 to-teal-600',
    'from-rose-600 to-pink-600',
    'from-amber-600 to-orange-600',
    'from-violet-600 to-fuchsia-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export function Lobby({
  onCreateRoom,
  onJoinRoom,
  activeRooms = [],
  initialRoomId = '',
  isLoading = false,
  error = ''
}) {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('echomesh_username') || `User_${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);

  // Modal states: 'create' | 'join-id' | 'quick-join' | null
  const [modalType, setModalType] = useState(initialRoomId ? 'join-id' : null);
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);
  const [createMaxParticipants, setCreateMaxParticipants] = useState(6);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (initialRoomId) {
      setSelectedRoomId(initialRoomId);
      setModalType('join-id');
    }
  }, [initialRoomId]);

  const handleSaveUsername = () => {
    const trimmed = tempUsername.trim();
    if (!trimmed) return;
    setUsername(trimmed);
    setIsEditingUsername(false);
    try {
      localStorage.setItem('echomesh_username', trimmed);
    } catch (e) {
      // ignore
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('get-active-rooms');
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Filtered rooms based on search
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return activeRooms;
    const q = searchQuery.toLowerCase().trim();
    return activeRooms.filter((r) => {
      if (r.id.toLowerCase().includes(q)) return true;
      if (r.participants && r.participants.some((p) => p.username.toLowerCase().includes(q))) {
        return true;
      }
      return false;
    });
  }, [activeRooms, searchQuery]);

  // Click on a room card "Join"
  const handleCardJoinClick = (room) => {
    if (room.isFull) return;
    if (username.trim()) {
      onJoinRoom({ roomId: room.id, username: username.trim() });
    } else {
      setSelectedRoomId(room.id);
      setModalType('quick-join');
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || isLoading) return;
    onCreateRoom({ username: username.trim(), maxParticipants: createMaxParticipants });
    setModalType(null);
  };

  const handleJoinByIdSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !selectedRoomId.trim() || isLoading) return;
    onJoinRoom({ roomId: selectedRoomId.trim(), username: username.trim() });
    setModalType(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-mesh-pattern flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative">
      {/* Background glowing orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-4 relative z-10 border-b border-slate-800/60 pb-5">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-xl shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                EchoMesh
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                Audio Mesh
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Ephemeral Voice Rooms &bull; Zero Persistence
            </p>
          </div>
        </div>

        {/* User Profile Pill & Quick Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* User Display Name Chip */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-inner">
            <div className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${getAvatarGradient(username)} flex items-center justify-center text-white text-[11px] font-bold`}>
              {username ? username[0].toUpperCase() : 'U'}
            </div>
            {isEditingUsername ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  maxLength={24}
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                  className="w-28 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  onClick={handleSaveUsername}
                  className="p-1 hover:text-emerald-400 text-slate-400 transition-colors"
                  title="Save name"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-200 max-w-[120px] truncate" title={username}>
                  {username}
                </span>
                <button
                  onClick={() => {
                    setTempUsername(username);
                    setIsEditingUsername(true);
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-medium ml-1"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Join by ID button */}
          <button
            onClick={() => setModalType('join-id')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-semibold transition-all active:scale-95 shadow-sm"
          >
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Join by ID</span>
          </button>

          {/* Create Room Button */}
          <button
            onClick={() => setModalType('create')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Room</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto my-6 flex-1 flex flex-col relative z-10">
        {/* Banner Alert for Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Directory Bar: Live count, search and refresh */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Active Rooms
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                {activeRooms.length} Active
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Live P2P Mesh</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search room ID or peer..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              className={`p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all ${
                isRefreshing ? 'rotate-180 duration-500' : ''
              }`}
              title="Refresh active rooms"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Room Grid or Empty State */}
        {filteredRooms.length === 0 ? (
          <div className="flex-1 min-h-[360px] glass-panel rounded-2xl border border-slate-800/80 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/10">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              {searchQuery ? 'No matching rooms found' : 'No active voice rooms right now'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
              {searchQuery
                ? `No room or participant matches "${searchQuery}". Try a different search or clear the filter.`
                : 'All rooms in EchoMesh are strictly ephemeral. Start the first room now and invite your friends!'}
            </p>

            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
              >
                Clear Search Filter
              </button>
            ) : (
              <button
                onClick={() => setModalType('create')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 group"
              >
                <Plus className="w-4 h-4" />
                <span>Create a Voice Room</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredRooms.map((room) => {
              const host = room.participants.find((p) => p.isOwner) || room.participants[0];
              const isFull = room.isFull;

              return (
                <div
                  key={room.id}
                  className="glass-card rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 p-5 flex flex-col justify-between transition-all duration-200 group shadow-lg hover:shadow-indigo-500/5 relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Top row: Room ID & Capacity Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-mono text-sm font-bold text-white tracking-wide truncate">
                          {room.id}
                        </span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          isFull
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        <span>
                          {room.participantCount}/{room.maxParticipants}
                        </span>
                        <span className="text-[10px] font-normal uppercase ml-0.5">
                          {isFull ? 'Full' : 'Open'}
                        </span>
                      </div>
                    </div>

                    {/* Host Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                      <span>Host:</span>
                      <span className="font-semibold text-slate-200 truncate">
                        {host?.username || 'Host'}
                      </span>
                    </div>

                    {/* Capabilities Badges */}
                    <div className="flex items-center gap-2 pt-1">
                      <div
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          room.allowSpeaking
                            ? 'bg-slate-900 border-slate-800 text-slate-300'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}
                        title={room.allowSpeaking ? 'Speaking enabled' : 'Speaking muted by host'}
                      >
                        {room.allowSpeaking ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3" />}
                        <span>{room.allowSpeaking ? 'Voice Open' : 'Voice Off'}</span>
                      </div>

                      <div
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          room.allowChat
                            ? 'bg-slate-900 border-slate-800 text-slate-300'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}
                        title={room.allowChat ? 'Live chat enabled' : 'Live chat disabled'}
                      >
                        {room.allowChat ? <MessageSquare className="w-3 h-3 text-indigo-400" /> : <MessageSquareOff className="w-3 h-3" />}
                        <span>{room.allowChat ? 'Chat Active' : 'Chat Off'}</span>
                      </div>
                    </div>

                    {/* Participants List / Avatars */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        In Room ({room.participants.length})
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 max-h-16 overflow-y-auto">
                        {room.participants.map((p) => (
                          <div
                            key={p.socketId}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300"
                            title={p.username}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${getAvatarGradient(p.username)} flex items-center justify-center text-[9px] font-bold text-white`}>
                              {p.username[0].toUpperCase()}
                            </div>
                            <span className="font-medium max-w-[100px] truncate">
                              {p.username}
                            </span>
                            {p.isOwner && (
                              <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400 ml-0.5" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Join Action Button */}
                  <div className="pt-4 mt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => handleCardJoinClick(room)}
                      disabled={isFull || isLoading}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        isFull
                          ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-98 text-white shadow-md shadow-emerald-600/20 group'
                      }`}
                    >
                      {isFull ? (
                        <span>Room Full</span>
                      ) : (
                        <>
                          <span>Join Voice Room</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl w-full mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-3">
        <div>
          EchoMesh &bull; Strictly Modern JavaScript ES Modules &bull; Audio-Only WebRTC Mesh
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3 h-3 text-emerald-400" /> Zero Persistence
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Zap className="w-3 h-3 text-indigo-400" /> Real-Time Mesh
          </span>
        </div>
      </footer>

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 1: Create Room Modal                                           */}
      {/* --------------------------------------------------------------------- */}
      {modalType === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Voice Room</h3>
                  <p className="text-xs text-slate-400">Launch an ephemeral WebRTC space</p>
                </div>
              </div>

              <button
                onClick={() => setModalType(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    try {
                      localStorage.setItem('echomesh_username', e.target.value);
                    } catch (err) {}
                  }}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Room Capacity
                  </label>
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-800">
                    {createMaxParticipants} {createMaxParticipants === 1 ? 'Peer (Solo)' : 'Peers'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={createMaxParticipants}
                  onChange={(e) => setCreateMaxParticipants(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>1 (Solo)</span>
                  <span>2 (Duo)</span>
                  <span>6 (Squad)</span>
                  <span>10 (Max)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !username.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create & Launch Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 2: Join by Room ID Modal                                        */}
      {/* --------------------------------------------------------------------- */}
      {modalType === 'join-id' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Join by Room ID</h3>
                  <p className="text-xs text-slate-400">Connect to a private or unlisted room</p>
                </div>
              </div>

              <button
                onClick={() => setModalType(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinByIdSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  required
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  placeholder="e.g. echo-xyz123"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
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
                  onChange={(e) => {
                    setUsername(e.target.value);
                    try {
                      localStorage.setItem('echomesh_username', e.target.value);
                    } catch (err) {}
                  }}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !username.trim() || !selectedRoomId.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Join Voice Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 3: Quick Join Prompt (when clicking card without username)      */}
      {/* --------------------------------------------------------------------- */}
      {modalType === 'quick-join' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Join Room: {selectedRoomId}</h3>
              <button
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleJoinByIdSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Enter Your Display Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    try {
                      localStorage.setItem('echomesh_username', e.target.value);
                    } catch (err) {}
                  }}
                  placeholder="Your nickname..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !username.trim()}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Enter Room Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
