// Get Playlist from localstorage
export function loadPlaylist() {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("yt_master") || "[]");
}

// Save Playlist to localstorage 
export function savePlaylist(list) {
    if (typeof window === "undefined") return [];
    return localStorage.setItem("yt_master", JSON.stringify(list));
}

// Current Index
export function loadIndex() {
    if (typeof window === "undefined") return -1;
    return Number(localStorage.getItem("yt_current_index") || -1);
}

export function saveIndex(i) {
    localStorage.setItem("yt_current_index", String(i));
}

const TIME_KEY = "yt_video_time";

export function saveVideoTime(videoId, time) {
    if (!videoId || typeof time !== "number") return;
    const map = JSON.parse(localStorage.getItem(TIME_KEY) || "{}");
    map[videoId] = time;
    localStorage.setItem(TIME_KEY, JSON.stringify(map));
}

export function loadVideoTime(videoId) {
    if (!videoId) return 0;
    const map = JSON.parse(localStorage.getItem(TIME_KEY) || "{}");
    return map[videoId] || 0;
}

export function clearVideoTime(videoId) {
    const map = JSON.parse(localStorage.getItem(TIME_KEY) || "{}");
    delete map[videoId];
    localStorage.setItem(TIME_KEY, JSON.stringify(map));
}