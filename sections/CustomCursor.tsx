import React, { useEffect, useState } from 'react';

const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trailing, setTrailing] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setIsHovering(
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('button') !== null || 
        target.closest('a') !== null
      );
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleHover);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleHover);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrailing((prev) => ({
        x: prev.x + (position.x - prev.x) * 0.15,
        y: prev.y + (position.y - prev.y) * 0.15,
      }));
    }, 10);
    return () => clearInterval(interval);
  }, [position]);

  return (
    <>
      <div 
        className="fixed pointer-events-none z-[999] w-2 h-2 bg-[#ccff00] rounded-full mix-blend-difference hidden md:block"
        style={{ left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }}
      />
      <div 
        className={`fixed pointer-events-none z-[998] rounded-full border border-[#ccff00]/30 transition-all duration-300 hidden md:block ${isHovering ? 'w-16 h-16 bg-[#ccff00]/10' : 'w-8 h-8'}`}
        style={{ left: trailing.x, top: trailing.y, transform: 'translate(-50%, -50%)' }}
      />
    </>
  );
};

export default CustomCursor;