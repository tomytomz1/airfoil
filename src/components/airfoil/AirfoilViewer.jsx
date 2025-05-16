// src/components/airfoil/AirfoilViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

const AirfoilViewer = ({ name, coordinates, description = "" }) => {
  // --- State Management ---
  // Core Model Parameters
  const [currentChordLength, setCurrentChordLength] = useState(1.0);
  const [currentWingLength, setCurrentWingLength] = useState(5.0);
  
  // Wing Configuration Parameters
  const [wingspan, setWingspan] = useState(10.0);
  const [rootChord, setRootChord] = useState(1.0);
  const [tipChord, setTipChord] = useState(0.6);
  const [sweepAngle, setSweepAngle] = useState(15);
  const [dihedralAngle, setDihedralAngle] = useState(5);
  const [twistAngle, setTwistAngle] = useState(-2);
  
  // We'll extract these from the name if it's a NACA airfoil, otherwise use defaults
  const [camber, setCamber] = useState(0); 
  const [thickness, setThickness] = useState(12.0);
  
  // Visualization Modes
  const [showWireframe, setShowWireframe] = useState(false);
  const [showFlowLines, setShowFlowLines] = useState(false);
  const [meshQuality, setMeshQuality] = useState('medium');
  const [lightingPreset, setLightingPreset] = useState('studio');
  
  // Material Properties
  const [surfaceRoughness, setSurfaceRoughness] = useState(0.2);
  const [materialMetalness, setMaterialMetalness] = useState(0.5);
  const [materialColor, setMaterialColor] = useState('#e0e0e0');
  
  // Winglet Configuration
  const [hasWinglets, setHasWinglets] = useState(false);
  const [wingletType, setWingletType] = useState("Split Scimitar Winglet");
  const [wingletAngle, setWingletAngle] = useState(75);
  const [secondaryWingletAngle, setSecondaryWingletAngle] = useState(60);
  const [wingletHeight, setWingletHeight] = useState(8);
  const [wingletCantAngle, setWingletCantAngle] = useState(15);
  
  // Export Settings
  const [exportFormat, setExportFormat] = useState('stl');
  
  // Performance Monitoring
  const [frameRate, setFrameRate] = useState(60);
  
  // Active accordion sections
  const [activeSections, setActiveSections] = useState({
    wingConfig: true,
    visualization: false,
    materials: false,
    winglets: false,
    export: false
  });
  
  // --- Three.js References ---
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const airfoilRef = useRef(null);
  const flowLinesRef = useRef(null);
  const framesRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  
  // Extract airfoil data from name on component mount
  useEffect(() => {
    // Parse airfoil data from name if it's a NACA 4-digit airfoil
    if (name && name.toUpperCase().includes('NACA') && name.length >= 8) {
      const digits = name.slice(-4);
      if (digits.length === 4 && !isNaN(parseInt(digits))) {
        // For NACA 4-digit airfoils: first digit is camber %, second is position of max camber (tenths of chord)
        const camberPercent = parseInt(digits[0]);
        setCamber(camberPercent);
        
        // Last two digits are thickness in % of chord
        const thicknessPercent = parseInt(digits.slice(2));
        setThickness(thicknessPercent);
      }
    }
  }, [name]);
  
  // --- Derived Calculations ---
  const taperRatio = tipChord / rootChord;
  const wingArea = (rootChord + tipChord) * wingspan / 2;
  const aspectRatio = (wingspan * wingspan) / wingArea;
  const meanAerodynamicChord = (2/3) * rootChord * ((1 + taperRatio + taperRatio*taperRatio) / (1 + taperRatio));
  const wingLoading = 80 * 9.81 / wingArea; // Assuming 80kg aircraft weight

  // Aerodynamic estimates
  const estimatedStallSpeed = Math.sqrt((2 * wingLoading) / (1.225 * 1.4)).toFixed(1);
  const estimatedMaxLD = (aspectRatio * 0.9).toFixed(1);

  // Toggle accordion sections
  const toggleSection = (section) => {
    setActiveSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle model updates
  const handleUpdateModel = () => {
    // Update 3D model based on wing configuration
    setCurrentChordLength(rootChord);
    setCurrentWingLength(wingspan / 2); // Half wingspan for the model
    createAirfoilModel();
  };

  // Handle view reset
  const handleResetView = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(3, 2.5, 3);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };
  
  // Calculate performance impact of winglets
  const getWingletPerformance = () => {
    if (!hasWinglets) return { drag: 0, efficiency: 0, range: 0, fuel: 0 };
    
    let dragReduction = 3.0;
    let efficiencyGain = 2.0;
    let rangeIncrease = 3.5;
    let fuelSavings = 2.0;
    
    const typeMultipliers = {
      "Standard Winglet": { drag: 1.0, efficiency: 1.0, range: 1.0, fuel: 1.0 },
      "Split Scimitar Winglet": { drag: 1.6, efficiency: 1.6, range: 1.45, fuel: 1.45 },
      "Blended Winglet": { drag: 1.3, efficiency: 1.3, range: 1.25, fuel: 1.2 },
      "Raked Winglet": { drag: 1.4, efficiency: 1.2, range: 1.3, fuel: 1.3 },
      "Sharklet": { drag: 1.5, efficiency: 1.4, range: 1.4, fuel: 1.35 }
    };
    
    const multiplier = typeMultipliers[wingletType] || typeMultipliers["Standard Winglet"];
    dragReduction *= multiplier.drag;
    efficiencyGain *= multiplier.efficiency;
    rangeIncrease *= multiplier.range;
    fuelSavings *= multiplier.fuel;
    
    const heightFactor = wingletHeight / 8;
    const angleFactor = wingletAngle / 75;
    const cantFactor = wingletCantAngle / 15;
    
    dragReduction *= (heightFactor * 0.6 + angleFactor * 0.2 + cantFactor * 0.2);
    efficiencyGain *= (heightFactor * 0.5 + angleFactor * 0.3 + cantFactor * 0.2);
    rangeIncrease *= (heightFactor * 0.6 + angleFactor * 0.2 + cantFactor * 0.2);
    fuelSavings *= (heightFactor * 0.6 + angleFactor * 0.2 + cantFactor * 0.2);
    
    return {
      drag: dragReduction.toFixed(1),
      efficiency: efficiencyGain.toFixed(1),
      range: rangeIncrease.toFixed(1),
      fuel: fuelSavings.toFixed(1)
    };
  };
  
  const wingletPerformance = getWingletPerformance();
  
  // --- Airfoil Profile Data ---
  const getAirfoilProfile = () => {
    // Use provided coordinates - this is now the ONLY source of airfoil geometry
    if (!coordinates || coordinates.length === 0) {
      console.error("No airfoil coordinates provided");
      return [];
    }
    
    // Convert to THREE.Vector2 format
    return coordinates.map(point => new THREE.Vector2(point[0], point[1]));
  };
  
  // --- Three.js Setup ---
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1a2a); // Deep blue background
    sceneRef.current = scene;
    
    // Create camera
    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(3, 2.5, 3);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    
    // Append renderer to DOM
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    
    // Setup lighting
    setupLighting(lightingPreset);
    
    // Create initial model
    createAirfoilModel();
    
    // Animation loop
    const animate = () => {
      const now = Date.now();
      framesRef.current++;
      
      if (now - lastTimeRef.current >= 1000) {
        // Calculate FPS
        setFrameRate(framesRef.current);
        
        // Reset counters
        framesRef.current = 0;
        lastTimeRef.current = now;
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      requestAnimationFrame(animate);
    };
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    
    // Add interactive controls
    setupControls();
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current) {
        if (rendererRef.current && rendererRef.current.domElement) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      
      if (sceneRef.current) {
        while(sceneRef.current.children.length > 0) { 
          const object = sceneRef.current.children[0];
          sceneRef.current.remove(object);
        }
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);
  
  // Setup lighting based on preset
  const setupLighting = (preset) => {
    if (!sceneRef.current) return;
    
    // Clear existing lights
    sceneRef.current.children = sceneRef.current.children.filter(child => !(child instanceof THREE.Light));
    
    if (preset === 'studio') {
      // Key light
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
      keyLight.position.set(2, 3, 5);
      sceneRef.current.add(keyLight);
      
      // Fill light
      const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
      fillLight.position.set(-3, 2, 3);
      sceneRef.current.add(fillLight);
      
      // Rim light
      const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
      rimLight.position.set(0, -1, -3);
      sceneRef.current.add(rimLight);
      
      // Bottom light
      const bottomLight = new THREE.DirectionalLight(0xffffff, 0.8);
      bottomLight.position.set(0, -3, 2);
      sceneRef.current.add(bottomLight);
      
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      sceneRef.current.add(ambientLight);
    } 
    else if (preset === 'outdoor') {
      // Sun light
      const sunLight = new THREE.DirectionalLight(0xffffcc, 2.5);
      sunLight.position.set(5, 3, 5);
      sceneRef.current.add(sunLight);
      
      // Secondary light
      const secondaryLight = new THREE.DirectionalLight(0xffffcc, 1.0);
      secondaryLight.position.set(-3, 2, -3);
      sceneRef.current.add(secondaryLight);
      
      // Sky light
      const skyLight = new THREE.HemisphereLight(0x7088ff, 0xfeffd9, 1.5);
      sceneRef.current.add(skyLight);
      
      // Additional ambient
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      sceneRef.current.add(ambientLight);
    } 
    else if (preset === 'technical') {
      // Top light
      const topLight = new THREE.DirectionalLight(0xffffff, 1.5);
      topLight.position.set(0, 5, 0);
      sceneRef.current.add(topLight);
      
      // Front light
      const frontLight = new THREE.DirectionalLight(0xffffff, 1.5);
      frontLight.position.set(0, 0, 5);
      sceneRef.current.add(frontLight);
      
      // Side light
      const sideLight = new THREE.DirectionalLight(0xffffff, 1.2);
      sideLight.position.set(5, 0, 0);
      sceneRef.current.add(sideLight);
      
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
      sceneRef.current.add(ambientLight);
    }
    
    // Add camera light
    if (cameraRef.current) {
      const cameraLight = new THREE.DirectionalLight(0xffffff, 1.0);
      cameraLight.position.copy(cameraRef.current.position);
      cameraLight.target.position.set(0, 0, 0);
      cameraRef.current.add(cameraLight);
      sceneRef.current.add(cameraLight.target);
    }
  };
  
  // Create the 3D airfoil model
  const createAirfoilModel = () => {
    if (!sceneRef.current) return;
    
    // Remove existing models
    if (airfoilRef.current) {
      sceneRef.current.remove(airfoilRef.current);
    }
    
    if (flowLinesRef.current) {
      sceneRef.current.remove(flowLinesRef.current);
    }
    
    // Create a group
    const airfoilGroup = new THREE.Group();
    
    // Generate airfoil profile and create shape
    const profile = getAirfoilProfile();
    
    // Check if we have valid profile data
    if (profile.length === 0) {
      console.error("Empty airfoil profile");
      return;
    }
    
    const airfoilShape = new THREE.Shape(profile);
    
    // Determine mesh quality
    const qualitySettings = {
      'low': { steps: 2, segments: 4, bevelSegments: 2 },
      'medium': { steps: 4, segments: 12, bevelSegments: 4 },
      'high': { steps: 8, segments: 24, bevelSegments: 8 }
    };
    
    const settings = qualitySettings[meshQuality] || qualitySettings.medium;
    
    // Extrude settings
    const extrudeSettings = {
      steps: settings.steps,
      depth: currentWingLength,
      bevelEnabled: false
    };
    
    // Create extruded geometry
    const geometry = new THREE.ExtrudeGeometry(airfoilShape, extrudeSettings);
    
    // Scale geometry
    geometry.scale(currentChordLength, currentChordLength, 1);
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(materialColor),
      metalness: materialMetalness,
      roughness: surfaceRoughness,
      side: THREE.DoubleSide,
      flatShading: false,
    });
    
    // Create mesh
    const airfoil = new THREE.Mesh(geometry, material);
    
    // Calculate center
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox;
    
    // Find the true geometric center
    const xCenter = (boundingBox.min.x + boundingBox.max.x) / 2;
    const yCenter = (boundingBox.min.y + boundingBox.max.y) / 2;
    const zCenter = (boundingBox.min.z + boundingBox.max.z) / 2;
    
    // Center the geometry
    geometry.translate(-xCenter, -yCenter, -zCenter);
    
    // Add the airfoil to the group
    airfoilGroup.add(airfoil);
    
    // Add wireframe if enabled
    if (showWireframe) {
      // Helper to create a colored line
      const createColoredLine = (points, color = 0x000000, linewidth = 1, opacity = 1) => {
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: color, 
          linewidth: linewidth,
          opacity: opacity,
          transparent: opacity < 1
        });
        return new THREE.Line(lineGeometry, lineMaterial);
      };
      
      // Create cross-section profiles
      const numSections = 20;
      
      for (let i = 0; i <= numSections; i++) {
        const zPosition = (i / numSections) * currentWingLength;
        
        // Create points for the profile
        const curvePoints = [];
        const originalProfile = getAirfoilProfile();
        
        // Sample points for the curve
        for (let j = 0; j < originalProfile.length; j++) {
          const point = originalProfile[j];
          curvePoints.push(new THREE.Vector3(
            point.x * currentChordLength - xCenter,
            point.y * currentChordLength - yCenter,
            zPosition - zCenter
          ));
        }
        
        // Create line for this cross-section
        const lineWidth = (i === 0 || i === numSections) ? 2 : 1;
        const opacity = (i === 0 || i === numSections) ? 1 : 0.8;
        
        const sectionLine = createColoredLine(curvePoints, 0x000000, lineWidth, opacity);
        airfoilGroup.add(sectionLine);
      }
      
      // Find key points for the airfoil
      // These points can be approximated from the airfoil data
      // Finding leading edge (0,0) and trailing edge (1,0)
      const leadingEdge = { x: 0.0, y: 0.0, name: 'Leading Edge' };
      const trailingEdge = { x: 1.0, y: 0.0, name: 'Trailing Edge' };
      
      // Find max thickness and camber points by analyzing the coordinates
      let maxThicknessPoint = { x: 0.3, y: 0.06, name: 'Max Thickness' }; // Default approximation
      let maxCamberPoint = { x: 0.4, y: 0.04, name: 'Max Camber' }; // Default approximation
      
      if (profile.length > 0) {
        // Try to identify these points from the profile data
        // This is a simplified approach and might need refinement
        let maxY = 0;
        let maxYIndex = 0;
        
        for (let i = 0; i < profile.length / 2; i++) {
          if (profile[i].y > maxY) {
            maxY = profile[i].y;
            maxYIndex = i;
          }
        }
        
        if (maxYIndex > 0) {
          maxThicknessPoint = { 
            x: profile[maxYIndex].x, 
            y: profile[maxYIndex].y,
            name: 'Max Thickness'
          };
        }
        
        // For camber, approximating based on the midway between upper and lower surface
        maxCamberPoint = { 
          x: maxThicknessPoint.x, 
          y: maxThicknessPoint.y / 2,
          name: 'Max Camber'
        };
      }
      
      // Add longitudinal lines for key points
      const keyPositions = [
        leadingEdge,
        maxCamberPoint,
        maxThicknessPoint,
        trailingEdge
      ];
      
      keyPositions.forEach(pos => {
        const spanPoints = [];
        
        for (let i = 0; i <= numSections; i++) {
          const zPosition = (i / numSections) * currentWingLength;
          spanPoints.push(new THREE.Vector3(
            pos.x * currentChordLength - xCenter,
            pos.y * currentChordLength - yCenter,
            zPosition - zCenter
          ));
        }
        
        // Color coding based on significance
        let color = 0x000000; // Default black
        let lineWidth = 1;
        let opacity = 0.7;
        
        // Special points coloring
        if (pos.name === 'Leading Edge' || pos.name === 'Trailing Edge') {
          color = 0x0066ff; // Blue
          lineWidth = 2;
          opacity = 1;
        } 
        else if (pos.name === 'Max Camber') {
          color = 0x00cc00; // Green
          lineWidth = 1.5;
          opacity = 0.9;
        }
        else if (pos.name === 'Max Thickness') {
          color = 0xff0000; // Red
          lineWidth = 1.5;
          opacity = 0.9;
        }
        
        const spanLine = createColoredLine(spanPoints, color, lineWidth, opacity);
        airfoilGroup.add(spanLine);
      });
    }
    
    // Add flow visualization if enabled
    if (showFlowLines) {
      const flowGroup = new THREE.Group();
      
      // Create streamlines
      const numLines = 15;
      const lineStep = currentChordLength / (numLines - 1);
      
      for (let i = 0; i < numLines; i++) {
        const x = i * lineStep;
        
        // Create curved line
        const points = [];
        const numPoints = 40;
        
        for (let j = 0; j < numPoints; j++) {
          const z = (j / (numPoints - 1)) * currentWingLength;
          
          if (x < currentChordLength * 0.3) {
            // Leading edge
            const y = 0.05 * currentChordLength * Math.sin(Math.PI * x / currentChordLength) * (1 - j/numPoints * 0.3);
            points.push(new THREE.Vector3(x - xCenter, y - yCenter, z - zCenter));
          } else {
            // Trailing edge
            const y = 0.02 * currentChordLength * Math.sin(Math.PI * x / currentChordLength) * (1 - j/numPoints * 0.5);
            points.push(new THREE.Vector3(x - xCenter, y - yCenter, z - zCenter));
          }
        }
        
        // Create curve
        const curve = new THREE.CatmullRomCurve3(points);
        
        // Create geometry
        const geometry = new THREE.TubeGeometry(curve, 20, 0.002 * currentChordLength, 8, false);
        
        // Create color
        const colorValue = i / numLines;
        const color = new THREE.Color();
        color.setHSL(0.6 * (1 - colorValue), 1, 0.5);
        
        // Create material
        const material = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6 });
        
        // Create mesh
        const tube = new THREE.Mesh(geometry, material);
        flowGroup.add(tube);
      }
      
      flowLinesRef.current = flowGroup;
      sceneRef.current.add(flowGroup);
    }
    
    // Position at origin
    airfoilGroup.position.set(0, 0, 0);
    
    // Add to scene and store reference
    sceneRef.current.add(airfoilGroup);
    airfoilRef.current = airfoilGroup;
  };
  
  // Setup interactive controls
  const setupControls = () => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
    
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const domElement = renderer.domElement;
    
    // Variables for interaction
    let isRotating = false;
    let isPanning = false;
    let previousMousePosition = { x: 0, y: 0 };
    const target = new THREE.Vector3(0, 0, 0);
    
    // Mouse down handler
    const handleMouseDown = (event) => {
      if (event.button === 0) { // Left button
        isRotating = true;
      } else if (event.button === 1 || event.button === 2) { // Middle or right button
        isPanning = true;
        event.preventDefault();
      }
      
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };
    
    // Mouse move handler
    const handleMouseMove = (event) => {
      if (isRotating) {
        // Handle rotation
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;
        
        // Calculate rotation with spherical coordinates
        const spherical = new THREE.Spherical().setFromVector3(
          camera.position.clone().sub(target)
        );
        
        // Apply rotation (reversed Y for natural control)
        spherical.theta -= deltaX * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - deltaY * 0.01));
        
        // Update camera position
        const newPosition = new THREE.Vector3().setFromSpherical(spherical);
        camera.position.copy(target).add(newPosition);
        camera.lookAt(target);
        
        previousMousePosition = {
          x: event.clientX,
          y: event.clientY
        };
      } 
      else if (isPanning) {
        // Handle panning
        const deltaX = (event.clientX - previousMousePosition.x) * 0.01;
        const deltaY = (event.clientY - previousMousePosition.y) * 0.01;
        
        // Get camera vectors
        const distance = camera.position.distanceTo(target);
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        camera.getWorldDirection(up);
        right.crossVectors(up, camera.up).normalize();
        up.cross(right).normalize();
        
        // Move camera and target
        const moveX = right.multiplyScalar(-deltaX * distance);
        const moveY = up.multiplyScalar(deltaY * distance);
        
        camera.position.add(moveX).add(moveY);
        target.add(moveX).add(moveY);
        camera.lookAt(target);
        
        previousMousePosition = {
          x: event.clientX,
          y: event.clientY
        };
      }
    };
    
    // Mouse up handler
    const handleMouseUp = () => {
      isRotating = false;
      isPanning = false;
    };
    
    // Wheel handler for zooming
    const handleWheel = (event) => {
      // Calculate new distance
      const distance = camera.position.distanceTo(target);
      const zoomDelta = event.deltaY * 0.001;
      const newDistance = Math.max(0.5, Math.min(20, distance + zoomDelta));
      
      // Update camera position
      const direction = camera.position.clone().sub(target).normalize();
      camera.position.copy(target).add(direction.multiplyScalar(newDistance));
      
      event.preventDefault();
    };
    
    // Context menu handler
    const handleContextMenu = (event) => {
      event.preventDefault();
    };
    
    // Add event listeners
    domElement.addEventListener('mousedown', handleMouseDown);
    domElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('contextmenu', handleContextMenu);
    
    // Store cleanup function
    const cleanup = () => {
      domElement.removeEventListener('mousedown', handleMouseDown);
      domElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('contextmenu', handleContextMenu);
    };
    
    // Return cleanup function
    return cleanup;
  };
  
  // Update model when settings change
  useEffect(() => {
    createAirfoilModel();
  }, [
    currentChordLength, 
    currentWingLength, 
    showWireframe,
    showFlowLines,
    materialColor,
    materialMetalness,
    surfaceRoughness,
    meshQuality,
    hasWinglets
  ]);
  
  // Update lighting when preset changes
  useEffect(() => {
    setupLighting(lightingPreset);
  }, [lightingPreset]);
  
  const handleExportModel = () => {
    // Trigger the download function in the parent component
    if (window.triggerSTLDownload) {
      window.triggerSTLDownload();
    } else {
      alert(`Exporting model as ${name}.${exportFormat}... (This would trigger actual export functionality in a production version)`);
    }
  };
  
  return (
    <div className="p-0">
      {/* Top Section: 3D Viewer and Quick Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* 3D Viewer - Takes 3/4 of the width on large screens */}
        <div className="lg:col-span-3">
          <div 
            className="h-96 bg-gray-50 border border-gray-200 rounded-lg relative" 
            ref={mountRef}
          >
            {/* Model Controls */}
            <div className="absolute bottom-3 right-3 flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded">
              <button 
                onClick={handleResetView} 
                className="bg-white text-gray-700 p-1 rounded border border-gray-300 hover:bg-gray-100" 
                title="Reset View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </button>
              <button 
                onClick={() => setShowWireframe(!showWireframe)} 
                className={`${showWireframe ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700'} p-1 rounded border border-gray-300 hover:bg-gray-100`} 
                title="Toggle Wireframe"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
                </svg>
              </button>
              <button 
                onClick={() => setShowFlowLines(!showFlowLines)} 
                className={`${showFlowLines ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700'} p-1 rounded border border-gray-300 hover:bg-gray-100`} 
                title="Toggle Flow Lines"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path>
                </svg>
              </button>
            </div>
            
            {/* Controls Information Overlay */}
            <div className="absolute top-2 left-2 text-xs text-white bg-black/50 p-1 rounded">
              <div>Left-click: Rotate | Right-click: Pan | Scroll: Zoom</div>
            </div>
          </div>
        </div>
        
        {/* Performance Metrics and Quick Controls Panel */}
        <div className="lg:col-span-1">
          {/* Performance Metrics */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Wing Performance</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-gray-600">Aspect Ratio:</div>
              <div className="font-medium text-gray-900">{aspectRatio.toFixed(2)}</div>
              
              <div className="text-gray-600">Taper Ratio:</div>
              <div className="font-medium text-gray-900">{taperRatio.toFixed(2)}</div>
              
              <div className="text-gray-600">Wing Area:</div>
              <div className="font-medium text-gray-900">{wingArea.toFixed(2)} m²</div>
              
              <div className="text-gray-600">Wing Loading:</div>
              <div className="font-medium text-gray-900">{wingLoading.toFixed(1)} N/m²</div>
              
              <div className="text-gray-600">Est. Stall Speed:</div>
              <div className="font-medium text-gray-900">{estimatedStallSpeed} km/h</div>
              
              <div className="text-gray-600">Est. Max L/D:</div>
              <div className="font-medium text-gray-900">{estimatedMaxLD}</div>
            </div>
          </div>
          
          {/* Quick Control Buttons */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Controls</h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Chord Length:</span>
                  <span className="text-gray-800 font-medium">{currentChordLength.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={currentChordLength}
                  onChange={(e) => setCurrentChordLength(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* Wing Length Slider */}
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Wing Length:</span>
                  <span className="text-gray-800 font-medium">{currentWingLength.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={currentWingLength}
                  onChange={(e) => setCurrentWingLength(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* Visualization Toggles */}
              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => setShowWireframe(!showWireframe)}
                  className={`flex-1 px-2 py-1 rounded-md text-xs font-medium ${
                    showWireframe 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  Wireframe
                </button>
                <button
                  onClick={() => setShowFlowLines(!showFlowLines)}
                  className={`flex-1 px-2 py-1 rounded-md text-xs font-medium ${
                    showFlowLines 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  Flow Lines
                </button>
              </div>
              
              {/* Update Model Button */}
              <button
                onClick={handleUpdateModel}
                className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
              >
                Update Model
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Wing Configuration Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
        <button 
          className="w-full p-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 text-left"
          onClick={() => toggleSection('wingConfig')}
        >
          <h3 className="text-sm font-medium text-gray-800">Wing Configuration</h3>
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${activeSections.wingConfig ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {activeSections.wingConfig && (
          <div className="p-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Wingspan (m)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.1"
                  value={wingspan}
                  onChange={(e) => setWingspan(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Root Chord (m)
                </label>
                <input
                  type="number"
                  min="0.05"
                  max="10"
                  step="0.05"
                  value={rootChord}
                  onChange={(e) => setRootChord(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tip Chord (m)
                </label>
                <input
                  type="number"
                  min="0.05"
                  max="10"
                  step="0.05"
                  value={tipChord}
                  onChange={(e) => setTipChord(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sweep Angle (deg)
                </label>
                <input
                  type="number"
                  min="0"
                  max="45"
                  step="1"
                  value={sweepAngle}
                  onChange={(e) => setSweepAngle(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Dihedral Angle (deg)
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  step="0.5"
                  value={dihedralAngle}
                  onChange={(e) => setDihedralAngle(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Twist Angle (deg)
                </label>
                <input
                  type="number"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={twistAngle}
                  onChange={(e) => setTwistAngle(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Camber (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={camber}
                  onChange={(e) => setCamber(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Thickness (%)
                </label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  step="0.5"
                  value={thickness}
                  onChange={(e) => setThickness(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleUpdateModel}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
              >
                Update 3D Model
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Visualization Options Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
        <button 
          className="w-full p-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 text-left"
          onClick={() => toggleSection('visualization')}
        >
          <h3 className="text-sm font-medium text-gray-800">Visualization Options</h3>
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${activeSections.visualization ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {activeSections.visualization && (
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Display Options</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={showWireframe}
                      onChange={(e) => setShowWireframe(e.target.checked)}
                      className="mr-2 h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">Show Wireframe</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={showFlowLines}
                      onChange={(e) => setShowFlowLines(e.target.checked)}
                      className="mr-2 h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">Show Flow Visualization</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Rendering Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Lighting Preset</label>
                    <select 
                      value={lightingPreset}
                      onChange={(e) => setLightingPreset(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="studio">Studio Lighting</option>
                      <option value="outdoor">Outdoor Lighting</option>
                      <option value="technical">Technical Lighting</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Mesh Quality</label>
                    <select 
                      value={meshQuality}
                      onChange={(e) => setMeshQuality(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="low">Low (Faster)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="high">High (Detailed)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Materials Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
        <button 
          className="w-full p-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 text-left"
          onClick={() => toggleSection('materials')}
        >
          <h3 className="text-sm font-medium text-gray-800">Materials & Surface Properties</h3>
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${activeSections.materials ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {activeSections.materials && (
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Surface Properties</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Material Color</label>
                    <div className="flex items-center">
                      <input 
                        type="color" 
                        value={materialColor}
                        onChange={(e) => setMaterialColor(e.target.value)}
                        className="mr-2 h-8 w-8 rounded border border-gray-300"
                      />
                      <input 
                        type="text" 
                        value={materialColor}
                        onChange={(e) => setMaterialColor(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Surface Roughness:</span>
                      <span>{surfaceRoughness.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 w-16">Smooth</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={surfaceRoughness}
                        onChange={(e) => setSurfaceRoughness(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mx-2"
                      />
                      <span className="text-xs text-gray-500 w-16 text-right">Rough</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Material Metalness:</span>
                      <span>{materialMetalness.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 w-16">Non-metallic</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={materialMetalness}
                        onChange={(e) => setMaterialMetalness(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mx-2"
                      />
                      <span className="text-xs text-gray-500 w-16 text-right">Metallic</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Winglet Configuration Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
        <button 
          className="w-full p-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 text-left"
          onClick={() => toggleSection('winglets')}
        >
          <h3 className="text-sm font-medium text-gray-800">Winglet Configuration</h3>
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${activeSections.winglets ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {activeSections.winglets && (
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-4">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={hasWinglets}
                  onChange={(e) => setHasWinglets(e.target.checked)}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">Enable Winglets</span>
              </label>
              
              {hasWinglets && (
                <div className="space-y-3 mt-2 pl-6">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Winglet Type</label>
                    <select 
                      value={wingletType}
                      onChange={(e) => setWingletType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="Standard Winglet">Standard Winglet</option>
                      <option value="Split Scimitar Winglet">Split Scimitar Winglet</option>
                      <option value="Blended Winglet">Blended Winglet</option>
                      <option value="Raked Winglet">Raked Winglet</option>
                      <option value="Sharklet">Sharklet</option>
                    </select>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Winglet Angle (degrees):</span>
                      <span>{wingletAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="1"
                      value={wingletAngle}
                      onChange={(e) => setWingletAngle(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Winglet Height (% wingspan):</span>
                      <span>{wingletHeight}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="1"
                      value={wingletHeight}
                      onChange={(e) => setWingletHeight(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AirfoilViewer;