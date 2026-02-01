export default function PreviousIcon({
  size = 20,
  className = "",
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M274.3 262.5L512 381.4V143.6L274.3 262.5zM36.6 262.5l237.7 118.9V262.5V143.6L36.6 262.5zM0 143.6v237.7h36.6V262.5V143.6H0z" />
    </svg>
  );
}
