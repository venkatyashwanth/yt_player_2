"use client"

import { useEffect, useState } from "react";
import styles from "./BottomPlayerBar.module.scss";
import PauseIcon from "../Playlist/icons/PauseIcon";
import PlayIcon from "../Playlist/icons/PlayIcon";
import PreviousIcon from "../Playlist/icons/PreviousIcon";
import NextIcon from "../Playlist/icons/NextIcon";
import AudioIcon from "../Playlist/icons/AudioIcon";
import VideoIcon from "../Playlist/icons/VideoIcon";

const BottomPlayerBar = ({
    playerRef,
    currentVideo,
    isPlaying,
    handleNext,
    handlePrev,
    audioOnly,
    setAudioOnly
}) => {
    const [progress, setProgress] = useState(0);
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(50);
    const [isMuted, setIsMuted] = useState(false);

    const currentId = currentVideo?.id;
    const currentTitle = currentVideo?.title || "Nothing Playing";
    const trimString = currentTitle?.split("|")[0].trim();
    const artistName = currentTitle?.split("|")[2]?.trim() || "No Data";

    useEffect(() => {
        const interval = setInterval(() => {
            if (!playerRef.current) return;
            const time = playerRef.current.getTime();
            const duration = playerRef.current.getDuration();
            if (typeof time === "number" && typeof duration === "number" && duration > 0) {
                setTime(time);
                setDuration(duration);
                setProgress((time / duration) * 100);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [playerRef])

    const formatTime = (sec = 0) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };


    return (
        <>
            <div className={styles.bottomPlayer}>
                {/* Left: Track Info */}
                <div className={styles.playerLeft}>
                    <img
                        className={styles.trackThumb}
                        src={`https://img.youtube.com/vi/${currentId}/hqdefault.jpg`}
                        alt={currentTitle}
                    />
                    <div className={styles.trackMeta}>
                        <p className={styles.trackTitle}>{trimString}</p>
                        <p className={styles.trackArtist}>{artistName}</p>
                    </div>
                </div>

                {/* Center: Controls + Seek */}
                <div className={styles.playerCenter}>
                    <div className={styles.controls}>
                        <button className={styles.iconBtn}
                            onClick={() => { handlePrev() }}
                        >
                            <PreviousIcon />
                        </button>
                        <button
                            onClick={() => {
                                playerRef.current?.togglePlayPause();
                            }}
                            className={`${styles.iconBtn} ${styles.play}`}>
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <button className={styles.iconBtn}
                            onClick={() => { handleNext() }}
                        >
                            <NextIcon />
                        </button>
                    </div>
                    <div className={styles.seekWrapper}>
                        <span className={styles.time}>{formatTime(time)}</span>
                        <input
                            type="range"
                            className={styles.seekBar} min={0} max={100}
                            value={progress}
                            style={{ "--progress": `${progress}%` }}
                            onChange={(e) => {
                                const duration = playerRef.current.getDuration();
                                playerRef.current.seekTo(
                                    (e.target.value / 100) * duration
                                )
                            }}
                        />
                        <span className={styles.time}>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Right: Volume */}
                <div className={styles.playerRight}>
                    <button className={styles.iconBtn}
                        onClick={() => {
                            playerRef.current.toggleMute();
                            setIsMuted(!playerRef.current?.audioStatus());
                        }}
                    >
                        {isMuted ? "🔈" : "🔊"}
                    </button>
                    <input type="range" className={styles.volumeBar} min={0} max={100}
                        value={volume}
                        style={{ "--volume": `${volume}%` }}
                        onChange={(e) => {
                            setVolume(e.target.value);
                            playerRef.current.setVolume(e.target.value)
                        }}
                    />
                    <button className={`${styles.iconBtn} ${styles.small}`}
                        onClick={() => setAudioOnly(v => !v)}
                    >
                        {!audioOnly ? <AudioIcon /> : <VideoIcon />}
                    </button>
                </div>
            </div>
        </>
    )
}

export default BottomPlayerBar;