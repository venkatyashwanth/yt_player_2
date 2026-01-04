import styles from "./Header.module.scss";

export default function Header() {
    return (
        <header className={`container ${styles.header}`}>
            <h1>YouTube Playlist Player</h1>
        </header>
    )
}