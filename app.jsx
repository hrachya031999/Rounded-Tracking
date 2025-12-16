import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [leftEyePos, setLeftEyePos] = useState({ x: 0, y: 0 });
  const [rightEyePos, setRightEyePos] = useState({ x: 0, y: 0 });
  
  // Configuration
  const ROTATION_DEG = 20;
  const EYE_RADIUS_X = 60;  // Width of the eye
  const EYE_RADIUS_Y = 35;  // Height of the eye
  const EYE_OFFSET = 100;   // Distance from center to each eye
  
  const containerRef = useRef(null);

  // Helper function to calculate constrained position for a single eye
  const getConstrainedPoint = (mouseX, mouseY, centerX, centerY, radX, radY, rotation) => {
    // 1. Vector from specific eye center to mouse
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;

    // 2. Un-rotate (align with local ellipse axis)
    const angleRad = (rotation * Math.PI) / 180;
    const cos = Math.cos(-angleRad);
    const sin = Math.sin(-angleRad);
    
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    // 3. Ellipse Constraint Check
    const equation = (localX * localX) / (radX * radX) + 
                     (localY * localY) / (radY * radY);

    let constrainedLocalX = localX;
    let constrainedLocalY = localY;

    if (equation > 1) {
      const scale = 1 / Math.sqrt(equation);
      constrainedLocalX = localX * scale;
      constrainedLocalY = localY * scale;
    }

    // 4. Rotate back
    const cosBack = Math.cos(angleRad);
    const sinBack = Math.sin(angleRad);

    const finalX = constrainedLocalX * cosBack - constrainedLocalY * sinBack;
    const finalY = constrainedLocalX * sinBack + constrainedLocalY * cosBack;

    return { x: centerX + finalX, y: centerY + finalY };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const screenCenterX = rect.width / 2;
      const screenCenterY = rect.height / 2;

      // Calculate the centers of the two eyes based on "Face" rotation
      // The eyes are offset along the X axis, then that axis is rotated.
      const angleRad = (ROTATION_DEG * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);

      // Left Eye Center (Offset is -EYE_OFFSET)
      const leftCenterX = screenCenterX + (-EYE_OFFSET * cos);
      const leftCenterY = screenCenterY + (-EYE_OFFSET * sin);

      // Right Eye Center (Offset is +EYE_OFFSET)
      const rightCenterX = screenCenterX + (EYE_OFFSET * cos);
      const rightCenterY = screenCenterY + (EYE_OFFSET * sin);

      // Get raw mouse relative to container top-left (for visual tracker)
      const relativeMouseX = e.clientX - rect.left;
      const relativeMouseY = e.clientY - rect.top;

      // Calculate Constraints
      const leftPos = getConstrainedPoint(
        relativeMouseX, relativeMouseY, 
        leftCenterX, leftCenterY, 
        EYE_RADIUS_X, EYE_RADIUS_Y, 
        ROTATION_DEG
      );

      const rightPos = getConstrainedPoint(
        relativeMouseX, relativeMouseY, 
        rightCenterX, rightCenterY, 
        EYE_RADIUS_X, EYE_RADIUS_Y, 
        ROTATION_DEG
      );

      setMousePos({ x: e.clientX, y: e.clientY });
      setLeftEyePos(leftPos);
      setRightEyePos(rightPos);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate eye center positions for rendering the static boundaries
  // We do this just for the CSS positioning of the "sockets"
  const getEyeStyle = (direction) => {
    const dir = direction === 'left' ? -1 : 1;
    return {
      width: EYE_RADIUS_X * 2,
      height: EYE_RADIUS_Y * 2,
      // We use margin to offset from absolute center, then rotate the whole container
      marginLeft: dir * EYE_OFFSET * 2 // simplistic positioning relative to center container
    };
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-screen bg-slate-900 overflow-hidden relative cursor-crosshair flex items-center justify-center"
    >
      <div className="absolute top-4 left-4 text-slate-400 font-mono text-sm pointer-events-none z-10">
        <p>Rotated Face Experiment</p>
        <p>Rotation: {ROTATION_DEG}°</p>
      </div>

      {/* The "Face" Container - Rotated */}
      <div 
        className="relative flex items-center justify-center"
        style={{ transform: `rotate(${ROTATION_DEG}deg)` }}
      >
        {/* Left Eye Boundary */}
        <div 
          className="border-2 border-dashed border-slate-600 rounded-[50%]"
          style={{
            width: EYE_RADIUS_X * 2,
            height: EYE_RADIUS_Y * 2,
            marginRight: EYE_OFFSET/2, // Visual spacing
            marginLeft: -EYE_OFFSET/2
          }}
        />
        
        {/* Right Eye Boundary */}
        <div 
          className="border-2 border-dashed border-slate-600 rounded-[50%]"
          style={{
            width: EYE_RADIUS_X * 2,
            height: EYE_RADIUS_Y * 2,
            marginLeft: EYE_OFFSET/2, // Visual spacing
            marginRight: -EYE_OFFSET/2
          }}
        />
      </div>

      {/* Left Pupil (Absolute positioned based on calculated logic) */}
      <div
        className="absolute w-6 h-6 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)] pointer-events-none transition-transform duration-75 ease-linear"
        style={{
          left: 0,
          top: 0,
          transform: `translate(${leftEyePos.x - 12}px, ${leftEyePos.y - 12}px)`
        }}
      />

      {/* Right Pupil (Absolute positioned based on calculated logic) */}
      <div
        className="absolute w-6 h-6 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)] pointer-events-none transition-transform duration-75 ease-linear"
        style={{
          left: 0,
          top: 0,
          transform: `translate(${rightEyePos.x - 12}px, ${rightEyePos.y - 12}px)`
        }}
      />

      {/* The Mouse Cursor (Visual Tracker) */}
      <div
        className="absolute w-3 h-3 bg-red-500 rounded-full pointer-events-none opacity-50 mix-blend-screen z-50"
        style={{
          left: 0,
          top: 0,
          transform: `translate(${mousePos.x - 6}px, ${mousePos.y - 6}px)`
        }}
      />
      
      {/* Visual Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
        <line x1={leftEyePos.x} y1={leftEyePos.y} x2={mousePos.x} y2={mousePos.y} stroke="white" strokeDasharray="4"/>
        <line x1={rightEyePos.x} y1={rightEyePos.y} x2={mousePos.x} y2={mousePos.y} stroke="white" strokeDasharray="4"/>
      </svg>
    </div>
  );
};

export default App;