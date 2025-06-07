import * as THREE from 'three';
import { SceneManager } from './scripts/scene.js';
import { Plane } from './scripts/plane.js';
import { City } from './scripts/city.js';
import { FlightControls } from './scripts/controls.js';
import { CameraController } from './scripts/camera.js';
import { UFOManager } from './scripts/ufo.js';
import { WeaponSystem, EffectsManager } from './scripts/weapons.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.sceneManager = new SceneManager(this.canvas);
        this.plane = new Plane();
        this.city = new City();
        this.controls = new FlightControls();
        this.cameraController = new CameraController(this.sceneManager.camera, this.plane);
        this.ufoManager = new UFOManager();
        this.weaponSystem = new WeaponSystem(this.plane);
        this.effectsManager = new EffectsManager();
        
        this.isRunning = false;
        this.clock = new THREE.Clock();
        this.score = 0;
        
        this.init();
    }
    
    init() {
        // Add city environment to scene
        this.sceneManager.add(this.city.group);
        
        // Add plane to scene
        this.sceneManager.add(this.plane.group);
        
        // Add UFOs to scene
        this.sceneManager.add(this.ufoManager.group);
        
        // Add weapon system to scene
        this.sceneManager.add(this.weaponSystem.group);
        
        // Add effects manager to scene
        this.sceneManager.add(this.effectsManager.group);
        
        // Camera will be controlled by CameraController
        
        // Start the game loop
        this.start();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.sceneManager.onWindowResize();
        });
        
        console.log('🛩️  Plane Simulator initialized with UFOs and weapons!');
    }
    
    start() {
        this.isRunning = true;
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const deltaTime = this.clock.getDelta();
        
        // Update controls
        this.controls.update(deltaTime);
        
        // Update game objects
        this.plane.update(deltaTime, this.controls);
        this.city.update(deltaTime);
        this.ufoManager.update(deltaTime);
        this.weaponSystem.update(deltaTime);
        this.effectsManager.update(deltaTime);
        this.sceneManager.update(deltaTime);
        
        // Check collisions
        this.handleCollisions();
        
        // Update camera
        this.cameraController.update(deltaTime, this.controls);
        
        // Update HUD
        this.updateHUD();
        
        // Render the scene
        this.sceneManager.render();
        
        // Continue the loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    handleCollisions() {
        const projectiles = this.weaponSystem.getProjectiles();
        const hits = this.ufoManager.checkCollisions(projectiles);
        
        hits.forEach(hit => {
            const { ufo, projectile, position, projectileIndex } = hit;
            
            // Remove the projectile
            this.weaponSystem.removeProjectile(projectileIndex);
            
            // Damage the UFO
            const destroyed = ufo.takeDamage();
            
            if (destroyed) {
                // Create explosion effect
                this.effectsManager.createExplosion(position);
                // Increase score
                this.score += 100;
            }
        });
    }
    
    updateHUD() {
        // Update speed and altitude display
        document.getElementById('speed').textContent = Math.round(this.plane.speed);
        document.getElementById('altitude').textContent = Math.round(this.plane.group.position.y);
        
        // Update speed indicator with color coding
        const speedPercent = (this.plane.speed - this.plane.minSpeed) / (this.plane.maxSpeed - this.plane.minSpeed);
        const speedBarElement = document.getElementById('speed-bar');
        const speedIndicatorElement = document.getElementById('speed-indicator');
        
        // Color code based on speed
        if (speedPercent < 0.3) {
            speedIndicatorElement.style.color = '#ff4444'; // Red for low speed
        } else if (speedPercent < 0.7) {
            speedIndicatorElement.style.color = '#ffff44'; // Yellow for medium speed
        } else {
            speedIndicatorElement.style.color = '#44ff44'; // Green for high speed
        }
        
        // Update speed bar
        const barLength = Math.round(speedPercent * 11);
        speedBarElement.textContent = '|'.repeat(barLength) + '_'.repeat(11 - barLength);
        
        // Update camera mode display
        const cameraMode = this.cameraController.getCurrentMode();
        document.getElementById('camera-mode-text').textContent = 
            cameraMode.charAt(0).toUpperCase() + cameraMode.slice(1);
        
        // Update score and ammo
        document.getElementById('score').textContent = this.score;
        document.getElementById('ammo').textContent = this.weaponSystem.getAmmoCount();
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 