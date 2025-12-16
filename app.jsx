import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [constrainedPos, setConstrainedPos] = useState({ x: 0, y: 0 });
  
  // Configuration
  const ROTATION_DEG = 20;
  const RADIUS_X = 300; // Major axis
  const RADIUS_Y = 150; // Minor axis
  
  // We need a ref for the container to calculate center relative to window size
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // 1. Get raw mouse position relative to center
      const rawX = e.clientX - rect.left - centerX;
      const rawY = e.clientY - rect.top - centerY;

      // 2. Un-rotate the point to align with standard axis (rotate by -20deg)
      // Convert degrees to radians
      const angleRad = (ROTATION_DEG * Math.PI) / 180;
      const cos = Math.cos(-angleRad);
      const sin = Math.sin(-angleRad);

      const unrotatedX = rawX * cos - rawY * sin;
      const unrotatedY = rawX * sin + rawY * cos;

      // 3. Check ellipse constraint: (x/a)^2 + (y/b)^2 <= 1
      // If result > 1, the point is outside, so we scale it back to the boundary.
      const equation = (unrotatedX * unrotatedX) / (RADIUS_X * RADIUS_X) + 
                       (unrotatedY * unrotatedY) / (RADIUS_Y * RADIUS_Y);

      let finalLocalX = unrotatedX;
      let finalLocalY = unrotatedY;

      if (equation > 1) {
        const scale = 1 / Math.sqrt(equation);
        finalLocalX = unrotatedX * scale;
        finalLocalY = unrotatedY * scale;
      }

      // 4. Rotate back to original coordinate system (+20deg)
      const cosBack = Math.cos(angleRad);
      const sinBack = Math.sin(angleRad);

      const rotatedX = finalLocalX * cosBack - finalLocalY * sinBack;
      const rotatedY = finalLocalX * sinBack + finalLocalY * cosBack;

      // 5. Update state (adding center offset back)
      setMousePos({ x: e.clientX, y: e.clientY });
      setConstrainedPos({ 
        x: centerX + rotatedX, 
        y: centerY + rotatedY 
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full h-screen bg-slate-900 overflow-hidden relative cursor-crosshair flex items-center justify-center"
    >
      {/* UI Info */}
    

      {/* Visual Guide: The Ellipse Boundary */}
      <div 
        className="absolute border-2 border-dashed border-slate-600 rounded-[50%]"
        style={{
          width: RADIUS_X * 2,
          height: RADIUS_Y * 2,
          transform: `rotate(${ROTATION_DEG}deg)`,
          pointerEvents: 'none'
        }}
      />

      {/* Connection Line (Visualization only) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <line 
          x1={mousePos.x} 
          y1={mousePos.y} 
          x2={constrainedPos.x} 
          y2={constrainedPos.y} 
          stroke="white" 
          strokeWidth="1" 
          strokeDasharray="4"
        />
      </svg>

      {/* The Constrained Element (Follower) */}
      <div
        className="absolute w-8 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] border-2 border-white pointer-events-none transition-transform duration-75 ease-linear"
        style={{
          left: 0,
          top: 0,
          transform: `translate(${constrainedPos.x - 16}px, ${constrainedPos.y - 16}px)`
        }}
      />

      {/* The Mouse Cursor (Visual Tracker) */}

    </div>
  );
};

export default App;