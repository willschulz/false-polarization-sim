/**
 * Main application initialization and p5.js setup
 * Self-Censorship Multi-Stage Visualization Dashboard
 */

/**
 * p5.js setup function - called once when the page loads
 */
function setup() {
    // Create canvas and attach to container
    const canvas = createCanvas(VISUAL_CONFIG.canvas.width, VISUAL_CONFIG.canvas.height);
    canvas.parent('canvasContainer');
    
    // Set color mode and ensure pure white background
    colorMode(RGB, 255);
    background(255, 255, 255);
    
    // Force canvas style to white background
    canvas.canvas.style.backgroundColor = '#ffffff';
    
    // Initialize histogram objects
    initHistogram(histograms.trueAll);
    initHistogram(histograms.tweetAuthorsPolitical);
    initHistogram(histograms.tweetAuthorsNonPolitical);
    initHistogram(histograms.postedAttitudes);
    initHistogram(histograms.shadowAttitudes);
    
    // Calculate panel positions based on canvas height (3 panels)
    const panelHeight = height / 3;
    HISTOGRAM_CONFIG.panels = [
        { baseY: panelHeight - 50 },                // Panel 1: Normal population
        { baseY: 2 * panelHeight - 50 },            // Panel 2: Authors overlay (political vs non-political)
        { baseY: 3 * panelHeight - 50 }             // Panel 3: Attitudes overlay
    ];
    
    // Set up text rendering
    textAlign(CENTER, CENTER);
    textSize(12);
    
    // Initialize the static distribution for the top panel
    populateStaticDistribution(UI_CONFIG.staticSample.nUsers);
    
    // Initialize UI controls
    initControls();
    updateDisplayValues();
    
    console.log('Self-Censorship Visualization initialized');
    console.log('Model parameters:', MODEL_CONFIG);
}

// Note: draw() function is defined in visualization.js

/**
 * Window load event - ensure DOM is ready before initializing p5.js
 */
window.addEventListener('load', () => {
    console.log('Dashboard loaded successfully');
});

/**
 * Handle window resize (optional enhancement)
 */
window.addEventListener('resize', () => {
    // Could add responsive canvas resizing here if needed
});

/**
 * Keyboard shortcuts (optional enhancement)
 */
function keyPressed() {
    switch (key) {
        case 's':
        case 'S':
            sampleUser();
            break;
        case 'r':
        case 'R':
            resetVisualization();
            break;
        case 'a':
        case 'A':
            const autoBtn = document.getElementById('autoBtn');
            toggleAutoSampling(autoBtn);
            break;
    }
}

/**
 * Export functions for debugging in console
 */
window.debugAPI = {
    sampleUser,
    resetVisualization,
    MODEL_CONFIG,
    HISTOGRAM_CONFIG,
    balls: () => balls,
    histograms: () => histograms
};
