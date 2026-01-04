"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./Playlist.module.scss";
import { extractVideoId } from "@/utils/youtube";
import { fetchVideoTitle } from "@/utils/fetchTitle";
import PlayIcon from "./icons/PlayIcon";
import CopyIcon from "./icons/CopyIcon";
import DeleteIcon from "./icons/DeleteIcon";
import PauseIcon from "./icons/PauseIcon";
import { useToast } from "@/hooks/useToast";
import { loadPlaylist } from "@/utils/storage";

export default function Playlist({
    playlist,
    setPlaylist,
    currentIndex,
    isPlaying,
    updatePlayState,
    updatePlaylistLocal,
    deleteVideo
}) {
    const [url, setUrl] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const { toast, showToast } = useToast(1500);
    const containerRef = useRef(null);

    // Adds New Video from url (input)
    async function addVideo() {
        if (isAdding) return;

        if (!url.trim()) {
            alert("Please paste a YouTube URL or ID");
            return;
        }

        const id = extractVideoId(url);
        if (!id) {
            alert("Invalid YouTube URL or ID");
            return;
        }

        // 🔒 Prevent duplicate videos
        const alreadyExists = playlist.some((v) => v.id === id);
        if (alreadyExists) {
            alert("This video is already in the playlist");
            setUrl("");
            return;
        }

        setIsAdding(true);

        const fallbackTitle = `Video ${playlist.length + 1}`;
        let title;

        try {
            title = await fetchVideoTitle(id);
        } catch (err) {
            console.error("Failed to fetch title", err);
        }

        const video = { id, title: title || fallbackTitle };
        const updated = [...playlist, video];
        updatePlaylistLocal(updated);
        updatePlayState(updated.length - 1);
        setUrl("");
        setIsAdding(false);
    }

    // Exports and Imports
    const exportPlaylist = () => {
        const data = loadPlaylist();
        if (!data.length) {
            alert("Playlist is empty");
            return;
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "yt-playlist.json";
        a.click();
        URL.revokeObjectURL(url);
    }

    const importPlaylist = (file) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (!Array.isArray(parsed)) {
                    throw new Error("Invalid playlist format");
                }

                // Normalize structure
                const cleaned = parsed.map((item) => ({
                    id: String(item.id),
                    title: String(item.title || item.id),
                }));

                localStorage.setItem("yt_master", JSON.stringify(cleaned));
                setPlaylist(cleaned);
                alert("Playlist imported successfully");
                window.location.reload();
            } catch (err) {
                console.error(err);
                alert("Invalid JSON file");
            }
        };

        reader.readAsText(file);
    }

    // Clear Playlist
    const clearPlaylist = () => {
        if (!confirm("Clear Entire Playlist?")) return;
        localStorage.removeItem("yt_master");
        localStorage.removeItem("yt_current_index");
        localStorage.removeItem("yt_video_time");
        setPlaylist([]);
        window.location.reload();
    }

    return (
        <>
            <div className={styles.playlistArea}>
                <div className={styles.countHold}>
                    <strong>Playlist</strong>
                    <small>{playlist.length} items</small>
                </div>
                <div className={styles.playlist} ref={containerRef}>
                    {playlist.map((video, i) => {
                        const isThisPlaying = i === currentIndex && isPlaying;
                        const isActivePlayItem = i === currentIndex;
                        return (
                            <div
                                ref={isActivePlayItem ? el => el?.scrollIntoView({ behavior: "smooth", block: "center" }) : null}
                                key={video.id}
                                className={`${styles.playlistItem} ${isActivePlayItem ? styles.active : ""}`}
                            >
                                <div className={styles.num}>{i + 1}</div>
                                <div className={styles.thumb}>
                                    <img
                                        src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                                        alt={video.title}
                                    />
                                </div>
                                <div className={styles.info}>
                                    <div className={styles.title}>{video.title}</div>
                                    <div className={styles.meta}>{video.id}</div>
                                </div>
                                <div className={styles.itemActions}>
                                    <button
                                        className={styles.iconBtn}
                                        onClick={() => {
                                            updatePlayState(i)
                                        }}
                                    >
                                        {isThisPlaying ? <PauseIcon /> : <PlayIcon />}
                                    </button>

                                    <button
                                        className={styles.iconBtn}
                                        onClick={() => {
                                            navigator.clipboard.writeText(video.id)
                                            showToast(`Copied ID: ${video.id}`);
                                        }}
                                    >
                                        <CopyIcon />
                                    </button>

                                    <button
                                        className={styles.iconBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteVideo(i);
                                        }}
                                    >
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className={styles.inputRow}>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste Youtube URL or ID"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addVideo();
                            }
                        }}
                    />
                    <button className="btn" onClick={addVideo}>
                        {isAdding ? "Adding..." : "Add"}
                    </button>
                </div>
                <div className={styles.footerActions}>
                    <button className="btn" onClick={exportPlaylist}>Export JSON</button>
                    <button className="btn" onClick={() => document.getElementById("importfile").click()}>Import JSON</button>
                    <input type="file" id="importfile" accept=".json" className={styles.fileInput}
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                importPlaylist(e.target.files[0]);
                                e.target.value = ""; // allow re-import same file
                            }
                        }}
                    />
                    <button className="btn" style={{ background: "#666" }} onClick={clearPlaylist} >Clear</button>
                </div>
            </div>
            {toast && (
                <div className="message-toast">
                    {toast}
                </div>
            )}
        </>
    )
}