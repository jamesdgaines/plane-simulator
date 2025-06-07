import * as THREE from 'three';

export class Projectile {
    constructor(position, direction, speed = 100) {
        this.group = new THREE.Group();
        this.velocity = direction.clone().multiplyScalar(speed);
        this.life = 3; // Projectile lives for 3 seconds
        this.maxLife = 3;
        
        this.createProjectile();
        this.group.position.copy(position);
    }
    
    createProjectile() {
        // Main bullet
        const bulletGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1, 8);
        const bulletMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0x444400,
            transparent: true,
            opacity: 1
        });
        this.bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        this.bullet.rotateZ(Math.PI / 2); // Point forward
        this.group.add(this.bullet);
        
        // Tracer effect
        const tracerGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 6);
        const tracerMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0x222200,
            transparent: true,
            opacity: 0.6
        });
        this.tracer = new THREE.Mesh(tracerGeometry, tracerMaterial);
        this.tracer.rotateZ(Math.PI / 2);
        this.tracer.position.x = -2; // Behind the bullet
        this.group.add(this.tracer);
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        
        // Move projectile
        this.group.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Fade out over time
        const fadePercent = this.life / this.maxLife;
        this.bullet.material.opacity = fadePercent;
        this.tracer.material.opacity = fadePercent * 0.6;
        
        return this.life > 0;
    }
    
    isAlive() {
        return this.life > 0;
    }
}

export class WeaponSystem {
    constructor(plane) {
        this.plane = plane;
        this.projectiles = [];
        this.fireRate = 5; // Shots per second
        this.timeSinceLastShot = 0;
        this.ammo = 100;
        this.maxAmmo = 100;
        this.ammoRegenRate = 10; // Ammo per second
        this.muzzleFlash = null;
        this.muzzleFlashTime = 0;
        
        this.group = new THREE.Group();
        this.createMuzzleFlash();
        
        // Input handling
        this.setupInputs();
    }
    
    createMuzzleFlash() {
        const flashGeometry = new THREE.SphereGeometry(1, 8, 8);
        const flashMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            transparent: true,
            opacity: 0
        });
        this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
        this.group.add(this.muzzleFlash);
    }
    
    setupInputs() {
        this.isFiring = false;
        
        // Mouse controls
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // Left click
                this.isFiring = true;
            }
        });
        
        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                this.isFiring = false;
            }
        });
        
        // Keyboard controls
        this.keys = {};
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            if (event.code === 'Space') {
                event.preventDefault();
                this.isFiring = true;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
            
            if (event.code === 'Space') {
                this.isFiring = false;
            }
        });
    }
    
    update(deltaTime) {
        this.timeSinceLastShot += deltaTime;
        
        // Handle firing
        if (this.isFiring && this.canFire()) {
            this.fire();
        }
        
        // Regenerate ammo
        if (this.ammo < this.maxAmmo) {
            this.ammo = Math.min(this.maxAmmo, this.ammo + this.ammoRegenRate * deltaTime);
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const isAlive = projectile.update(deltaTime);
            
            if (!isAlive) {
                this.group.remove(projectile.group);
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update muzzle flash
        if (this.muzzleFlashTime > 0) {
            this.muzzleFlashTime -= deltaTime;
            const flashIntensity = this.muzzleFlashTime / 0.1; // 0.1 second flash
            this.muzzleFlash.material.opacity = flashIntensity;
            
            if (this.muzzleFlashTime <= 0) {
                this.muzzleFlash.material.opacity = 0;
            }
        }
        
        // Position muzzle flash at plane nose
        if (this.plane && this.plane.group) {
            this.muzzleFlash.position.copy(this.plane.group.position);
            this.muzzleFlash.position.add(
                new THREE.Vector3(0, 0, 6).applyQuaternion(this.plane.group.quaternion)
            );
        }
    }
    
    canFire() {
        const fireInterval = 1 / this.fireRate;
        return this.timeSinceLastShot >= fireInterval && this.ammo >= 1;
    }
    
    fire() {
        if (!this.plane || !this.plane.group) return;
        
        this.ammo -= 1;
        this.timeSinceLastShot = 0;
        this.muzzleFlashTime = 0.1;
        
        // Calculate firing position (nose of plane)
        const planePosition = this.plane.group.position.clone();
        const firingOffset = new THREE.Vector3(0, 0, 6).applyQuaternion(this.plane.group.quaternion);
        const firingPosition = planePosition.add(firingOffset);
        
        // Calculate firing direction (forward from plane)
        const firingDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(this.plane.group.quaternion);
        
        // Create projectile
        const projectile = new Projectile(firingPosition, firingDirection, 120);
        this.projectiles.push(projectile);
        this.group.add(projectile.group);
    }
    
    getProjectiles() {
        return this.projectiles;
    }
    
    removeProjectile(index) {
        if (index >= 0 && index < this.projectiles.length) {
            const projectile = this.projectiles[index];
            this.group.remove(projectile.group);
            this.projectiles.splice(index, 1);
        }
    }
    
    getAmmoCount() {
        return Math.floor(this.ammo);
    }
    
    getMaxAmmo() {
        return this.maxAmmo;
    }
}

export class ExplosionEffect {
    constructor(position) {
        this.group = new THREE.Group();
        this.particles = [];
        this.life = 2; // Effect lasts 2 seconds
        this.maxLife = 2;
        
        this.group.position.copy(position);
        this.createExplosion();
    }
    
    createExplosion() {
        // Create explosion particles
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.5, 6, 6);
            const particleMaterial = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 1, 0.5 + Math.random() * 0.5),
                emissive: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 1, 0.3)
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position within explosion
            particle.position.set(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4
            );
            
            // Random velocity
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );
            
            this.particles.push({
                mesh: particle,
                velocity: velocity,
                life: 1 + Math.random() * 1
            });
            
            this.group.add(particle);
        }
        
        // Create central flash
        const flashGeometry = new THREE.SphereGeometry(3, 8, 8);
        const flashMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        this.flash = new THREE.Mesh(flashGeometry, flashMaterial);
        this.group.add(this.flash);
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        
        // Update particles
        this.particles.forEach(particle => {
            particle.life -= deltaTime;
            particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            
            // Fade and shrink
            const fadePercent = particle.life / 2;
            particle.mesh.material.opacity = fadePercent;
            particle.mesh.scale.setScalar(fadePercent);
            
            // Apply gravity
            particle.velocity.y -= 20 * deltaTime;
        });
        
        // Update central flash
        const flashPercent = this.life / this.maxLife;
        this.flash.material.opacity = flashPercent * 0.8;
        this.flash.scale.setScalar(1 + (1 - flashPercent) * 2);
        
        return this.life > 0;
    }
    
    isAlive() {
        return this.life > 0;
    }
}

export class EffectsManager {
    constructor() {
        this.explosions = [];
        this.group = new THREE.Group();
    }
    
    createExplosion(position) {
        const explosion = new ExplosionEffect(position);
        this.explosions.push(explosion);
        this.group.add(explosion.group);
    }
    
    update(deltaTime) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            const isAlive = explosion.update(deltaTime);
            
            if (!isAlive) {
                this.group.remove(explosion.group);
                this.explosions.splice(i, 1);
            }
        }
    }
} 