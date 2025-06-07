import * as THREE from 'three';

export class Plane {
    constructor() {
        this.group = new THREE.Group();
        this.propeller = null;
        
        // Flight physics properties
        this.speed = 30; // Initial airspeed
        this.minSpeed = 10;
        this.maxSpeed = 50;
        this.propellerSpeed = 0;
        
        // Rotation properties (using Euler angles for limits)
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.maxPitchAngle = Math.PI / 3; // 60 degrees
        this.maxRollAngle = Math.PI / 4;  // 45 degrees
        
        // Auto-leveling properties
        this.autoLevelStrength = 2.0;
        
        this.createPlane();
        this.setupInitialPosition();
        
        console.log('✈️  Plane created with flight physics');
    }
    
    createPlane() {
        // Main fuselage (body) - oriented along Z-axis (nose pointing forward)
        const fuselageGeometry = new THREE.CylinderGeometry(0.3, 0.5, 6, 8);
        const fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0x1e40af });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.x = Math.PI / 2; // Rotate to point along Z-axis
        fuselage.castShadow = true;
        this.group.add(fuselage);
        
        // Wings - rectangular, passing through middle of fuselage, extending along X-axis
        const wingGeometry = new THREE.BoxGeometry(8, 0.2, 1.2);
        const wingMaterial = new THREE.MeshLambertMaterial({ color: 0x1e40af });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.set(0, 0, 0); // Centered through fuselage
        wings.castShadow = true;
        this.group.add(wings);
        
        // Vertical tail fin
        const tailFinGeometry = new THREE.BoxGeometry(0.2, 2, 0.8);
        const tailFinMaterial = new THREE.MeshLambertMaterial({ color: 0x1e40af });
        const tailFin = new THREE.Mesh(tailFinGeometry, tailFinMaterial);
        tailFin.position.set(0, 0.8, -2.8); // At the back, pointing up
        tailFin.castShadow = true;
        this.group.add(tailFin);
        
        // Horizontal stabilizers (tail wings)
        const hStabGeometry = new THREE.BoxGeometry(2.5, 0.15, 0.6);
        const hStabMaterial = new THREE.MeshLambertMaterial({ color: 0x1e40af });
        const hStab = new THREE.Mesh(hStabGeometry, hStabMaterial);
        hStab.position.set(0, 0, -2.8); // At the back, horizontal
        hStab.castShadow = true;
        this.group.add(hStab);
        
        // Propeller hub at the front
        const hubGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8);
        const hubMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const hub = new THREE.Mesh(hubGeometry, hubMaterial);
        hub.rotation.x = Math.PI / 2; // Same orientation as fuselage
        hub.position.set(0, 0, 3.2); // At the front nose
        hub.castShadow = true;
        this.group.add(hub);
        
        // Propeller blades
        this.propeller = new THREE.Group();
        const bladeGeometry = new THREE.BoxGeometry(0.1, 2.5, 0.15);
        const bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        
        // Create 3 propeller blades
        for (let i = 0; i < 3; i++) {
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.rotation.z = (i * Math.PI * 2) / 3; // Rotate around Z-axis
            blade.castShadow = true;
            this.propeller.add(blade);
        }
        
        this.propeller.position.set(0, 0, 3.4); // Slightly in front of hub
        this.group.add(this.propeller);
        
        // Landing gear
        const gearGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        const gearMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
        // Main landing gear (under wings)
        const leftGear = new THREE.Mesh(gearGeometry, gearMaterial);
        leftGear.position.set(-1.5, -0.8, 0);
        leftGear.castShadow = true;
        this.group.add(leftGear);
        
        const rightGear = new THREE.Mesh(gearGeometry, gearMaterial);
        rightGear.position.set(1.5, -0.8, 0);
        rightGear.castShadow = true;
        this.group.add(rightGear);
        
        // Tail wheel
        const tailGear = new THREE.Mesh(gearGeometry, gearMaterial);
        tailGear.position.set(0, -0.8, -2.5);
        tailGear.castShadow = true;
        this.group.add(tailGear);
        
        // Position will be set in setupInitialPosition
    }
    
    setupInitialPosition() {
        // Position plane above and outside city, approaching inward
        this.group.position.set(0, 40, -100);
        
        // Set initial nose-down attitude for natural descent approach
        this.rotation.x = -0.1; // Slight nose-down (about 6 degrees)
        this.group.rotation.copy(this.rotation);
    }
    
    update(deltaTime, controls = null) {
        if (controls) {
            this.updateFlightPhysics(deltaTime, controls);
        } else {
            // Fallback for when no controls are provided
            this.updateBasicMovement(deltaTime);
        }
        
        // Update propeller rotation based on speed
        this.propellerSpeed = 10 + (this.speed / this.maxSpeed) * 30;
        if (this.propeller) {
            this.propeller.rotation.z += this.propellerSpeed * deltaTime;
        }
    }
    
    updateFlightPhysics(deltaTime, controls) {
        // Get control inputs
        const pitchInput = controls.getPitchInput();
        const rollInput = controls.getRollInput();
        const speedInput = controls.getSpeedInput();
        
        // Update speed
        this.speed += speedInput * 20 * deltaTime;
        this.speed = Math.max(this.minSpeed, Math.min(this.maxSpeed, this.speed));
        
        // Apply pitch control with limits
        this.rotation.x += pitchInput * deltaTime;
        this.rotation.x = Math.max(-this.maxPitchAngle, Math.min(this.maxPitchAngle, this.rotation.x));
        
        // Apply roll control with limits
        this.rotation.z += rollInput * deltaTime;
        this.rotation.z = Math.max(-this.maxRollAngle, Math.min(this.maxRollAngle, this.rotation.z));
        
        // Bank-proportional turning (IMPORTANT: negative sign for natural yaw)
        const bankAngle = this.rotation.z;
        this.rotation.y += -bankAngle * controls.sensitivity.turn * deltaTime;
        
        // Auto-leveling when no input
        if (!controls.hasFlightInput()) {
            this.rotation.x *= Math.pow(0.1, deltaTime * this.autoLevelStrength);
            this.rotation.z *= Math.pow(0.1, deltaTime * this.autoLevelStrength);
        }
        
        // Apply rotation to plane using quaternion for smooth movement
        this.group.quaternion.setFromEuler(this.rotation);
        
        // Forward movement based on current orientation and speed
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.group.quaternion);
        
        const velocity = forward.multiplyScalar(this.speed * deltaTime);
        this.group.position.add(velocity);
    }
    
    updateBasicMovement(deltaTime) {
        // Basic forward movement when no controls
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.group.quaternion);
        
        const velocity = forward.multiplyScalar(this.speed * deltaTime);
        this.group.position.add(velocity);
    }
} 