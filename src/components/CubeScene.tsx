import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const CubeScene = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    mountRef.current.appendChild(renderer.domElement);

    // Create icosahedron with detail parameter
    const geometry = new THREE.IcosahedronGeometry(1.0, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.9,
      roughness: 0.1,
      emissive: new THREE.Color(0x000000),  // Initialize emissive color
    });

    // Create wireframe material
    const wireframeMaterial = new THREE.LineBasicMaterial({ 
      color: 0x000000,
      linewidth: 1.0,
      opacity: 0.25,
      transparent: true
    });

    // Create hexagonal grid
    const radius = 2.5; // Distance between shapes
    const gridSize = 5; // Number of shapes along each axis
    const shapes: THREE.Mesh[] = [];

    for (let q = -gridSize; q <= gridSize; q++) {
      for (let r = Math.max(-gridSize, -q-gridSize); r <= Math.min(gridSize, -q+gridSize); r++) {
        // Convert hex coordinates to pixel coordinates
        const x = radius * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r);
        const z = radius * (3/2 * r);
        
        // Create shape
        const shape = new THREE.Mesh(geometry, material);
        shape.position.set(x, 0, z);
        scene.add(shape);

        // Add wireframe
        const wireframe = new THREE.WireframeGeometry(geometry);
        const line = new THREE.LineSegments(wireframe, wireframeMaterial);
        shape.add(line);

        // Add to animation list
        shapes.push(shape);
      }
    }

    // Define Arc interface for TypeScript
    interface Arc {
      line: THREE.Line;
      progress: number;
      speed: number;
      start: THREE.Vector3;
      end: THREE.Vector3;
      control: THREE.Vector3;
      active: boolean;
      targetShape?: THREE.Mesh;  // Add reference to target shape
    }

    // Initialize arcs array with proper typing
    const arcs: Arc[] = [];
    const maxArcs = 7; // Maximum number of concurrent arcs

    // Function to dispose of an arc properly
    const disposeArc = (arc: Arc) => {
      if (arc.line) {
        if (arc.line.geometry) {
          arc.line.geometry.dispose();
        }
        if (arc.line.material instanceof THREE.Material) {
          arc.line.material.dispose();
        }
        scene.remove(arc.line);
      }
    };

    // Function to create a new arc
    const createArc = (): Arc => {
      // Pick random start and end shapes
      const startShape = shapes[Math.floor(Math.random() * shapes.length)];
      let endShape;
      do {
        endShape = shapes[Math.floor(Math.random() * shapes.length)];
      } while (endShape === startShape);

      const start = startShape.position.clone();
      const end = endShape.position.clone();
      
      // Create control point for the quadratic curve
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const height = start.distanceTo(end) * 0.5;
      const control = mid.clone().add(new THREE.Vector3(0, height, 0));

      // Create curve geometry
      const curve = new THREE.QuadraticBezierCurve3(start, control, end);
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      // Create line with gradient material
      const material = new THREE.LineBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.5,
      });
      
      const line = new THREE.Line(geometry, material);
      scene.add(line);

      return {
        line,
        progress: 0,
        speed: 0.02 + Math.random() * 0.03,
        start,
        end,
        control,
        active: true,
        targetShape: endShape  // Store reference to target shape
      };
    };

    // Track shimmer animations
    interface ShimmerAnimation {
      shape: THREE.Mesh;
      progress: number;
      originalColor: THREE.Color;
      originalMetalness: number;
      originalEmissive: THREE.Color;
    }
    const shimmerAnimations: ShimmerAnimation[] = [];

    // Function to start shimmer effect
    const startShimmerEffect = (shape: THREE.Mesh) => {
      const material = shape.material as THREE.MeshStandardMaterial;
      shimmerAnimations.push({
        shape,
        progress: 0,
        originalColor: material.color.clone(),
        originalMetalness: material.metalness,
        originalEmissive: material.emissive.clone()
      });
    };

    // Initialize some arcs after shapes are created
    for (let i = 0; i < maxArcs; i++) {
      arcs.push(createArc());
    }

    // Store reference to text mesh for cleanup
    let textMesh: THREE.Mesh | null = null;

    // Add text
    const fontLoader = new FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
      const textGeometry = new TextGeometry('jerichobob.github.io', {
        font: font,
        size: 0.3,
        height: 0.05,
      });
      const textMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        metalness: 0.5,
        roughness: 0.2
      });
      textMesh = new THREE.Mesh(textGeometry, textMaterial);
      
      // Center the text
      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x;
      
      // Position text in front of camera
      textMesh.position.set(-textWidth/2+4, -3.5, -10);
      
      // Add text to camera
      camera.add(textMesh);
    });

    // Add three lights around the shape
    const light1 = new THREE.PointLight(0xffffff, 250);
    light1.position.set(4, 0, 0);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xffffff, 250);
    light2.position.set(-2, 3.5, 0);
    scene.add(light2);

    const light3 = new THREE.PointLight(0xffffff, 250);
    light3.position.set(-2, -3.5, 0);
    scene.add(light3);

    // Add subtle ambient light
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    // Create stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 });
    
    const starsVertices = [];
    for (let i = 0; i < 2000; i++) {
      const x = THREE.MathUtils.randFloatSpread(100);
      const y = THREE.MathUtils.randFloatSpread(100);
      const z = THREE.MathUtils.randFloatSpread(100);
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Create a group for camera
    const cameraGroup = new THREE.Group();
    scene.add(cameraGroup);
    cameraGroup.add(camera);

    // Set initial camera position
    camera.position.set(0, 0, 8);

    const camera_velocity = 0.04;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;


    let animationFrameId: number;

    // Animation
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;
      const radius = 8;
      const x = Math.cos(time * camera_velocity) * radius;
      const z = Math.sin(time * camera_velocity) * radius;
      const y = Math.sin(time * camera_velocity) * 3;

      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);

      // Rotate all shapes slowly
      shapes.forEach(shape => {
        shape.rotation.x += 0.003;
        shape.rotation.y += 0.005;
      });

      // Animate arcs
      const updatePercentage = 0.3; // 30% of arcs will update each frame
      const numArcsToUpdate = Math.max(1, Math.floor(arcs.length * updatePercentage));
      
      // Randomly select arcs to update
      const arcIndices = Array.from({ length: arcs.length }, (_, i) => i);
      for (let i = arcIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arcIndices[i], arcIndices[j]] = [arcIndices[j], arcIndices[i]];
      }
      
      // Update only selected arcs
      arcIndices.slice(0, numArcsToUpdate).forEach(index => {
        const arc = arcs[index];
        if (arc.active) {
          arc.progress += arc.speed;
          
          if (arc.progress >= 1) {
            // Start shimmer effect on target shape
            if (arc.targetShape) {
              startShimmerEffect(arc.targetShape);
            }
            // Properly dispose of old arc
            disposeArc(arc);
            // Create new arc
            arcs[index] = createArc();
          } else {
            try {
              // Update arc visibility
              const curve = new THREE.QuadraticBezierCurve3(arc.start, arc.control, arc.end);
              const points = curve.getPoints(5);
              const numPoints = Math.max(2, Math.floor(points.length * arc.progress)); // Ensure at least 2 points
              const visiblePoints = points.slice(0, numPoints);
              
              // Check if we have valid points before updating geometry
              if (visiblePoints.length >= 2 && visiblePoints.every(p => p && p.x !== undefined)) {
                arc.line.geometry.setFromPoints(visiblePoints);
                
                // Fade out as it reaches the end
                const opacity = Math.min(1, 2 * (1 - arc.progress));
                (arc.line.material as THREE.LineBasicMaterial).opacity = opacity * 0.5;
              }
            } catch (error) {
              // Properly dispose of problematic arc
              disposeArc(arc);
              arcs[index] = createArc();
            }
          }
        }
      });

      // Update shimmer animations
      for (let i = shimmerAnimations.length - 1; i >= 0; i--) {
        const anim = shimmerAnimations[i];
        anim.progress += 0.05;  // Slow down the animation
        
        const material = anim.shape.material as THREE.MeshStandardMaterial;
        const shimmerIntensity = Math.sin(anim.progress * Math.PI * 2) * 0.5 + 0.5;
        
        // Modify material properties for shimmer effect
        material.emissive.setRGB(
          1.0 * shimmerIntensity,  // More red
          0.5 * shimmerIntensity,  // Some green
          0.2 * shimmerIntensity   // Less blue
        );
        material.metalness = anim.originalMetalness + (0.1 * shimmerIntensity);
        material.color.setRGB(
          1.0,  // Brighten the base color during shimmer
          0.8 * (1.0 - shimmerIntensity) + 0.5,
          0.8 * (1.0 - shimmerIntensity) + 0.2
        );
        
        // Remove animation when complete
        if (anim.progress >= 1) {
          material.emissive.copy(anim.originalEmissive);
          material.metalness = anim.originalMetalness;
          material.color.copy(anim.originalColor);
          shimmerAnimations.splice(i, 1);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      // Dispose of all arcs
      arcs.forEach(disposeArc);
      
      // Dispose of shapes
      shapes.forEach(shape => {
        if (shape.geometry) shape.geometry.dispose();
        if (shape.material instanceof THREE.Material) shape.material.dispose();
      });

      // Dispose of text if it exists
      if (textMesh) {
        if (textMesh.geometry) textMesh.geometry.dispose();
        if (textMesh.material instanceof THREE.Material) textMesh.material.dispose();
        camera.remove(textMesh);
      }

      // Dispose of stars
      if (stars.geometry) stars.geometry.dispose();
      if (stars.material instanceof THREE.Material) stars.material.dispose();

      // Dispose of lights
      scene.remove(light1);
      scene.remove(light2);
      scene.remove(light3);
      scene.remove(new THREE.AmbientLight(0xffffff, 0.2));

      // Clean up renderer and remove from DOM
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
      
      // Stop animation loop
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
};

export default CubeScene;