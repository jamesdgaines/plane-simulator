import * as THREE from 'three';

export class CameraController {
    constructor(camera, plane) {
        this.camera = camera;
        this.plane = plane;
        
        // Camera modes
        this.modes = {
            FOLLOW: 'follow',
            ORBIT: 'orbit'
        };
        this.currentMode = this.modes.FOLLOW;
        
        // Follow camera settings
        this.followOffset = new THREE.Vector3(0, 3, -8);
        this.followLookAhead = new THREE.Vector3(0, 0, 5);
        this.smoothness = 0.1;
        
        // Orbit camera settings
        this.orbitDistance = 15;
        this.orbitAngle = 0;
        this.orbitSpeed = 1;
        
        // Camera toggle state
        this.lastToggleState = false;
        
        console.log('📷 Camera controller initialized');
    }
    
    update(deltaTime, controls) {
        // Handle camera mode toggle
        this.handleCameraToggle(controls);
        
        if (this.currentMode === this.modes.FOLLOW) {
            this.updateFollowCamera(deltaTime);
        } else {
            this.updateOrbitCamera(deltaTime, controls);
        }
    }
    
    handleCameraToggle(controls) {
        const togglePressed = controls.isCameraTogglePressed();
        
        // Toggle on key press (not hold)
        if (togglePressed && !this.lastToggleState) {
            this.toggleCameraMode();
        }
        
        this.lastToggleState = togglePressed;
    }
    
    toggleCameraMode() {
        if (this.currentMode === this.modes.FOLLOW) {
            this.currentMode = this.modes.ORBIT;
            console.log('📷 Switched to orbit camera');
        } else {
            this.currentMode = this.modes.FOLLOW;
            console.log('📷 Switched to follow camera');
        }
    }
    
    updateFollowCamera(deltaTime) {
        // Calculate desired camera position based on plane's rotation
        const planeQuaternion = this.plane.group.quaternion.clone();
        const desiredOffset = this.followOffset.clone();
        desiredOffset.applyQuaternion(planeQuaternion);
        
        const desiredPosition = this.plane.group.position.clone();
        desiredPosition.add(desiredOffset);
        
        // Calculate look-at target (ahead of the plane)
        const lookAhead = this.followLookAhead.clone();
        lookAhead.applyQuaternion(planeQuaternion);
        const lookTarget = this.plane.group.position.clone();
        lookTarget.add(lookAhead);
        
        // Smoothly interpolate camera position
        this.camera.position.lerp(desiredPosition, this.smoothness);
        
        // Smoothly look at target
        const currentLookTarget = new THREE.Vector3();
        this.camera.getWorldDirection(currentLookTarget);
        currentLookTarget.multiplyScalar(10);
        currentLookTarget.add(this.camera.position);
        
        currentLookTarget.lerp(lookTarget, this.smoothness * 0.5);
        this.camera.lookAt(currentLookTarget);
    }
    
    updateOrbitCamera(deltaTime, controls) {
        // Allow manual camera control in orbit mode
        if (controls.keys['KeyA']) {
            this.orbitAngle -= this.orbitSpeed * deltaTime;
        }
        if (controls.keys['KeyD']) {
            this.orbitAngle += this.orbitSpeed * deltaTime;
        }
        
        // Calculate orbit position around plane
        const planePos = this.plane.group.position;
        const orbitX = planePos.x + Math.cos(this.orbitAngle) * this.orbitDistance;
        const orbitZ = planePos.z + Math.sin(this.orbitAngle) * this.orbitDistance;
        const orbitY = planePos.y + 5;
        
        // Set camera position and look at plane
        this.camera.position.set(orbitX, orbitY, orbitZ);
        this.camera.lookAt(planePos);
    }
    
    getCurrentMode() {
        return this.currentMode;
    }
} 