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
    
    // Apply visualization column styling from config
    const columnEl = document.getElementById('vizColumn');
    if (columnEl) {
        const bg = (VISUAL_CONFIG.column && VISUAL_CONFIG.column.backgroundColor) || '#ffffff';
        columnEl.style.backgroundColor = bg;
        if (VISUAL_CONFIG.column && VISUAL_CONFIG.column.widthMatchesCanvas) {
            columnEl.style.width = `${VISUAL_CONFIG.canvas.width}px`;
        }
    }
    // Make canvas background transparent
    canvas.canvas.style.backgroundColor = 'transparent';
    
    // Initialize histogram objects
    initHistogram(histograms.trueAll);
    initHistogram(histograms.tweetAuthorsPolitical);
    initHistogram(histograms.tweetAuthorsNonPolitical);
    initHistogram(histograms.postedAttitudes);
    initHistogram(histograms.shadowAttitudes);
    
    // Calculate panel positions based on canvas height (3 panels)
    const maxBar = HISTOGRAM_CONFIG.visual.maxBarHeight;
    const defaultHeadroom = HISTOGRAM_CONFIG.visual.panelTopPadding || 0;
    const topHeadroom = HISTOGRAM_CONFIG.visual.topPanelTopPadding ?? defaultHeadroom;
    const bottomPadding = HISTOGRAM_CONFIG.visual.bottomPanelBottomPadding || 0;
    const bottomLabelPad = HISTOGRAM_CONFIG.visual.bottomPanelLabelPadding || 0;
    // Equal spacing between x-axes while respecting top and bottom paddings
    const baseY1 = topHeadroom + maxBar;
    const baseY3 = height - (bottomPadding + bottomLabelPad);
    const gap = (baseY3 - baseY1) / 2;
    const baseY2 = baseY1 + gap;
    HISTOGRAM_CONFIG.panels = [
        { baseY: baseY1 },
        { baseY: baseY2 },
        { baseY: baseY3 }
    ];
    
    // Set up text rendering
    textAlign(CENTER, CENTER);
    textSize(12);
    
    // Initialize the static distribution for the top panel
    populateStaticDistribution(UI_CONFIG.staticSample.nUsers);
    
    // Attempt to load external selection model(s)
    if (typeof loadIssueIrtScaleModel === 'function') {
        loadIssueIrtScaleModel();
    }
    if (typeof loadIssueSelectionModel === 'function') {
        loadIssueSelectionModel();
    }

    // Initialize UI controls
    initControls();
    updateDisplayValues();
    
    console.log('Self-Censorship Visualization initialized');
    console.log('Model parameters:', MODEL_CONFIG);

    // Model info modal removed
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
