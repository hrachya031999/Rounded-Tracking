import React, { useEffect, useRef } from 'react';

const App = () => {
  // --- CONFIGURATION ---
  const ROTATION_DEG = 20;
  
  // Iris/Pupil Size (Visual)
  const IRIS_SIZE = 28; // Diameter
  const PUPIL_RADIUS = IRIS_SIZE / 2; 

  const EYE_OFFSET = 100;
  
  // Left Eye (Smaller)
  const LEFT_EYE_W = 35; 
  const LEFT_EYE_H = 35;
  
  // Right Eye (Larger)
  const RIGHT_EYE_W = 60;
  const RIGHT_EYE_H = 35;
  
  // Physics Settings
  const LERP_FACTOR = 0.15; 

  // --- REFS ---
  const containerRef = useRef(null);
  const targetMouseRef = useRef({ x: 0, y: 0 });
  
  // Current positions (Local coordinates relative to eye center)
  const leftPupilPosRef = useRef({ x: 0, y: 0 });
  const rightPupilPosRef = useRef({ x: 0, y: 0 });
  
  const leftPupilDomRef = useRef(null);
  const rightPupilDomRef = useRef(null);
  const cursorDomRef = useRef(null);

  // --- MATH HELPERS ---

  /**
   * Calculates the target LOCAL position (relative to eye center, aligned with eye rotation).
   */
  const getTargetLocalPosition = (mouseX, mouseY, centerX, centerY, eyeRadX, eyeRadY) => {
    // 1. Effective Movement Radius (so the Iris doesn't clip *too* much, keeps center bounded)
    // We allow it to go slightly further than before for realism, but let's keep it safe
    const effectiveRadX = Math.max(0, eyeRadX - PUPIL_RADIUS);
    const effectiveRadY = Math.max(0, eyeRadY - PUPIL_RADIUS);

    // 2. Vector from eye center to mouse (Screen Space)
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;

    // 3. Un-rotate (Screen Space -> Local Space)
    const angleRad = (ROTATION_DEG * Math.PI) / 180;
    const cos = Math.cos(-angleRad);
    const sin = Math.sin(-angleRad);
    
    // This rotates the vector BACKWARDS to align with the eye's internal axes
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    // 4. Ellipse Constraint Check
    const equation = (localX * localX) / (effectiveRadX * effectiveRadX) + 
                     (localY * localY) / (effectiveRadY * effectiveRadY);

    let constrainedX = localX;
    let constrainedY = localY;

    // Clamp to boundary
    if (equation > 1) {
      const scale = 1 / Math.sqrt(equation);
      constrainedX = localX * scale;
      constrainedY = localY * scale;
    }

    // Return LOCAL coordinates. We do NOT rotate back, because the DOM element is inside the rotated parent!
    return { x: constrainedX, y: constrainedY };
  };

  const lerp = (start, end, factor) => {
    return start + (end - start) * factor;
  };

  // --- ENGINE ---

  useEffect(() => {
    let animationFrameId;

    const handleMouseMove = (e) => {
      targetMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const loop = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const screenCenterX = rect.width / 2;
      const screenCenterY = rect.height / 2;
      
      const mouseX = targetMouseRef.current.x - rect.left;
      const mouseY = targetMouseRef.current.y - rect.top;

      // -- Calculate Eye Centers in Screen Space --
      const angleRad = (ROTATION_DEG * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);

      const leftCenterX = screenCenterX + (-EYE_OFFSET * cos);
      const leftCenterY = screenCenterY + (-EYE_OFFSET * sin);

      const rightCenterX = screenCenterX + (EYE_OFFSET * cos);
      const rightCenterY = screenCenterY + (EYE_OFFSET * sin);

      // -- Calculate Targets (Local Space) --
      const targetLeft = getTargetLocalPosition(
        mouseX, mouseY, 
        leftCenterX, leftCenterY, 
        LEFT_EYE_W, LEFT_EYE_H
      );

      const targetRight = getTargetLocalPosition(
        mouseX, mouseY, 
        rightCenterX, rightCenterY, 
        RIGHT_EYE_W, RIGHT_EYE_H
      );

      // -- Physics (Lerp) --
      leftPupilPosRef.current.x = lerp(leftPupilPosRef.current.x, targetLeft.x, LERP_FACTOR);
      leftPupilPosRef.current.y = lerp(leftPupilPosRef.current.y, targetLeft.y, LERP_FACTOR);

      rightPupilPosRef.current.x = lerp(rightPupilPosRef.current.x, targetRight.x, LERP_FACTOR);
      rightPupilPosRef.current.y = lerp(rightPupilPosRef.current.y, targetRight.y, LERP_FACTOR);

      // -- Render --
      // Since the pupils are inside the rotated parents, we just translate them from the center
      // We use translate(-50%, -50%) to center the element itself, then add our physics offset
      if (leftPupilDomRef.current) {
        leftPupilDomRef.current.style.transform = `translate(-50%, -50%) translate(${leftPupilPosRef.current.x}px, ${leftPupilPosRef.current.y}px)`;
      }

      if (rightPupilDomRef.current) {
        rightPupilDomRef.current.style.transform = `translate(-50%, -50%) translate(${rightPupilPosRef.current.x}px, ${rightPupilPosRef.current.y}px)`;
      }

      if (cursorDomRef.current) {
        cursorDomRef.current.style.transform = `translate(${targetMouseRef.current.x - 6}px, ${targetMouseRef.current.y - 6}px)`;
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full h-screen bg-slate-900 overflow-hidden relative cursor-crosshair flex items-center justify-center"
    >
      <div className="absolute top-4 left-4 text-slate-500 font-mono text-xs pointer-events-none z-10 select-none">
        <h1 className="text-slate-300 font-bold mb-2">Realistic Eye Tracker</h1>
        <p>Rotation: {ROTATION_DEG}°</p>
      </div>

      {/* The "Face" Container - Rotated */}
      <div 
        className="relative flex items-center justify-center pointer-events-none"
        style={{ transform: `rotate(${ROTATION_DEG}deg)` }}
      >
        {/* Left Eye (Sclera) */}
        <div 
          className="relative bg-gray-100 rounded-[50%] overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.25)] border border-gray-300"
          style={{
            width: LEFT_EYE_W * 2,
            height: LEFT_EYE_H * 2,
            marginRight: EYE_OFFSET/2,
            marginLeft: -EYE_OFFSET/2
          }}
        >
            {/* Iris/Pupil - Centered absolutely initially */}
            <div 
                ref={leftPupilDomRef}
                className="absolute top-1/2 left-1/2 rounded-full shadow-md overflow-hidden"
                style={{ width: IRIS_SIZE, height: IRIS_SIZE }}
            >
                {/* Iris Gradient */}
                <div className="w-full h-full bg-blue-500 bg-[radial-gradient(circle_at_center,_#60a5fa_0%,_#2563eb_60%,_#1e3a8a_100%)] relative">
                    {/* Pupil (Black Center) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45%] h-[45%] bg-black rounded-full" />
                    {/* Glint (Reflection) */}
                    <div className="absolute top-[20%] right-[20%] w-[25%] h-[25%] bg-white rounded-full opacity-70 blur-[1px]" />
                </div>
            </div>
        </div>
        
        {/* Right Eye (Sclera) */}
        <div 
          className="relative bg-gray-100 rounded-[50%] overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.25)] border border-gray-300"
          style={{
            width: RIGHT_EYE_W * 2,
            height: RIGHT_EYE_H * 2,
            marginLeft: EYE_OFFSET/2,
            marginRight: -EYE_OFFSET/2
          }}
        >
             {/* Iris/Pupil */}
             <div 
                ref={rightPupilDomRef}
                className="absolute top-1/2 left-1/2 rounded-full shadow-md overflow-hidden"
                style={{ width: IRIS_SIZE, height: IRIS_SIZE }}
            >
                {/* Iris Gradient */}
                <div className="w-full h-full bg-blue-500 bg-[radial-gradient(circle_at_center,_#60a5fa_0%,_#2563eb_60%,_#1e3a8a_100%)] relative">
                    {/* Pupil (Black Center) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45%] h-[45%] bg-black rounded-full" />
                    {/* Glint (Reflection) */}
                    <div className="absolute top-[20%] right-[20%] w-[25%] h-[25%] bg-white rounded-full opacity-70 blur-[1px]" />
                </div>
            </div>
        </div>
      </div>

      {/* The Mouse Cursor */}
      <div
        ref={cursorDomRef}
        className="absolute w-3 h-3 bg-red-500/50 rounded-full pointer-events-none mix-blend-screen z-50 shadow-[0_0_10px_red]"
        style={{ left: 0, top: 0 }}
      />
      
    </div>
  );
};

export default App;
