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
    // New controls for lm() tuning
    const lmLinearSlider = document.getElementById('lmLinearSlider');
    const lmQuadraticSlider = document.getElementById('lmQuadraticSlider');
    const lmLinearVal = document.getElementById('lmLinearVal');
    const lmQuadraticVal = document.getElementById('lmQuadraticVal');
    // Issue selection tuning controls
    const issueSelLinearSlider = document.getElementById('issueSelLinearSlider');
    const issueSelQuadraticSlider = document.getElementById('issueSelQuadraticSlider');
    const issueSelLinearVal = document.getElementById('issueSelLinearVal');
    const issueSelQuadraticVal = document.getElementById('issueSelQuadraticVal');
    
    // Slider event listeners
    issuesSlider.addEventListener('input', () => {
        MODEL_CONFIG.nIssues = parseInt(issuesSlider.value);
        issuesVal.textContent = MODEL_CONFIG.nIssues;
        // Regenerate static distribution when nIssues changes
        populateStaticDistribution(UI_CONFIG.staticSample.nUsers);
    });
    
    // legacy beta sliders removed

    // Initialize lm() sliders when model loads (if present)
    window.addEventListener('issueIrtModelLoaded', (e) => {
        const coefs = e.detail?.coefs || {};
        const b1 = coefs['issue_irt_scale'] ?? 0;
        const b2 = coefs['issue_irt_scale_sq'] ?? coefs['I(issue_irt_scale^2)'] ?? 0;
        if (lmLinearSlider) {
            lmLinearSlider.value = b1;
            lmLinearVal.textContent = Number(b1).toFixed(6);
            if (window.ISSUE_IRT_TUNING) window.ISSUE_IRT_TUNING.linear = b1;
        }
        if (lmQuadraticSlider) {
            lmQuadraticSlider.value = b2;
            lmQuadraticVal.textContent = Number(b2).toFixed(6);
            if (window.ISSUE_IRT_TUNING) window.ISSUE_IRT_TUNING.quadratic = b2;
        }
    });

    // Hook lm() sliders to tuning values used by selection.js
    if (lmLinearSlider) {
        lmLinearSlider.addEventListener('input', () => {
            const v = parseFloat(lmLinearSlider.value);
            if (window.ISSUE_IRT_TUNING) {
                window.ISSUE_IRT_TUNING.linear = v;
            }
            lmLinearVal.textContent = v.toFixed(6);
        });
    }
    if (lmQuadraticSlider) {
        lmQuadraticSlider.addEventListener('input', () => {
            const v = parseFloat(lmQuadraticSlider.value);
            if (window.ISSUE_IRT_TUNING) {
                window.ISSUE_IRT_TUNING.quadratic = v;
            }
            lmQuadraticVal.textContent = v.toFixed(6);
        });
    }

    // Initialize issue selection sliders when model loads
    window.addEventListener('issueSelectionModelLoaded', (e) => {
        const coefs = e.detail?.coefs || {};
        const c1 = coefs['issue_specific_conservatism'] ?? 0;
        const c2 = coefs['issue_specific_conservatism_sq'] ?? coefs['I(issue_specific_conservatism^2)'] ?? 0;
        if (issueSelLinearSlider) {
            issueSelLinearSlider.value = c1;
            issueSelLinearVal.textContent = Number(c1).toFixed(6);
            if (window.ISSUE_SELECTION_TUNING) window.ISSUE_SELECTION_TUNING.linear = c1;
        }
        if (issueSelQuadraticSlider) {
            issueSelQuadraticSlider.value = c2;
            issueSelQuadraticVal.textContent = Number(c2).toFixed(6);
            if (window.ISSUE_SELECTION_TUNING) window.ISSUE_SELECTION_TUNING.quadratic = c2;
        }
    });

    // Hook issue selection sliders to tuning
    if (issueSelLinearSlider) {
        issueSelLinearSlider.addEventListener('input', () => {
            const v = parseFloat(issueSelLinearSlider.value);
            if (window.ISSUE_SELECTION_TUNING) {
                window.ISSUE_SELECTION_TUNING.linear = v;
            }
            issueSelLinearVal.textContent = v.toFixed(6);
        });
    }
    if (issueSelQuadraticSlider) {
        issueSelQuadraticSlider.addEventListener('input', () => {
            const v = parseFloat(issueSelQuadraticSlider.value);
            if (window.ISSUE_SELECTION_TUNING) {
                window.ISSUE_SELECTION_TUNING.quadratic = v;
            }
            issueSelQuadraticVal.textContent = v.toFixed(6);
        });
    }
    
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

    // Scaling UI removed; forcing independent scaling in rendering for testing
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
    const issuesValEl = document.getElementById('issuesVal');
    if (issuesValEl) issuesValEl.textContent = MODEL_CONFIG.nIssues;
    // legacy beta displays removed
}
