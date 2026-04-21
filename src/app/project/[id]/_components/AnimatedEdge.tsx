import React, { useRef, useMemo } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath } from '@xyflow/react';

export function AnimatedParticleEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = data?.isActive as boolean;
  const progress = (data?.progress as number) || 0;
  const pathRef = useRef<SVGPathElement>(null);

  // คำนวณตำแหน่งจุดเหลืองตาม progress จริง — ไม่ใช้ useState เพื่อไม่ trigger re-render loop
  const pos = useMemo(() => {
    if (!isActive) return null;
    if (typeof document === 'undefined') return null;
    try {
      const svgNS = 'http://www.w3.org/2000/svg';
      const tempPath = document.createElementNS(svgNS, 'path');
      tempPath.setAttribute('d', edgePath);
      const totalLen = tempPath.getTotalLength();
      if (totalLen === 0) return null;
      const pt = tempPath.getPointAtLength(progress * totalLen);
      return { x: pt.x, y: pt.y };
    } catch {
      return null;
    }
  }, [isActive, progress, edgePath]);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: isActive ? 2.5 : 1.5,
          stroke: isActive ? '#3498db' : '#bdc3c7',
          transition: 'stroke 0.4s, stroke-width 0.4s',
        }}
        id={id}
      />

      {/* จุดเหลืองวิ่งตาม progress จาก simulation engine ตรงๆ และซ่อนตอนสุดสาย (progress >= 1) เพื่อไม่ให้ดูค้าง */}
      {isActive && pos && progress < 1 && progress > 0 && (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={5}
          fill="#f1c40f"
          style={{ filter: 'drop-shadow(0 0 3px #f39c12)' }}
        />
      )}
    </>
  );
}
