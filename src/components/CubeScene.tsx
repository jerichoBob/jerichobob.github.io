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
    const geometry = new THREE.IcosahedronGeometry(1.0, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.9,
      roughness: 0.1,
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
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      
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

    // const controls = new THREE.OrbitControls(camera, renderer.domElement);
    const camera_velocity = 0.04;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    // Animation
    const animate = () => {
      requestAnimationFrame(animate);

      const time = Date.now() * 0.001;
      const radius = 8;
      const x = Math.cos(time * camera_velocity) * radius;
      const z = Math.sin(time * camera_velocity) * radius;
      const y = Math.sin(time * camera_velocity) * 3;

      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);

      // Rotate all shapes slowly
      shapes.forEach(shape => {
        shape.rotation.x += 0.001;
        shape.rotation.y += 0.001;
      });

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
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
};

export default CubeScene;