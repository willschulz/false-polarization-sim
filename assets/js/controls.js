/**
 * User interface controls and event handlers
 */

// Auto sampling state
let autoSampling = false;
let autoInterval;

/**
 * Initialize all control event listeners
 */
function initControls() {
    // Get DOM elements
    const issuesSlider = document.getElementById('issuesSlider');
    const beta1Slider = document.getElementById('beta1Slider');
    const beta2Slider = document.getElementById('beta2Slider');
    const issuesVal = document.getElementById('issuesVal');
    const beta1Val = document.getElementById('beta1Val');
    const beta2Val = document.getElementById('beta2Val');
    
    // Slider event listeners
    issuesSlider.addEventListener('input', () => {
        MODEL_CONFIG.nIssues = parseInt(issuesSlider.value);
        issuesVal.textContent = MODEL_CONFIG.nIssues;
        // Regenerate static distribution when nIssues changes
        populateStaticDistribution(UI_CONFIG.staticSample.nUsers);
    });
    
    beta1Slider.addEventListener('input', () => {
        MODEL_CONFIG.coefficients.beta1 = parseFloat(beta1Slider.value);
        beta1Val.textContent = MODEL_CONFIG.coefficients.beta1.toFixed(3);
    });
    
    beta2Slider.addEventListener('input', () => {
        MODEL_CONFIG.coefficients.beta2 = parseFloat(beta2Slider.value);
        beta2Val.textContent = MODEL_CONFIG.coefficients.beta2.toFixed(3);
    });
    
    // Button event listeners
    document.getElementById('sampleBtn').addEventListener('click', () => {
        sampleUser();
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
        resetVisualization();
    });
    
    document.getElementById('autoBtn').addEventListener('click', (e) => {
        toggleAutoSampling(e.target);
    });
}

/**
 * Toggle automatic sampling on/off
 */
function toggleAutoSampling(button) {
    if (!autoSampling) {
        autoSampling = true;
        autoInterval = setInterval(() => sampleUser(), UI_CONFIG.autoSampling.defaultSpeed);
        button.textContent = 'Stop Auto Sample';
        button.classList.remove('btn-secondary');
        button.classList.add('btn-danger');
    } else {
        autoSampling = false;
        clearInterval(autoInterval);
        button.textContent = 'Start Auto Sample';
        button.classList.remove('btn-danger');
        button.classList.add('btn-secondary');
    }
}

/**
 * Update UI display values to match current configuration
 */
function updateDisplayValues() {
    document.getElementById('issuesVal').textContent = MODEL_CONFIG.nIssues;
    document.getElementById('beta1Val').textContent = MODEL_CONFIG.coefficients.beta1.toFixed(3);
    document.getElementById('beta2Val').textContent = MODEL_CONFIG.coefficients.beta2.toFixed(3);
}
