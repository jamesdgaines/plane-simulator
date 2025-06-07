import * as THREE from 'three';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        
        this.init();
    }
    
    init() {
        // Set up renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Set up camera
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        
        // Set up lighting
        this.setupLighting();
        
        // Set up environment
        this.setupEnvironment();
        
        console.log('🎬 Scene initialized');
    }
    
    setupLighting() {
        // Enhanced ambient light for city environment
        const ambientLight = new THREE.AmbientLight(0x404070, 0.4);
        this.scene.add(ambientLight);
        
        // Main directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffcc, 0.8);
        sunLight.position.set(100, 200, 100);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 1000;
        sunLight.shadow.camera.left = -200;
        sunLight.shadow.camera.right = 200;
        sunLight.shadow.camera.top = 200;
        sunLight.shadow.camera.bottom = -200;
        this.scene.add(sunLight);
        
        // Add atmospheric lighting
        const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
        fillLight.position.set(-50, 50, -50);
        this.scene.add(fillLight);
        
        // City ambient lighting (slight orange tint for urban feel)
        const cityAmbient = new THREE.AmbientLight(0xff9500, 0.1);
        this.scene.add(cityAmbient);
    }
    
    setupEnvironment() {
        // Create enhanced skybox with gradient
        this.createSkybox();
        
        // Add atmospheric fog
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 400);
        
        // Add clouds
        this.createClouds();
    }
    
    createSkybox() {
        // Create a gradient sky using a large sphere
        const skyGeometry = new THREE.SphereGeometry(500, 32, 16);
        
        // Create gradient material for sky
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }
    
    createClouds() {
        const cloudGroup = new THREE.Group();
        
        // Create several cloud layers
        for (let i = 0; i < 20; i++) {
            const cloudGeometry = new THREE.SphereGeometry(15 + Math.random() * 10, 8, 6);
            const cloudMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xffffff,
                opacity: 0.8,
                transparent: true
            });
            
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            
            cloud.position.set(
                (Math.random() - 0.5) * 800,
                80 + Math.random() * 40,
                (Math.random() - 0.5) * 800
            );
            
            cloud.scale.set(
                1 + Math.random() * 0.5,
                0.6 + Math.random() * 0.4,
                1 + Math.random() * 0.5
            );
            
            cloudGroup.add(cloud);
        }
        
        this.cloudGroup = cloudGroup;
        this.scene.add(cloudGroup);
    }
    
    update(deltaTime) {
        // Animate clouds slowly drifting
        if (this.cloudGroup) {
            this.cloudGroup.rotation.y += deltaTime * 0.01;
        }
    }
    
    add(object) {
        this.scene.add(object);
    }
    
    remove(object) {
        this.scene.remove(object);
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
} 