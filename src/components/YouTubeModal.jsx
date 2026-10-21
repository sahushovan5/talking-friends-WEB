import React, { useState } from 'react';
import {
  X,
  Play,
  Search,
  Youtube,
  Radio,
  Sparkles,
  Link as LinkIcon,
  AlertCircle
} from 'lucide-react';
import { extractYouTubeVideoId, SUGGESTED_VIDEOS } from '../utils/youtube';

export function YouTubeModal({ isOpen, onClose, onSelectVideo }) {
  if (!isOpen) return null;

  const [urlInput, setUrlInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    setError('');

    const videoId = extractYouTubeVideoId(urlInput);
    if (!videoId) {
      setError('Invalid YouTube link or ID. Please check the URL format.');
      return;
    }

    onSelectVideo({
      videoId,
      title: 'Custom YouTube Video',
      channel: 'YouTube'
    });
    onClose();
  };

  const handleSelectSuggested = (video) => {
    onSelectVideo({
      videoId: video.id,
      title: video.title,
      channel: video.channel
    });
    onClose();
  };

  const filteredSuggested = SUGGESTED_VIDEOS.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q) || v.category.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl glass-panel rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-500 flex items-center justify-center">
              <Youtube className="w-5 h-5 fill-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Watch YouTube Together</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                  Free4Talk Sync
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Stream videos in real-time sync with everyone in the room
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Custom URL Input Bar */}
          <form onSubmit={handleCustomSubmit} className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-red-400" />
              <span>Paste YouTube Link or Video ID</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setError('');
                }}
                placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
              <button
                type="submit"
                disabled={!urlInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play</span>
              </button>
            </div>

            {error && (
              <div className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Or Choose Suggested Streams
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Search Bar for Suggested */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter suggested videos by title or genre..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Suggested Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {filteredSuggested.map((video) => (
              <div
                key={video.id}
                onClick={() => handleSelectSuggested(video)}
                className="glass-card rounded-xl p-3 border border-slate-800 hover:border-red-500/40 cursor-pointer transition-all hover:bg-slate-900/60 flex items-center gap-3 group"
              >
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded border border-red-900/40">
                    {video.category}
                  </span>
                  <h4 className="text-xs font-bold text-white truncate mt-1 group-hover:text-red-300 transition-colors">
                    {video.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {video.channel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
