"use client";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import styles from "./Player.module.scss";
import { loadYouTubeAPI } from "@/utils/youtube";
import { loadVideoTime, saveVideoTime } from "@/utils/storage";

const Player = forwardRef(({
    playlist,
    currentTitle,
    currentIndex,
    onPlayingChange,
    onPrev,
    onNext,
    onEnded,
    onError,
    isPrevDisabled,
    isNextDisabled,
    onBlockedVideo
}, ref) => {
    const playerRef = useRef(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const playAttemptTimeoutRef = useRef(null);

    // expose player controls to parent 
    useImperativeHandle(ref, () => ({
        seekBy(seconds) {
            if (!playerRef.current) return;
            const t = playerRef.current.getCurrentTime?.();
            console.log(t);
            if (typeof t === "number") {
                playerRef.current.seekTo(t + seconds, true);
            }
        },
        togglePlayPause() {
            if (!playerRef.current) return;
            const state = playerRef.current.getPlayerState();
            console.log(state);
            if (state === window.YT.PlayerState.PLAYING) {
                playerRef.current.pauseVideo();
            } else if (state === -1) {
                playerRef.current.playVideo();
            } else if (state === window.YT.PlayerState.PAUSED) {
                playerRef.current.playVideo();
            } else if (state === window.YT.PlayerState.CUED) {
                playerRef.current.playVideo();
            } else if (state === window.YT.PlayerState.ENDED) {
                playerRef.current.playVideo();
            }
        },
        changeVolume(delta) {
            if (!playerRef.current) return;
            const current = playerRef.current.getVolume?.();
            if (typeof current !== "number") return;
            const next = Math.min(100, Math.max(0, current + delta));
            playerRef.current.setVolume(next);
            return next;
        },
        toggleMute() {
            if (playerRef.current.isMuted()) {
                playerRef.current.unMute();
            } else {
                playerRef.current.mute();
            }
        },
        audioStatus() {
            return playerRef.current.isMuted();
        },
        enterFullscreen() {
            const iframe = document.getElementById("player");
            iframe?.requestFullscreen?.();
        },
    }))

    // Initialize YoutubeIFrame API
    useEffect(() => {
        loadYouTubeAPI(() => {
            if (playerRef.current) return;
            playerRef.current = new window.YT.Player("player", {
                height: "100%",
                width: "100%",
                events: {
                    onReady: (event) => {
                        playerRef.current = event.target;
                        setIsPlayerReady(true);
                    },
                    onStateChange: handleStateChange,
                    onError: handleError,
                }
            })
        })
    }, [])

    // Helper Functions
    const handleStateChange = useCallback((event) => {
        if (event.data === window.YT.PlayerState.PLAYING) {
            clearTimeout(playAttemptTimeoutRef);
            onPlayingChange(true);
        }
        if (
            event.data === window.YT.PlayerState.PAUSED
        ) {
            onPlayingChange(false);
        }
        if (event.data === window.YT.PlayerState.ENDED) {
            onPlayingChange(false);
            onEnded?.();
        }
    }, [onPlayingChange, onEnded])

    // Load and Play specific video by ID  
    useEffect(() => {
        if (!isPlayerReady || currentIndex < 0) return;
        const video = playlist[currentIndex];
        if (!video) return;
        const savedTime = loadVideoTime(video.id);
        playerRef.current.loadVideoById({ videoId: video.id, startSeconds: savedTime || 0 });
        playerRef.current.playVideo();

        clearTimeout(playAttemptTimeoutRef.current);
        playAttemptTimeoutRef.current = setTimeout(() => {
            const state = playerRef.current.getPlayerState();
            if (state === window.YT.PlayerState.UNSTARTED) {
                console.warn("Blocked video detected:", video.id);
                onBlockedVideo?.(currentIndex); // manually trigger skip
            }
        }, 2500);

    }, [currentIndex, isPlayerReady]);

    // Handle Error
    const handleError = (event) => {
        if ([2, 5, 100, 101, 150].includes(event.data)) {
            onError?.(); // tell parent to skip
        }
    }


    // Save Current time 
    useEffect(() => {
        if (!playerRef.current) return;
        const interval = setInterval(() => {
            if (!playerRef.current) return;

            const time = playerRef.current.getCurrentTime?.();
            const video = playlist[currentIndex];
            if (video && typeof time === "number") {
                const duration = playerRef.current.getDuration?.();
                if (typeof duration === "number" && time >= duration - 20) {
                    return;
                }
                console.log("time is saved");
                saveVideoTime(video.id, time)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [currentIndex])

    return (
        <>
            <div className={styles.videoArea}>
                <div className={styles.videoBox}>
                    <div id="player" className={styles.player}></div>
                </div>
                <div className={styles.videoCtrls}>
                    <div className={styles.currentTitle}>
                        {currentTitle ? `Now Playing: ${currentTitle}` : "No video selected"}
                    </div>
                    <div className={styles.navBtns}>
                        <button className="btn" onClick={onPrev} disabled={isPrevDisabled}>Prev</button>
                        <button className="btn" onClick={onNext} disabled={isNextDisabled}>Next</button>
                    </div>
                </div>
            </div>
        </>
    )
})

export default Player;