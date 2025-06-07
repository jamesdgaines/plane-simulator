export class FlightControls {
    constructor() {
        this.keys = {};
        this.inputs = {
            pitch: 0,    // W/S input (-1 to 1)
            roll: 0,     // A/D input (-1 to 1)
            speed: 0     // Q/E input (-1 to 1)
        };
        
        // Sensitivity parameters
        this.sensitivity = {
            pitch: 0.8,
            turn: 1.5,
            roll: 2.0
        };
        
        this.setupEventListeners();
        
        console.log('🎮 Flight controls initialized');
    }
    
    setupEventListeners() {
        // Key down events
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });
        
        // Key up events
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // Prevent default behavior for game keys
        document.addEventListener('keydown', (event) => {
            const gameKeys = ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE', 'KeyC'];
            if (gameKeys.includes(event.code)) {
                event.preventDefault();
            }
        });
    }
    
    update(deltaTime) {
        // Update input values based on key states
        this.updateInputs();
    }
    
    updateInputs() {
        // Pitch control (W/S)
        let pitchInput = 0;
        if (this.keys['KeyW']) pitchInput += 1;  // Nose up
        if (this.keys['KeyS']) pitchInput -= 1;  // Nose down
        this.inputs.pitch = this.normalizeInput(pitchInput);
        
        // Roll control (A/D)
        let rollInput = 0;
        if (this.keys['KeyA']) rollInput -= 1;   // Roll left
        if (this.keys['KeyD']) rollInput += 1;   // Roll right
        this.inputs.roll = this.normalizeInput(rollInput);
        
        // Speed control (Q/E)
        let speedInput = 0;
        if (this.keys['KeyQ']) speedInput -= 1;  // Decrease speed
        if (this.keys['KeyE']) speedInput += 1;  // Increase speed
        this.inputs.speed = this.normalizeInput(speedInput);
    }
    
    normalizeInput(value) {
        // Clamp input to -1 to 1 range
        return Math.max(-1, Math.min(1, value));
    }
    
    // Get normalized input values
    getPitchInput() {
        return this.inputs.pitch * this.sensitivity.pitch;
    }
    
    getRollInput() {
        return this.inputs.roll * this.sensitivity.roll;
    }
    
    getTurnInput() {
        return this.inputs.roll * this.sensitivity.turn;
    }
    
    getSpeedInput() {
        return this.inputs.speed;
    }
    
    // Check if camera toggle key is pressed
    isCameraTogglePressed() {
        return this.keys['KeyC'];
    }
    
    // Check if any flight control keys are pressed
    hasFlightInput() {
        return this.inputs.pitch !== 0 || this.inputs.roll !== 0;
    }
} 