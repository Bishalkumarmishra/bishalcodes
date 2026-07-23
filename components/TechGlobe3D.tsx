import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { OrbitControls, Html as DreiHtml, Float } from '@react-three/drei';
import * as THREE from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}

const TECHS = [
  { name: 'Next.js', desc: 'React framework for production', color: 'from-black to-slate-800 text-white' },
  { name: 'React', desc: 'UI component library', color: 'from-sky-400 to-blue-600 text-white' },
  { name: 'TailwindCSS', desc: 'Utility-first CSS styling', color: 'from-cyan-400 to-teal-500 text-white' },
  { name: 'Firebase', desc: 'BaaS database & auth', color: 'from-amber-400 to-orange-500 text-white' },
  { name: 'TypeScript', desc: 'Typed javascript scripting', color: 'from-blue-500 to-indigo-600 text-white' },
  { name: 'Node.js', desc: 'JavaScript runtime environment', color: 'from-green-500 to-emerald-600 text-white' },
  { name: 'Three.js', desc: '3D WebGL rendering engine', color: 'from-indigo-500 to-purple-600 text-white' },
  { name: 'Python', desc: 'General automation & backend', color: 'from-blue-400 to-yellow-500 text-slate-900' },
  { name: 'Git & GitHub', desc: 'Version control & pipelines', color: 'from-orange-500 to-red-600 text-white' },
  { name: 'CSS3', desc: 'Cascading stylesheets', color: 'from-blue-400 to-indigo-500 text-white' },
  { name: 'HTML5', desc: 'Semantic web structuring', color: 'from-orange-500 to-red-500 text-white' }
];

// Fibonacci sphere algorithm to distribute points evenly
const getSpherePoints = (count: number, radius: number) => {
  const points: [number, number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    points.push([x * radius, y * radius, z * radius]);
  }
  return points;
};

const RotatingGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08; // smooth slow auto-rotate
      groupRef.current.rotation.x += delta * 0.03;
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

const TechBadge: React.FC<{ 
  name: string; 
  desc: string; 
  color: string; 
  position: [number, number, number] 
}> = ({ name, desc, color, position }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4} position={position}>
      {/* 3D mesh node */}
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={hovered ? "#6366f1" : "#cbd5e1"} />
      </mesh>
      
      {/* Interactive HTML Card */}
      <DreiHtml distanceFactor={4} position={[0, 0.2, 0]} center>
        <div 
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`px-3 py-1.5 rounded-xl border bg-gradient-to-br ${color} border-slate-200/20 shadow-lg cursor-pointer transition-all duration-300 select-none ${
            hovered ? 'scale-110 ring-4 ring-[#e52521]/30' : 'scale-100 opacity-90'
          }`}
          style={{ transformOrigin: 'center center' }}
        >
          <div className="font-bold text-[10px] tracking-wider whitespace-nowrap uppercase">
            {name}
          </div>
          {hovered && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-950/90 text-white text-[8px] p-2 rounded-lg border border-slate-800 shadow-xl whitespace-nowrap z-50">
              {desc}
            </div>
          )}
        </div>
      </DreiHtml>
    </Float>
  );
};

const TechGlobe3D: React.FC = () => {
  const radius = 2.2;
  const positions = useMemo(() => getSpherePoints(TECHS.length, radius), [radius]);

  return (
    <div className="w-full h-[360px] sm:h-[420px] bg-black border border-neutral-800 rounded-3xl overflow-hidden relative shadow-sm">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#915eff 1px, transparent 1px), linear-gradient(90deg, #915eff 1px, transparent 1px)`,
          backgroundSize: '25px 25px'
        }}
      />
      
      <Canvas camera={{ position: [0, 0, 4.5], fov: 60 }} dpr={[1, 2]}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        
        <RotatingGroup>
          {TECHS.map((tech, index) => (
            <TechBadge 
              key={tech.name} 
              name={tech.name} 
              desc={tech.desc} 
              color={tech.color} 
              position={positions[index]} 
            />
          ))}
        </RotatingGroup>
        
        <OrbitControls enableZoom={false} autoRotate={false} />
      </Canvas>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-neutral-800 text-[9px] font-semibold text-neutral-400 uppercase tracking-widest pointer-events-none shadow-sm">
        Drag to Orbit &bull; Hover to Inspect
      </div>
    </div>
  );
};

export default TechGlobe3D;
