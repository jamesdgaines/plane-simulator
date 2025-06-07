import * as THREE from 'three';

export class City {
    constructor() {
        this.group = new THREE.Group();
        this.buildings = [];
        
        this.createCity();
        
        console.log('🏙️ City environment created');
    }
    
    createCity() {
        // Create the city grid
        this.createBuildings();
        this.createStreets();
        this.createCityGround();
    }
    
    createBuildings() {
        const buildingColors = [
            0x8B8B8B, // Gray
            0xA0A0A0, // Light Gray
            0x696969, // Dim Gray
            0x778899, // Light Slate Gray
            0x2F4F4F, // Dark Slate Gray
            0x4682B4, // Steel Blue
            0x5F5F5F  // Dark Gray
        ];
        
        const gridSize = 20;
        const buildingSpacing = 8;
        const cityRadius = 150;
        
        for (let x = -gridSize; x <= gridSize; x++) {
            for (let z = -gridSize; z <= gridSize; z++) {
                const buildingX = x * buildingSpacing;
                const buildingZ = z * buildingSpacing;
                
                // Skip center area (where plane starts)
                const distanceFromCenter = Math.sqrt(buildingX * buildingX + buildingZ * buildingZ);
                if (distanceFromCenter < 20) continue;
                
                // Create buildings within city radius
                if (distanceFromCenter < cityRadius) {
                    // Random chance to place a building (creates some variety)
                    if (Math.random() > 0.15) {
                        this.createBuilding(buildingX, buildingZ, buildingColors);
                    }
                }
            }
        }
    }
    
    createBuilding(x, z, colors) {
        // Random building dimensions
        const width = 2 + Math.random() * 4;
        const depth = 2 + Math.random() * 4;
        const height = 5 + Math.random() * 25;
        
        // Create building geometry
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshLambertMaterial({ 
            color: colors[Math.floor(Math.random() * colors.length)]
        });
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        
        // Add some windows (simple emissive rectangles)
        this.addWindows(building, width, height, depth);
        
        this.buildings.push(building);
        this.group.add(building);
    }
    
    addWindows(building, width, height, depth) {
        const windowCount = Math.floor(height / 3);
        
        for (let i = 0; i < windowCount; i++) {
            // Random chance for lit windows
            if (Math.random() > 0.6) {
                const windowGeometry = new THREE.PlaneGeometry(0.3, 0.4);
                const windowMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xffff99,
                    emissive: 0xffff99,
                    emissiveIntensity: 0.3
                });
                
                const window = new THREE.Mesh(windowGeometry, windowMaterial);
                
                // Position windows on building faces
                const side = Math.floor(Math.random() * 4);
                switch(side) {
                    case 0: // Front
                        window.position.set(0, -height/2 + 2 + i * 3, depth/2 + 0.01);
                        break;
                    case 1: // Back  
                        window.position.set(0, -height/2 + 2 + i * 3, -depth/2 - 0.01);
                        window.rotation.y = Math.PI;
                        break;
                    case 2: // Left
                        window.position.set(-width/2 - 0.01, -height/2 + 2 + i * 3, 0);
                        window.rotation.y = Math.PI / 2;
                        break;
                    case 3: // Right
                        window.position.set(width/2 + 0.01, -height/2 + 2 + i * 3, 0);
                        window.rotation.y = -Math.PI / 2;
                        break;
                }
                
                building.add(window);
            }
        }
    }
    
    createStreets() {
        const streetMaterial = new THREE.MeshLambertMaterial({ color: 0x2C2C2C });
        
        // Create main streets in a grid pattern
        const streetWidth = 4;
        const streetLength = 300;
        const streetSpacing = 32;
        
        // Horizontal streets
        for (let i = -4; i <= 4; i++) {
            const streetGeometry = new THREE.PlaneGeometry(streetLength, streetWidth);
            const street = new THREE.Mesh(streetGeometry, streetMaterial);
            street.rotation.x = -Math.PI / 2;
            street.position.set(0, 0.01, i * streetSpacing);
            street.receiveShadow = true;
            this.group.add(street);
        }
        
        // Vertical streets
        for (let i = -4; i <= 4; i++) {
            const streetGeometry = new THREE.PlaneGeometry(streetWidth, streetLength);
            const street = new THREE.Mesh(streetGeometry, streetMaterial);
            street.rotation.x = -Math.PI / 2;
            street.position.set(i * streetSpacing, 0.01, 0);
            street.receiveShadow = true;
            this.group.add(street);
        }
    }
    
    createCityGround() {
        // Replace the simple green ground with urban terrain
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a4a4a // Dark gray urban ground
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        
        this.group.add(ground);
    }
    
    update(deltaTime) {
        // Animate window lighting (flicker effect)
        this.buildings.forEach(building => {
            building.children.forEach(child => {
                if (child.material && child.material.emissive) {
                    const flicker = 0.2 + Math.sin(Date.now() * 0.001 + Math.random() * 10) * 0.1;
                    child.material.emissiveIntensity = Math.max(0.1, flicker);
                }
            });
        });
    }
} 