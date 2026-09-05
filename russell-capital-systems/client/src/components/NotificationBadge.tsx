interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className = "" }: NotificationBadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      className={`inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
