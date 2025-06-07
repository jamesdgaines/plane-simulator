import * as THREE from 'three';

export class UFO {
    constructor() {
        this.group = new THREE.Group();
        this.health = 3; // UFO takes 3 hits to destroy
        this.maxHealth = 3;
        this.isDestroyed = false;
        this.hitFlashTime = 0;
        
        // Movement properties
        this.hoverAmplitude = 2;
        this.hoverSpeed = 1;
        this.driftSpeed = 5;
        this.time = Math.random() * Math.PI * 2; // Random start time for varied movement
        
        this.createUFO();
    }
    
    createUFO() {
        // Create main disc body
        const discGeometry = new THREE.CylinderGeometry(6, 8, 1.5, 16);
        const discMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x666666,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        this.disc = new THREE.Mesh(discGeometry, discMaterial);
        this.group.add(this.disc);
        
        // Create dome top
        const domeGeometry = new THREE.SphereGeometry(4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x444444,
            shininess: 100,
            transparent: true,
            opacity: 0.7
        });
        this.dome = new THREE.Mesh(domeGeometry, domeMaterial);
        this.dome.position.y = 0.75;
        this.group.add(this.dome);
        
        // Add glowing ring around the disc
        const ringGeometry = new THREE.TorusGeometry(7, 0.3, 8, 16);
        const ringMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00ffff,
            emissive: 0x004444,
            transparent: true,
            opacity: 0.8
        });
        this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
        this.ring.position.y = -0.5;
        this.group.add(this.ring);
        
        // Add some detail lights
        this.lights = [];
        for (let i = 0; i < 8; i++) {
            const lightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const lightMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xffff00,
                emissive: 0x444400
            });
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            
            const angle = (i / 8) * Math.PI * 2;
            light.position.x = Math.cos(angle) * 6;
            light.position.z = Math.sin(angle) * 6;
            light.position.y = -0.5;
            
            this.lights.push(light);
            this.group.add(light);
        }
        
        // Store original materials for hit flash effect
        this.originalDiscMaterial = discMaterial.clone();
        this.originalDomeMaterial = domeMaterial.clone();
    }
    
    update(deltaTime) {
        if (this.isDestroyed) return;
        
        this.time += deltaTime;
        
        // Hovering motion
        const hoverOffset = Math.sin(this.time * this.hoverSpeed) * this.hoverAmplitude;
        this.group.position.y += hoverOffset * deltaTime;
        
        // Gentle rotation
        this.group.rotation.y += deltaTime * 0.2;
        this.ring.rotation.y += deltaTime * 0.5;
        
        // Gentle drifting motion
        this.group.position.x += Math.sin(this.time * 0.3) * this.driftSpeed * deltaTime;
        this.group.position.z += Math.cos(this.time * 0.4) * this.driftSpeed * deltaTime;
        
        // Animate detail lights
        this.lights.forEach((light, index) => {
            const lightTime = this.time + index * 0.5;
            light.material.emissive.setHex(
                Math.sin(lightTime * 2) > 0 ? 0x444400 : 0x111100
            );
        });
        
        // Handle hit flash effect
        if (this.hitFlashTime > 0) {
            this.hitFlashTime -= deltaTime;
            const flashIntensity = this.hitFlashTime / 0.2; // 0.2 second flash
            
            this.disc.material.color.setHex(0xff0000);
            this.dome.material.color.setHex(0xff0000);
            this.disc.material.emissive.setHex(0x440000);
            this.dome.material.emissive.setHex(0x440000);
            
            if (this.hitFlashTime <= 0) {
                // Restore original colors
                this.disc.material.color.copy(this.originalDiscMaterial.color);
                this.dome.material.color.copy(this.originalDomeMaterial.color);
                this.disc.material.emissive.setHex(0x000000);
                this.dome.material.emissive.setHex(0x000000);
            }
        }
    }
    
    takeDamage() {
        if (this.isDestroyed) return false;
        
        this.health--;
        this.hitFlashTime = 0.2; // Flash for 0.2 seconds
        
        if (this.health <= 0) {
            this.destroy();
            return true; // UFO destroyed
        }
        
        return false; // UFO still alive
    }
    
    destroy() {
        this.isDestroyed = true;
        // UFO manager will handle the explosion effect and removal
    }
    
    getBoundingBox() {
        const box = new THREE.Box3().setFromObject(this.group);
        return box;
    }
    
    getBoundingSphere() {
        const sphere = new THREE.Sphere();
        const box = this.getBoundingBox();
        box.getBoundingSphere(sphere);
        return sphere;
    }
}

export class UFOManager {
    constructor() {
        this.ufos = [];
        this.maxUFOs = 4;
        this.spawnRadius = 200;
        this.spawnHeight = [60, 90]; // Min and max spawn height
        this.respawnDelay = 5; // Seconds before spawning new UFO
        this.spawnTimer = 0;
        
        this.group = new THREE.Group();
        
        // Initial spawn
        this.spawnInitialUFOs();
    }
    
    spawnInitialUFOs() {
        for (let i = 0; i < this.maxUFOs; i++) {
            this.spawnUFO();
        }
    }
    
    spawnUFO() {
        if (this.ufos.length >= this.maxUFOs) return;
        
        const ufo = new UFO();
        
        // Random position around the city
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * this.spawnRadius;
        const height = this.spawnHeight[0] + Math.random() * (this.spawnHeight[1] - this.spawnHeight[0]);
        
        ufo.group.position.x = Math.cos(angle) * distance;
        ufo.group.position.z = Math.sin(angle) * distance;
        ufo.group.position.y = height;
        
        this.ufos.push(ufo);
        this.group.add(ufo.group);
    }
    
    update(deltaTime) {
        // Update existing UFOs
        for (let i = this.ufos.length - 1; i >= 0; i--) {
            const ufo = this.ufos[i];
            ufo.update(deltaTime);
            
            // Remove destroyed UFOs
            if (ufo.isDestroyed) {
                this.group.remove(ufo.group);
                this.ufos.splice(i, 1);
                this.spawnTimer = this.respawnDelay; // Start respawn timer
            }
        }
        
        // Handle respawning
        if (this.spawnTimer > 0) {
            this.spawnTimer -= deltaTime;
            if (this.spawnTimer <= 0) {
                this.spawnUFO();
            }
        }
    }
    
    getUFOs() {
        return this.ufos.filter(ufo => !ufo.isDestroyed);
    }
    
    checkCollisions(projectiles) {
        const hits = [];
        
        this.ufos.forEach((ufo, ufoIndex) => {
            if (ufo.isDestroyed) return;
            
            const ufoSphere = ufo.getBoundingSphere();
            
            projectiles.forEach((projectile, projectileIndex) => {
                const projectilePosition = projectile.group.position;
                // Update UFO sphere center to world position
                ufoSphere.center.copy(ufo.group.position);
                const distance = ufoSphere.center.distanceTo(projectilePosition);
                
                if (distance <= ufoSphere.radius + 2) { // Add small buffer for easier hits
                    hits.push({
                        ufoIndex,
                        projectileIndex,
                        ufo,
                        projectile,
                        position: projectilePosition.clone()
                    });
                }
            });
        });
        
        return hits;
    }
} 