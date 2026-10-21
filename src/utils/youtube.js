/**
 * Parse and extract 11-character YouTube video ID from various URL formats
 * (e.g. youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/..., youtube.com/live/..., or raw ID)
 */
export function extractYouTubeVideoId(input = '') {
  if (!input) return null;
  const trimmed = input.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle standard, short, embed, and live URLs
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);

  return match && match[1] ? match[1] : null;
}

/**
 * Curated list of suggested YouTube videos / live streams for Free4Talk-style co-listening
 */
export const SUGGESTED_VIDEOS = [
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio - Beats to relax/study to',
    channel: 'Lofi Girl',
    category: 'Lofi & Chill',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: '4xDzrJKXOOY',
    title: 'Synthwave Radio - Chill Synth / Retro Beats',
    channel: 'Lofi Girl',
    category: 'Synthwave',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: '-5KAN9_CzSA',
    title: 'Coffee Shop Ambient Jazz & Rain Relaxing',
    channel: 'Coffee Relaxing Jazz',
    category: 'Jazz & Rain',
    thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'WPni755-Krg',
    title: 'Deep Focus Ambient Music for Coding & Work',
    channel: 'Quiet Quest',
    category: 'Focus & Study',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'S_DFZ3bE7rQ',
    title: 'Cyberpunk Darksynth Ambient Radio',
    channel: 'Darksynth Cyber',
    category: 'Cyberpunk',
    thumbnail: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'q0mQfW9G_eI',
    title: 'Studio Ghibli Calm Piano Relaxing Medley',
    channel: 'Anime Piano Collection',
    category: 'Anime & Piano',
    thumbnail: 'https://images.unsplash.com/photo-1520523839898-50712404e63e?w=600&auto=format&fit=crop&q=80'
  }
];
