"use client";

import { motion } from 'framer-motion';
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    Node,
    Edge,
    useNodesState,
    useEdgesState,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface HeroSectionProps {
  onCreateClick?: () => void;
}

const heroNodes: Node[] = [
    {
    id: '1',
    position: { x: 40, y: 70 },
    data: {
        label: (
        <div style={{ minWidth: 158 }}>
            <div
            style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f1f5f9',}}
        >
            <div style={{ width: 12, height: 12, borderRadius: 3, background: '#dcfce7', border: '2px solid #4ade80', flexShrink: 0,}}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#34495e' }}>
              start
            </span>
          </div>
        </div>
      ),
    },
    style: { background: 'white', border: '2px solid #4ade80', borderRadius: 8, padding: 0, overflow: 'hidden',boxShadow: '0 4px 18px rgba(0,0,0,0.07)',
    },
        },
    {
    id: '2',
    position: { x: 230, y: 205 },
    data: {
        label: (
        <div style={{ minWidth: 170 }}>
          <div
            style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f1f5f9', }}
          >
            <div
              style={{ width: 12,height: 12,borderRadius: 3, background: 'rgba(251, 0, 0, 0.49)', border: '2px solid rgb(251, 0, 0)', flexShrink: 0,}}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#34495e' }}>
              process
            </span>
          </div>
        </div>
      ),
    },
    style: { background: 'white', border: '2px solid rgb(251, 0, 0)', borderRadius: 8, padding: 0, overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.07)',},
  },
  {
    id: '3',
    position: { x: 430, y: 70 },
    data: {
      label: (
        <div style={{ minWidth: 158 }}>
          <div style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f1f5f9',}}
          >
            <div
              style={{ width: 12, height: 12, borderRadius: 3, background: '#a8a3b58d', border: '2px solid #a8a3b5', flexShrink: 0,}}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#34495e' }}>
              Stop
            </span>
        </div>
    </div>
      ),
    },
    style: { background: 'white', border: '2px solid #a8a3b5', borderRadius: 8, padding: 0, overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.07)',},
  },
];

const heroEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    style: { stroke: '#e1cbcb', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#cbd5e1', width: 14, height: 14 },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    animated: true,
    style: { stroke: '#cbd5e1', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#cbd5e1', width: 14, height: 14 },
  },
];


export function HeroSection({ onCreateClick }: HeroSectionProps) {
  const [nodes, , onNodesChange] = useNodesState(heroNodes);
  const [edges, , onEdgesChange] = useEdgesState(heroEdges);

  return (
    <div className="relative w-full overflow-hidden min-h-screen">
      {/*Background */}
      <div className="absolute" />

      {/* Split layout*/}
      <div className="relative flex items-center max-w-7xl mx-auto px-8 min-h-screen gap-16">

        {/*Left side*/}
        <div className="flex-[0_0_44%] z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-8 font-bold text-6xl md:text-7xl leading-[1.1] text-gray-900 tracking-tight"
          >
            Optimize, <br />
            Outperform
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-lg md:text-xl mb-16 text-gray-500 max-w-160 font-medium"
          >
            Design, simulate, and optimize your production lines effortlessly.
            Bridge the gap between planning and reality.
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={onCreateClick}
            className="text-lg text-white font-semibold bg-gray-900 px-12 py-5 rounded-full cursor-pointer hover:bg-gray-800 shadow-xl hover:shadow-2xl transition-all"
          >
            Get Started
          </motion.button>
        </div>

        {/*Right React Flow*/}
        <motion.div
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
          className="flex-1 relative rounded-2xl overflow-hidden border border-gray-200 shadow-lg"
          style={{ height: 520 }}
        >
          {/* Soft blue */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background:
                'radial-gradient(ellipse at 50% 40%, rgba(219,234,254,0.40) 0%, transparent 68%)',
            }}
          />

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{ padding: 0.38 }}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            zoomOnScroll={false}
            zoomOnPinch={false}
            preventScrolling={false}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
            />
          </ReactFlow>
        </motion.div>
      </div>
    </div>
  );
}