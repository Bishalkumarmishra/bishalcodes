import React, { useState, useEffect, useRef } from 'react';

interface NetworkStatusIndicatorProps {
  isOnline: boolean;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ isOnline }) => {
  const [showStatus, setShowStatus] = useState(false);
  const [isCurrentlyOnline, setIsCurrentlyOnline] = useState(isOnline);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    // Skip the very first render (page load / refresh)
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setShowStatus(true);
    setIsCurrentlyOnline(isOnline);

    const duration = isOnline ? 2500 : 8000;

    timeoutRef.current = setTimeout(() => {
      setShowStatus(false);
      timeoutRef.current = null;
    }, duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOnline]);

  if (!showStatus) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 12px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.01em',
        color: isCurrentlyOnline ? '#166534' : '#991b1b',
        backgroundColor: isCurrentlyOnline ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${isCurrentlyOnline ? '#bbf7d0' : '#fecaca'}`,
        opacity: showStatus ? 1 : 0,
        transform: showStatus ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: isCurrentlyOnline ? '#22c55e' : '#ef4444',
          flexShrink: 0,
        }}
      />
      {isCurrentlyOnline ? 'Online' : 'Offline'}
    </div>
  );
};

export default NetworkStatusIndicator;