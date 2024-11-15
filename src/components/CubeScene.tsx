import { useEffect, useRef } from 'react';
import * as THREE from 'three';

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

    // Create cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.9,
      roughness: 0.1,
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0, 0);
    scene.add(cube);

    // Add three lights around the cube
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

    // Animation
    let time = 0;
    const radius = 8;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.001;

      // Calculate new camera group position
      const x = Math.sin(time * 0.5) * radius;
      const z = Math.cos(time * 0.5) * radius;
      const y = Math.sin(time * 0.5) * 3;

      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);

      // Rotate cube slowly
      cube.rotation.x += 0.001;
      cube.rotation.y += 0.001;

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