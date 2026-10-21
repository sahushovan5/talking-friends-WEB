import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Search,
  Radio,
  Sparkles,
  Link as LinkIcon,
  AlertCircle,
  Clock,
  Eye,
  User,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { YouTubeIcon } from './YouTubeIcon';
import { extractYouTubeVideoId, SUGGESTED_VIDEOS } from '../utils/youtube';
import { SIGNALING_SERVER_URL } from '../services/socket';

const QUICK_SEARCH_CHIPS = [
  'English Music',
  'Lofi Hip Hop',
  'Arijit Singh Songs',
  'Romantic Songs',
  'Coffee Jazz',
  'Hindi Old Songs'
];

export function YouTubeModal({ isOpen, onClose, onSelectVideo, socket }) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [directVideoId, setDirectVideoId] = useState(null);

  // Check if query is a direct YouTube link or raw video ID
  useEffect(() => {
    if (!query.trim()) {
      setDirectVideoId(null);
      return;
    }
    const detectedId = extractYouTubeVideoId(query);
    setDirectVideoId(detectedId);
  }, [query]);

  // Execute YouTube text search
  const handleSearch = (searchQueryTerm) => {
    const term = (searchQueryTerm !== undefined ? searchQueryTerm : query).trim();
    if (!term) return;

    setError('');
    setIsSearching(true);
    setSearchedQuery(term);

    // If query is directly an 11-char ID or direct URL and user presses play
    const detectedId = extractYouTubeVideoId(term);
    if (detectedId && (term.includes('youtube.com') || term.includes('youtu.be') || term === detectedId)) {
      onSelectVideo({
        videoId: detectedId,
        title: 'YouTube Video',
        channel: 'YouTube'
      });
      onClose();
      return;
    }

    // Search via Socket.io relay first
    if (socket && socket.connected) {
      socket.emit('search-youtube', { query: term }, (res) => {
        setIsSearching(false);
        if (res && res.success) {
          setSearchResults(res.videos || []);
          if (!res.videos || res.videos.length === 0) {
            setError(`No videos found on YouTube for "${term}".`);
          }
        } else {
          fallbackRestSearch(term);
        }
      });
    } else {
      fallbackRestSearch(term);
    }
  };

  // REST API search fallback
  const fallbackRestSearch = (term) => {
    fetch(`${SIGNALING_SERVER_URL}/api/youtube/search?q=${encodeURIComponent(term)}`)
      .then((res) => res.json())
      .then((data) => {
        setIsSearching(false);
        if (data && data.success) {
          setSearchResults(data.videos || []);
          if (!data.videos || data.videos.length === 0) {
            setError(`No videos found on YouTube for "${term}".`);
          }
        } else {
          setError(data?.error || 'Failed to search YouTube videos');
        }
      })
      .catch((err) => {
        setIsSearching(false);
        setError('Could not connect to YouTube search service.');
      });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const handleChipClick = (chip) => {
    setQuery(chip);
    handleSearch(chip);
  };

  const handleClearSearch = () => {
    setQuery('');
    setSearchedQuery('');
    setSearchResults([]);
    setError('');
    setDirectVideoId(null);
  };

  const handlePlayDirect = () => {
    if (!directVideoId) return;
    onSelectVideo({
      videoId: directVideoId,
      title: 'YouTube Video',
      channel: 'YouTube'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-3xl glass-panel rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-600/10">
              <YouTubeIcon className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Watch YouTube Together</span>
              </h3>
              <p className="text-xs text-slate-400">
                Search any YouTube video to stream and watch in real-time sync with room peers
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

        {/* Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Main YouTube Search Bar */}
          <form onSubmit={handleFormSubmit} className="space-y-2">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>

              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setError('');
                }}
                placeholder="Search YouTube (e.g. 'agentic ai', 'lofi beats') or paste link..."
                className="w-full pl-10 pr-24 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-inner"
                autoFocus
              />

              <div className="absolute right-2 flex items-center gap-1.5">
                {query && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!query.trim() || isSearching}
                  className="px-3 sm:px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* Direct Link Quick Launcher if URL detected */}
            {directVideoId && (
              <div className="p-2.5 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-indigo-300 font-medium truncate">
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span className="truncate">Direct video link detected ({directVideoId})</span>
                </div>
                <button
                  type="button"
                  onClick={handlePlayDirect}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-indigo-600/30 active:scale-95 transition-all flex-shrink-0"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Play Directly</span>
                </button>
              </div>
            )}

            {error && (
              <div className="text-xs text-rose-400 flex items-center gap-1.5 mt-1 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Quick Search Suggestions Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Suggested:</span>
            </span>
            {QUICK_SEARCH_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all active:scale-95 ${
                  searchedQuery === chip
                    ? 'bg-red-600 text-white border-red-500 font-semibold shadow-sm shadow-red-600/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Active View: Loading Skeleton / Search Results / Curated Streams */}
          <div className="pt-2">
            {isSearching ? (
              /* Loading Skeletons */
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                  <span>Searching YouTube for "{searchedQuery}"...</span>
                </div>
                <div className="space-y-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3 animate-pulse"
                    >
                      <div className="w-28 h-18 sm:w-36 sm:h-20 bg-slate-800 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-800 rounded w-5/6" />
                        <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                        <div className="h-3 bg-slate-800/40 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              /* Real YouTube Search Results View */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-red-400" />
                    <span>YouTube Results for "{searchedQuery}"</span>
                    <span className="text-[10px] text-slate-500 font-normal">({searchResults.length} videos)</span>
                  </span>
                  <button
                    onClick={handleClearSearch}
                    className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Back to Curated Streams</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {searchResults.map((video) => (
                    <div
                      key={video.videoId}
                      onClick={() => {
                        onSelectVideo({
                          videoId: video.videoId,
                          title: video.title,
                          channel: video.author
                        });
                        onClose();
                      }}
                      className="glass-card rounded-xl p-2.5 sm:p-3 border border-slate-800 hover:border-red-500/50 cursor-pointer transition-all hover:bg-slate-900/80 flex items-center gap-3 group relative overflow-hidden"
                    >
                      {/* Video Thumbnail with Duration Badge */}
                      <div className="w-28 h-18 sm:w-36 sm:h-20 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 relative shadow-md">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {video.duration && (
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-[10px] font-mono font-semibold text-white">
                            {video.duration}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="p-2 rounded-full bg-red-600 text-white shadow-lg">
                            <Play className="w-4 h-4 fill-white" />
                          </div>
                        </div>
                      </div>

                      {/* Video Details */}
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 group-hover:text-red-400 transition-colors leading-snug">
                          {video.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="truncate max-w-[140px] text-slate-300 font-medium">
                            {video.author}
                          </span>
                          {video.views && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="truncate">{video.views} views</span>
                            </>
                          )}
                          {video.ago && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="truncate">{video.ago}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Play Action Button on Right */}
                      <div className="hidden sm:flex flex-shrink-0">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-red-600/15 group-hover:bg-red-600 text-red-400 group-hover:text-white font-bold text-xs border border-red-500/30 group-hover:border-red-500 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Watch</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Curated / Suggested Chill Streams (Free4Talk Style) */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span>Curated Streams & Relaxing Radios</span>
                  </span>
                  <span className="text-[11px] text-slate-500">1-click instant sync</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {SUGGESTED_VIDEOS.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => {
                        onSelectVideo({
                          videoId: video.id,
                          title: video.title,
                          channel: video.channel
                        });
                        onClose();
                      }}
                      className="glass-card rounded-xl p-3 border border-slate-800 hover:border-red-500/50 cursor-pointer transition-all hover:bg-slate-900/80 flex items-center gap-3 group"
                    >
                      <div className="w-20 h-14 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 relative shadow-md">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900/40">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
