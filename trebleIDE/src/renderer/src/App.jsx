import React, { useState, useRef, useEffect } from 'react';
import { Settings, Play, ArrowLeft, Plus, Move, FileJson, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Volume2, Square } from 'lucide-react';

// --- Default Starting State ---
const INITIAL_NODE = {
  id: 'root',
  x: 0,
  y: 0,
  title: 'Start',
  text: 'You are walking down the grocery aisle. The fluorescent lights hum above you.',
};

export default function App() {
  const [nodes, setNodes] = useState([INITIAL_NODE]);
  const [connections, setConnections] = useState([]);

  // App State: 'graph' or 'editor'
  const [view, setView] = useState('graph');
  const [activeNodeId, setActiveNodeId] = useState('root');

  // TTS State
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);

  // Panning & Dragging State
  const [pan, setPan] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);

  const containerRef = useRef(null);

  // --- Graph Interactions ---
  const handlePointerDown = (e) => {
    if (e.target.closest('.node-circle')) return; // Let the node handle its own drag
    setIsPanning(true);
    containerRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (isPanning) {
      setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    } else if (draggedNode) {
      setNodes(prev => prev.map(n =>
        n.id === draggedNode ? { ...n, x: n.x + e.movementX, y: n.y + e.movementY } : n
      ));
    }
  };

  const handlePointerUp = (e) => {
    setIsPanning(false);
    setDraggedNode(null);
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const handleNodePointerDown = (e, id) => {
    e.stopPropagation();
    // Differentiate between click (to open) and drag
    setDraggedNode(id);
  };

  const handleNodeClick = (id) => {
    // Only open editor if we didn't drag it significantly
    // For simplicity in this prototype, dragging also selects, but a button opens the editor
    setActiveNodeId(id);
    setView('editor');
  };

  // --- Graph Mathematics ---
  const NODE_RADIUS = 40;

  // --- Editor Functions ---
  const activeNode = nodes.find(n => n.id === activeNodeId) || nodes[0];

  const updateActiveNode = (updates) => {
    setNodes(prev => prev.map(n => n.id === activeNodeId ? { ...n, ...updates } : n));
  };

  const getChildInDirection = (dir) => {
    const conn = connections.find(c => c.from === activeNodeId && c.dir === dir);
    return conn ? nodes.find(n => n.id === conn.to) : null;
  };

  const createBranch = (dir) => {
    const newId = Math.random().toString(36).substr(2, 9);

    // Auto-position based on direction
    let offsetX = 0;
    let offsetY = 0;
    const SPACING = 200;
    if (dir === 'up') offsetY = -SPACING;
    if (dir === 'down') offsetY = SPACING;
    if (dir === 'left') offsetX = -SPACING;
    if (dir === 'right') offsetX = SPACING;

    const newNode = {
      id: newId,
      x: activeNode.x + offsetX,
      y: activeNode.y + offsetY,
      title: `New ${dir} node`,
      text: `You moved ${dir}. What happens next?`,
    };

    setNodes(prev => [...prev, newNode]);
    setConnections(prev => [...prev, { from: activeNodeId, to: newId, dir }]);
  };

  const removeBranch = (dir) => {
    const conn = connections.find(c => c.from === activeNodeId && c.dir === dir);
    if (conn) {
      setConnections(prev => prev.filter(c => c !== conn));
      // Note: We leave the node intact in case other things connect to it,
      // but you could also garbage collect orphaned nodes here.
    }
  };

  // --- TTS Functions ---
  const playTTS = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsPlayingTTS(false);
      setIsPlayingTTS(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser/environment.");
    }
  };

  const stopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
    }
  };

  // --- Renderers ---
  const renderGraph = () => (
    <div
      className="relative w-full h-full overflow-hidden bg-slate-900 cursor-grab active:cursor-grabbing"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        backgroundPosition: `${pan.x}px ${pan.y}px`
      }}
    >
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
      >
        {/* Draw Connections */}
        <svg className="absolute top-0 left-0 w-full h-full overflow-visible">
          {connections.map((conn, idx) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            // Arrow logic
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const angle = Math.atan2(dy, dx);

            // Start line outside the radius of the circle
            const startX = fromNode.x + Math.cos(angle) * NODE_RADIUS;
            const startY = fromNode.y + Math.sin(angle) * NODE_RADIUS;
            const endX = toNode.x - Math.cos(angle) * (NODE_RADIUS + 10); // +10 for arrow head room
            const endY = toNode.y - Math.sin(angle) * (NODE_RADIUS + 10);

            let strokeColor = "#94a3b8"; // slate-400
            if (conn.dir === 'up') strokeColor = "#3b82f6"; // blue
            if (conn.dir === 'down') strokeColor = "#eab308"; // yellow
            if (conn.dir === 'left') strokeColor = "#ef4444"; // red
            if (conn.dir === 'right') strokeColor = "#22c55e"; // green

            return (
              <g key={`${conn.from}-${conn.to}-${idx}`}>
                <defs>
                  <marker id={`arrow-${conn.dir}`} markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill={strokeColor} />
                  </marker>
                </defs>
                <line
                  x1={startX} y1={startY}
                  x2={endX} y2={endY}
                  stroke={strokeColor}
                  strokeWidth="3"
                  markerEnd={`url(#arrow-${conn.dir})`}
                />
              </g>
            );
          })}
        </svg>

        {/* Draw Nodes */}
        {nodes.map(node => (
          <div
            key={node.id}
            className="node-circle absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
            style={{ left: node.x, top: node.y }}
            onPointerDown={(e) => handleNodePointerDown(e, node.id)}
            onDoubleClick={() => handleNodeClick(node.id)}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-transform duration-100 ${draggedNode === node.id ? 'scale-110 cursor-grabbing bg-indigo-500' : 'cursor-grab bg-slate-700 hover:bg-slate-600 border-2 border-slate-500 hover:border-indigo-400'}`}>
               <span className="text-xs font-bold text-center px-2 truncate w-full">{node.title}</span>
            </div>

            {/* Context menu that appears on hover */}
            <div className="absolute top-24 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2 bg-slate-800 p-1 rounded-md shadow-lg border border-slate-700">
              <button
                onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded"
              >
                Edit Content
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Graph UI */}
      <div className="absolute bottom-6 left-6 text-slate-400 text-sm bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700 backdrop-blur-sm pointer-events-none">
        Drag canvas to pan • Drag nodes to move • Double-click node to edit
      </div>
    </div>
  );

  const DirectionCard = ({ dir, icon: Icon, label }) => {
    const childNode = getChildInDirection(dir);

    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute top-2 left-2 flex items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
          <Icon size={14} className="mr-1" /> {label}
        </div>

        {childNode ? (
          <div className="mt-4 flex flex-col items-center w-full">
            <span className="text-white text-sm mb-3 font-medium truncate w-full text-center">{childNode.title}</span>
            <div className="flex space-x-2 w-full">
              <button
                onClick={() => setActiveNodeId(childNode.id)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-sm transition-colors"
              >
                Go To Node
              </button>
              <button
                onClick={() => removeBranch(dir)}
                className="bg-red-900/50 text-red-400 hover:bg-red-600 hover:text-white p-2 rounded transition-colors"
                title="Remove connection"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => createBranch(dir)}
            className="mt-4 w-full border-2 border-dashed border-slate-600 hover:border-slate-400 text-slate-400 hover:text-white py-3 rounded-lg flex flex-col items-center transition-colors"
          >
            <Plus size={20} className="mb-1" />
            <span className="text-xs">Create Branch</span>
          </button>
        )}
      </div>
    );
  };

  const renderEditor = () => (
    <div className="flex w-full h-full bg-slate-900 overflow-hidden">
      {/* Left Column: Node Content */}
      <div className="w-1/2 p-8 border-r border-slate-800 flex flex-col h-full overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Settings className="mr-3 text-indigo-400" />
          Node Settings
        </h2>

        <label className="text-slate-400 text-sm mb-2 font-medium">Node Title</label>
        <input
          type="text"
          value={activeNode.title}
          onChange={(e) => updateActiveNode({ title: e.target.value })}
          className="bg-slate-800 text-white border border-slate-700 rounded-lg p-3 mb-6 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
          placeholder="e.g. The Tavern Entrance"
        />

        <label className="text-slate-400 text-sm mb-2 font-medium">Narrative Text (Audio Fallback)</label>
        <textarea
          value={activeNode.text}
          onChange={(e) => updateActiveNode({ text: e.target.value })}
          className="bg-slate-800 text-white border border-slate-700 rounded-lg p-3 h-40 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow resize-none"
          placeholder="Write the descriptive text here..."
        />

        {/* TTS Controls */}
        <div className="flex items-center space-x-3 mb-6">
          <button
            onClick={() => isPlayingTTS ? stopTTS() : playTTS(activeNode.text)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isPlayingTTS ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
          >
            {isPlayingTTS ? <Square size={16} className="mr-2" /> : <Volume2 size={16} className="mr-2" />}
            {isPlayingTTS ? 'Stop Playback' : 'Listen to Narrative'}
          </button>
          <span className="text-slate-500 text-xs">
            Uses system Text-to-Speech to preview the node's narrative.
          </span>
        </div>
      </div>

      {/* Right Column: Branching Logic */}
      <div className="w-1/2 p-8 bg-slate-900/50 flex flex-col h-full">
        <h2 className="text-2xl font-bold text-white mb-2">Joystick Branches</h2>
        <p className="text-slate-400 text-sm mb-8">Define what happens when the user pushes the joystick from this node.</p>

        {/* D-Pad Layout */}
        <div className="grid grid-cols-3 grid-rows-3 gap-4 flex-1 max-h-[500px]">
          <div className="col-start-2 row-start-1">
            <DirectionCard dir="up" icon={ChevronUp} label="Push Up" />
          </div>
          <div className="col-start-1 row-start-2">
            <DirectionCard dir="left" icon={ChevronLeft} label="Push Left" />
          </div>
          <div className="col-start-2 row-start-2 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-700 border-4 border-slate-600 shadow-inner flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-slate-800 shadow-sm"></div>
            </div>
          </div>
          <div className="col-start-3 row-start-2">
            <DirectionCard dir="right" icon={ChevronRight} label="Push Right" />
          </div>
          <div className="col-start-2 row-start-3">
            <DirectionCard dir="down" icon={ChevronDown} label="Push Down" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen flex flex-col font-sans bg-slate-950">
      {/* Top Toolbar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            <Move size={18} className="text-white" />
          </div>
          <h1 className="text-white font-bold tracking-wide">AudioBook IDE</h1>
        </div>

        <div className="flex items-center space-x-3">
          {view === 'editor' && (
            <button
              onClick={() => setView('graph')}
              className="flex items-center text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Graph
            </button>
          )}

          <button
            className="flex items-center text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-md transition-colors text-sm font-medium shadow-sm"
            onClick={() => {
              const exportData = { nodes, connections };
              console.log(JSON.stringify(exportData, null, 2));
              alert("JSON Payload generated! Check browser console. This is what we will send to the ESP32.");
            }}
          >
            <FileJson size={16} className="mr-2" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {view === 'graph' ? renderGraph() : renderEditor()}
      </div>
    </div>
  );
}

