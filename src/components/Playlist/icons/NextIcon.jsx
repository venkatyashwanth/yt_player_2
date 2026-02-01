export default function NextIcon({
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
      <path d="M0 381.4l237.7-118.9L0 143.6v237.8zM237.7 262.5v118.9l237.7-118.9-237.7-118.9v118.9zM475.4 143.6v237.8H512V143.6h-36.6z" />
    </svg>
  );
}
