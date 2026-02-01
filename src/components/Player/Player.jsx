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
    onBlockedVideo,
    audioOnly
}, ref) => {
    const playerRef = useRef(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const playAttemptTimeoutRef = useRef(null);
    const hasStartedRef = useRef(false);

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
        seekTo(time) {
            playerRef.current?.seekTo(time, true)
        },
        togglePlayPause() {
            if (!playerRef.current) return;
            const state = playerRef.current.getPlayerState();
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
        play() {
            playerRef.current?.playVideo()
        },
        pause() {
            playerRef.current?.pauseVideo()
        },
        getTime() {
            if (!playerRef.current) return 0;
            return playerRef.current.getCurrentTime?.() ?? 0;
        },
        getDuration() {
            if (!playerRef.current) return 0;
            return playerRef.current.getDuration?.() ?? 0;
        },
        setVolume(v) {
            playerRef.current?.setVolume(v)
        },
        setLowQuality() {
            playerRef.current?.setPlaybackQuality("small")
        },
        getPlaybackQuality() {
            return playerRef.current?.getPlaybackQuality?.();
        },

        getAvailableQualityLevels() {
            return playerRef.current?.getAvailableQualityLevels?.();
        }
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
        if (
            event.data === window.YT.PlayerState.PLAYING ||
            event.data === window.YT.PlayerState.CUED
        ) {
            hasStartedRef.current = true;
            clearTimeout(playAttemptTimeoutRef.current);
        }

        if (event.data === window.YT.PlayerState.PLAYING && audioOnly) {
            event.target.setPlaybackQuality("small");
        }

        if (event.data === window.YT.PlayerState.PLAYING) {
            const videoData = event.target.getVideoData?.();
            const videoId = videoData?.video_id;
            const video = playlist[currentIndex];
            // console.log(playerRef.current.getCurrentTime?.());
            // if (!video || !playerRef.current) return;
            const time = playerRef.current.getCurrentTime?.();
            if (typeof time === "number") {
                saveVideoTime(videoId, time); // 🔥 save instantly (0–1s)
            }
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

    // Force Downgrading the audio. - But not working because of youtube limitations
    useEffect(() => {
        if (!playerRef.current || !audioOnly) return;

        // force low quality AFTER playback starts
        const forceLowQuality = () => {
            playerRef.current.setPlaybackQuality("small");
        };

        forceLowQuality(); // once immediately

        const interval = setInterval(forceLowQuality, 2000);

        return () => clearInterval(interval);
    }, [audioOnly]);


    // Load and Play specific video by ID  
    useEffect(() => {
        if (!isPlayerReady || currentIndex < 0) return;
        const video = playlist[currentIndex];
        if (!video) return;
        hasStartedRef.current = false;
        const savedTime = loadVideoTime(video.id);
        playerRef.current.loadVideoById({ videoId: video.id, startSeconds: savedTime || 0 });
        playerRef.current.playVideo();
    }, [currentIndex, isPlayerReady]);

    // Handle Error
    const handleError = useCallback((event) => {
        const errorCode = event.data;

        const videoData = event.target.getVideoData?.();
        const videoId = videoData?.video_id;

        console.log("YT Error Code:", errorCode);
        console.log("Blocked video ID:", videoId);

        if ([5, 100, 101, 150].includes(errorCode)) {
            console.warn("Blocked video confirmed:", videoId);
            onBlockedVideo?.(videoId);
        }
    }, [currentIndex, playlist, onBlockedVideo]);


    // Save Current time 
    useEffect(() => {
        if (!playerRef.current) return;
        const interval = setInterval(() => {
            if (!playerRef.current) return;

            const state = playerRef.current.getPlayerState();
            if (state !== window.YT.PlayerState.PLAYING) return;

            // const time = playerRef.current.getCurrentTime?.();
            const video = playlist[currentIndex];
            if (!video) return;

            const time = playerRef.current.getCurrentTime?.();
            const duration = playerRef.current.getDuration?.();

            if (
                typeof time === "number" &&
                typeof duration === "number" &&
                time < duration - 20
            ) {
                saveVideoTime(video.id, time);
            }
        }, 1000)
        return () => clearInterval(interval)
    }, [currentIndex, isPlayerReady])

    return (
        <>
            <div className={styles.videoArea}>
                <div className={`${styles.videoBox}  ${audioOnly ? styles.audioOnly : ""}`}>
                    <div id="player" className={`${styles.player}`}></div>
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