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

    // Utility to initialize a slider centered at coef with ±2*SE range and snapping step
    function initCoefSlider(sliderEl, valueEl, coef, se, onChange, decimals = 6, scaleEl = null) {
        if (!sliderEl || !valueEl) return;
        const center = Number(coef) || 0;
        const seNum = (typeof se === 'number' && isFinite(se) && se > 0) ? se : 0.001;
        const min = center - 2 * seNum;
        const max = center + 2 * seNum;
        //const step = (max - min) / 100; // 100 steps across ±2SE
        const step = (max - min) / 4;
        sliderEl.min = min.toString();
        sliderEl.max = max.toString();
        sliderEl.step = step.toString();
        sliderEl.value = center.toString();
        valueEl.textContent = center.toFixed(decimals);
        if (scaleEl) {
            // annotate ticks (labels are static, but we can add title tooltips with exact values)
            const ticks = scaleEl.querySelectorAll('.tick');
            if (ticks && ticks.length === 5) {
                ticks[0].title = (center - 2 * seNum).toFixed(decimals);
                ticks[1].title = (center - 1 * seNum).toFixed(decimals);
                ticks[2].title = center.toFixed(decimals);
                ticks[3].title = (center + 1 * seNum).toFixed(decimals);
                ticks[4].title = (center + 2 * seNum).toFixed(decimals);
            }
        }
        if (typeof onChange === 'function') {
            sliderEl.oninput = () => {
                const v = parseFloat(sliderEl.value);
                onChange(v);
                valueEl.textContent = v.toFixed(decimals);
            };
        }
    }

    // Initialize lm() sliders when model loads (if present)
    window.addEventListener('issueIrtModelLoaded', (e) => {
        const coefs = e.detail?.coefs || {};
        const se = e.detail?.se || {};
        const b1 = coefs['issue_irt_scale'] ?? 0;
        const b2 = coefs['issue_irt_scale_sq'] ?? coefs['I(issue_irt_scale^2)'] ?? 0;
        const se1 = se['issue_irt_scale'] ?? 0.001;
        const se2 = se['issue_irt_scale_sq'] ?? se['I(issue_irt_scale^2)'] ?? 0.001;
        initCoefSlider(
            lmLinearSlider,
            lmLinearVal,
            b1,
            se1,
            (v) => { if (window.ISSUE_IRT_TUNING) window.ISSUE_IRT_TUNING.linear = v; },
            6,
            document.getElementById('lmLinearScale')
        );
        initCoefSlider(
            lmQuadraticSlider,
            lmQuadraticVal,
            b2,
            se2,
            (v) => { if (window.ISSUE_IRT_TUNING) window.ISSUE_IRT_TUNING.quadratic = v; },
            6,
            document.getElementById('lmQuadraticScale')
        );
    });

    // No separate handlers needed; initCoefSlider attaches oninput

    // Initialize issue selection sliders when model loads
    window.addEventListener('issueSelectionModelLoaded', (e) => {
        const coefs = e.detail?.coefs || {};
        const se = e.detail?.se || {};
        const c1 = coefs['issue_specific_conservatism'] ?? 0;
        const c2 = coefs['issue_specific_conservatism_sq'] ?? coefs['I(issue_specific_conservatism^2)'] ?? 0;
        const sec1 = se['issue_specific_conservatism'] ?? 0.001;
        const sec2 = se['issue_specific_conservatism_sq'] ?? se['I(issue_specific_conservatism^2)'] ?? 0.001;
        initCoefSlider(
            issueSelLinearSlider,
            issueSelLinearVal,
            c1,
            sec1,
            (v) => { if (window.ISSUE_SELECTION_TUNING) window.ISSUE_SELECTION_TUNING.linear = v; },
            6,
            document.getElementById('issueSelLinearScale')
        );
        initCoefSlider(
            issueSelQuadraticSlider,
            issueSelQuadraticVal,
            c2,
            sec2,
            (v) => { if (window.ISSUE_SELECTION_TUNING) window.ISSUE_SELECTION_TUNING.quadratic = v; },
            6,
            document.getElementById('issueSelQuadraticScale')
        );
    });
    // No separate handlers needed; initCoefSlider attaches oninput
    
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
