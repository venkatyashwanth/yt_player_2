"use client";
import Header from "@/components/Header";
import Player from "@/components/Player";
import Playlist from "@/components/Playlist";
import { useToast } from "@/hooks/useToast";
import { clearVideoTime, loadIndex, loadPlaylist, saveIndex, savePlaylist } from "@/utils/storage";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Home() {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentTitle, setCurrentTitle] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPrevExist, setisPrevExist] = useState(false);
  const [isNextExist, setisNextExist] = useState(false);
  const playerRef = useRef(null);
  const navToastRef = useRef(false);
  const { toast, showToast } = useToast(1500);

  // Load and set playlist, from local local storage
  useEffect(() => {
    setPlaylist(loadPlaylist());
  }, [])

  // Load Current Index from local storage
  useEffect(() => {
    if (currentIndex >= 0) {
      saveIndex(currentIndex);
    }
  }, [currentIndex])

  //  Reads currentIndex from local-storage if saved and intially set currentIndex to 0
  useEffect(() => {
    const storedPlaylist = loadPlaylist();
    if (storedPlaylist.length === 0) {
      setCurrentIndex(-1);
      return;
    }
    const saved = loadIndex();
    if (typeof saved === "number" && saved >= 0) {
      setCurrentIndex(saved);
    } else {
      setCurrentIndex(0);
    }
  }, [])

  // Display the title of the video 
  useEffect(() => {
    if (currentIndex < 0) {
      setCurrentTitle("");
      return;
    }

    // const list = loadPlaylist();
    const video = playlist[currentIndex];
    setCurrentTitle(video?.title || "");
  }, [currentIndex, playlist])

  // Handles Toggle and sets current index 
  const handleTogglePlay = useCallback((index) => {
    if (index === currentIndex) {
      playerRef.current?.togglePlayPause();
    } else {
      setCurrentIndex(index);
    }
  }, [currentIndex])

  // Previous Button Handler 
  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => {
      const currentPlayItemId = playlist[i].id;
      clearVideoTime(currentPlayItemId);
      if (i > 0) {
        navToastRef.current = true;
        showToast("Previous ◀")
        return i - 1;
      }
      showToast("No previous video")
      return i;
    })
  }, [showToast, currentIndex])

  // Next Button Handler 
  const handleNext = useCallback(() => {
    setCurrentIndex((i) => {
      const currentPlayItemId = playlist[i].id;
      clearVideoTime(currentPlayItemId);
      const list = loadPlaylist();
      const listLength = list.length;
      // const listLength = playlist.length;
      if (i < listLength - 1) {
        navToastRef.current = true;
        showToast("Next ▶")
        return i + 1;
      }
      showToast("No next video");
      return i;
    })
  }, [playlist.length, showToast])

  // Update playlist when new video is added 
  const updatePlaylist = (updated) => {
    setPlaylist(updated);
    savePlaylist(updated);
    if (currentIndex === -1 && updated.length > 0) {
      setCurrentIndex(0);
    }
  }

  // set state of prev and next buttons
  useEffect(() => {
    setisPrevExist(currentIndex <= 0);
    setisNextExist(currentIndex >= playlist.length - 1);
  }, [currentIndex])

  // Delete Handler 
  const handleDelete = (index) => {
    if (!confirm("Delete this video?")) return;
    const updated = playlist.filter((_, i) => i !== index);
    setPlaylist(updated);
    updatePlaylist(updated);
    setCurrentIndex((currIndex) => {
      // deleted before current → shift left
      if (index < currIndex) {
        return currIndex - 1;
      }
      // deleted currently playing
      if (index === currIndex) {
        if (updated.length === 0) {
          window.location.reload();
          return -1;
        }
        return updated.length - 1;
      }

      return currIndex
    })
  }

  // Error Handler
  const handlePlayerError = useCallback(() => {
    console.log("clicked")
    showToast("Video unavailable ⏭ Skipping");

    setCurrentIndex((i) => {
      if (i < playlist.length - 1) return i + 1;
      return i; // or -1 if you want to stop
    });
  }, [playlist.length, showToast]);

  // Remove Blocked Videos
  const handleBlockedVideo = useCallback((blockedIndex) => {
    setPlaylist((prev) => {
      const blocked = prev[blockedIndex];
      if (!blocked) return prev;

      const updated = prev.filter((_, i) => i !== blockedIndex);
      savePlaylist(updated);

      showToast("Blocked video removed 🧹");

      setCurrentIndex((curr) => {
        if (updated.length === 0) return -1;

        // if blocked video was current
        if (blockedIndex === curr) {
          return Math.min(curr, updated.length - 1);
        }

        // if removed before current
        if (blockedIndex < curr) {
          return curr - 1;
        }

        return curr;
      });

      window.location.reload();
      return updated;
    })
  }, [showToast])

  // Keyboard-Shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return
      }
      const controls = playerRef.current;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          console.log("space is pressed");
          console.log(playerRef.current);
          playerRef.current?.togglePlayPause();
          break;
        case "ArrowUp": {
          e.preventDefault();
          const v = controls?.changeVolume(5);
          if (typeof v === "number") {
            showToast(`Volume : ${v}%`);
          };
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          const v = controls?.changeVolume(-5);
          if (typeof v === "number") {
            showToast(`Volume: ${v}%`)
          };
          break;
        }
        case "ArrowRight":
          if (e.shiftKey) {
            controls.seekBy(5);
            showToast(`Forward +5 sec`)
          } else {
            handleNext();
          }
          break;
        case "ArrowLeft":
          if (e.shiftKey) {
            controls?.seekBy(-5);
            showToast(`Backward -5 sec`)
          } else {
            handlePrev();
          }
          break;
        case "KeyM":
          controls.toggleMute();
          // showToast(`${playerRef.current.isMuted()? "UnMute":"Mute"}`);
          console.log(controls)
          console.log()
          showToast(controls.audioStatus() ? "UnMuted 🔊" : "Muted 🔈");
          break;
        case "KeyF":
          controls.enterFullscreen();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev])

  // Toast Update 
  useEffect(() => {
    if (isPlaying === null) return;
    if (navToastRef.current && isPlaying) {
      const t = setTimeout(() => {
        showToast(`Playing: ${currentTitle?.split("|")[0].trim()}`);
        navToastRef.current = false;
      }, 1000)
      return () => clearTimeout(t);
    }
    if (!navToastRef.current) {
      showToast(isPlaying ? `Playing: ${currentTitle?.split("|")[0].trim()}` : "Paused")
    }
  }, [isPlaying, showToast])

  return (
    <>
      <div>
        <Header />
        <div className="container player-wrap">
          <Player
            ref={playerRef}
            playlist={playlist}
            currentIndex={currentIndex}
            currentTitle={currentTitle}
            onPrev={handlePrev}
            onNext={handleNext}
            onEnded={handleNext}
            onError={handlePlayerError}
            onPlayingChange={setIsPlaying}
            onBlockedVideo={handleBlockedVideo}
            isPrevDisabled={isPrevExist}
            isNextDisabled={isNextExist}
          />
          <Playlist
            playlist={playlist}
            setPlaylist={setPlaylist}
            currentIndex={currentIndex}
            isPlaying={isPlaying}
            updatePlayState={handleTogglePlay}
            updatePlaylistLocal={updatePlaylist}
            deleteVideo={handleDelete}
          />
        </div>
      </div>
      {toast && (
        <div className="message-toast">
          {toast}
        </div>
      )}
    </>
  );
}
