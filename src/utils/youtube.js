// 
let isAPILoaded = false;
let callbacks = [];
export function loadYouTubeAPI(onReady) {
    if (isAPILoaded) {
        onReady();
        return;
    }

    callbacks.push(onReady);

    if (document.getElementById("youtube-iframe-api")) return;

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.id = "youtube-iframe-api";
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
        isAPILoaded = true;
        callbacks.forEach((cb) => cb());
        callbacks = [];
    };
}

// 
export function extractVideoId(urlOrId) {
  if (!urlOrId) return null;
  const s = urlOrId.trim();

  // Already a plain 11-char id?
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;

  // Patterns
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/v\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/
  ];

  for (const p of patterns) {
    const m = s.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}