/**
 * Selection math for user- and attitude-level processes
 * - political_tweeting_probability_function(userIdeology)
 * - pick_tweet_topic(topicIdeologies)
 *
 * Depends on global MODEL_CONFIG and MATH_UTILS defined in config.js
 */

// Cached model object loaded from assets/models/issue_irt_scale_lm.json
let ISSUE_IRT_SCALE_LM = null;
// Optional UI overrides for b1 and b2 (also exposed on window for controls)
const ISSUE_IRT_TUNING = {
    linear: null,      // overrides b1 when not null
    quadratic: null    // overrides b2 when not null
};

// expose tuning for UI sliders
try { window.ISSUE_IRT_TUNING = ISSUE_IRT_TUNING; } catch (e) {}

// helper to expose current model coefficients to UI
function _getIssueIrtCoefs() {
    if (!ISSUE_IRT_SCALE_LM || !ISSUE_IRT_SCALE_LM.coefficients) return null;
    const c = ISSUE_IRT_SCALE_LM.coefficients;
    return {
        intercept: c['(Intercept)'] ?? c['intercept'] ?? 0,
        linear: c['issue_irt_scale'] ?? 0,
        quadratic: c['issue_irt_scale_sq'] ?? c['I(issue_irt_scale^2)'] ?? 0
    };
}
try { window.getIssueIrtCoefs = _getIssueIrtCoefs; } catch (e) {}

// helper to describe current user sampling method and parameters
function _getUserSamplingInfo() {
    const lm = _getIssueIrtCoefs();
    if (lm) {
        const effLinear = (ISSUE_IRT_TUNING.linear !== null) ? ISSUE_IRT_TUNING.linear : lm.linear;
        const effQuadratic = (ISSUE_IRT_TUNING.quadratic !== null) ? ISSUE_IRT_TUNING.quadratic : lm.quadratic;
        return {
            method: 'R lm quadratic (o_mean_political ~ issue_irt_scale + issue_irt_scale^2)',
            intercept: lm.intercept,
            linear: effLinear,
            quadratic: effQuadratic,
            clip: (ISSUE_IRT_SCALE_LM.clip || [0, 1])
        };
    }
    const cfg = MODEL_CONFIG.politicalTweeting;
    return {
        method: 'fallback logistic-shaped function',
        base: cfg.base,
        amplitude: cfg.amplitude,
        slope: cfg.slope,
        center: cfg.center
    };
}
try { window.getUserSamplingInfo = _getUserSamplingInfo; } catch (e) {}

// ====================================================================
// Issue-level selection model (topic choice among political tweets)
// ====================================================================

// Cached model object loaded from assets/models/issue_selection_lm.json
let ISSUE_SELECTION_LM = null;
// Optional UI overrides for issue selection model
const ISSUE_SELECTION_TUNING = {
    linear: null,
    quadratic: null
};
try { window.ISSUE_SELECTION_TUNING = ISSUE_SELECTION_TUNING; } catch (e) {}

/**
 * Load the issue selection model coefficients based on issue-specific conservatism
 * Recommended JSON schema:
 * {
 *   "coefficients": {
 *     "(Intercept)": <number>,
 *     "issue_specific_conservatism": <number>,
 *     "issue_specific_conservatism_sq": <number> // or "I(issue_specific_conservatism^2)"
 *   },
 *   "clip": [0, 1] // optional
 * }
 */
function loadIssueSelectionModel() {
    fetch('assets/models/issue_selection_lm.json')
        .then((res) => res.json())
        .then((json) => {
            ISSUE_SELECTION_LM = json;
            console.log('Loaded issue selection LM model coefficients');
            try {
                const coefs = json.coefficients || {};
                window.dispatchEvent(new CustomEvent('issueSelectionModelLoaded', { detail: { coefs } }));
            } catch (_) {}
        })
        .catch((err) => {
            console.warn('Failed to load issue_selection LM model. Falling back to default weights.', err);
        });
}

/**
 * Predict an issue weight from the lm() coefficients using issue_specific_conservatism (x)
 * This returns a non-negative weight suitable for proportional selection among topics.
 * Note: We intentionally ignore other_issues_* and polInt terms to focus on issue-specific effects.
 */
function predict_issue_weight_from_lm(x) {
    if (!ISSUE_SELECTION_LM || !ISSUE_SELECTION_LM.coefficients) return null;
    const coefs = ISSUE_SELECTION_LM.coefficients;
    const b0 = coefs['(Intercept)'] ?? coefs['intercept'] ?? 0;
    const b1 = (ISSUE_SELECTION_TUNING.linear !== null) ? ISSUE_SELECTION_TUNING.linear : (coefs['issue_specific_conservatism'] ?? 0);
    const b2 = (ISSUE_SELECTION_TUNING.quadratic !== null) ? ISSUE_SELECTION_TUNING.quadratic : (coefs['issue_specific_conservatism_sq'] ?? coefs['I(issue_specific_conservatism^2)'] ?? 0);
    let yhat = b0 + b1 * x + b2 * x * x;
    // For selection weights, ensure non-negative (relative scaling is what matters)
    if (!isFinite(yhat)) yhat = 0;
    if (yhat < 0) yhat = 0;
    return yhat;
}

/**
 * Load the R lm() model coefficients for o_mean_political ~ issue_irt_scale + I(issue_irt_scale^2)
 * Expected JSON schema (keys are flexible; see predict function for mapping):
 * {
 *   "coefficients": {
 *     "(Intercept)": <number>,
 *     "issue_irt_scale": <number>,
 *     "issue_irt_scale_sq": <number> // or "I(issue_irt_scale^2)"
 *   },
 *   "clip": [0, 1]
 * }
 */
function loadIssueIrtScaleModel() {
    fetch('assets/models/issue_irt_scale_lm.json')
        .then((res) => res.json())
        .then((json) => {
            ISSUE_IRT_SCALE_LM = json;
            console.log('Loaded issue_irt_scale LM model coefficients');
            try {
                const coefs = json.coefficients || {};
                // Notify UI listeners so controls can initialize to model values
                window.dispatchEvent(new CustomEvent('issueIrtModelLoaded', { detail: { coefs } }));
            } catch (e) {
                // no-op if window not available
            }
        })
        .catch((err) => {
            console.warn('Failed to load issue_irt_scale LM model. Falling back to default function.', err);
        });
}

/**
 * Predict political tweet probability using the loaded lm() coefficients.
 * Returns null if model is not available.
 */
function predict_political_probability_from_lm(x) {
    if (!ISSUE_IRT_SCALE_LM || !ISSUE_IRT_SCALE_LM.coefficients) return null;
    const coefs = ISSUE_IRT_SCALE_LM.coefficients;
    const b0 = coefs['(Intercept)'] ?? coefs['intercept'] ?? 0;
    const b1 = (ISSUE_IRT_TUNING.linear !== null) ? ISSUE_IRT_TUNING.linear : (coefs['issue_irt_scale'] ?? 0);
    const b2 = (ISSUE_IRT_TUNING.quadratic !== null) ? ISSUE_IRT_TUNING.quadratic : (coefs['issue_irt_scale_sq'] ?? coefs['I(issue_irt_scale^2)'] ?? 0);
    const yhat = b0 + b1 * x + b2 * x * x;
    const clip = ISSUE_IRT_SCALE_LM.clip || [0, 1];
    return MATH_UTILS.clamp(yhat, clip[0], clip[1]);
}

/**
 * Probability a tweet from a user with ideology x is political.
 * Uses R lm() coefficients if available; otherwise falls back to logistic-shaped default.
 * @param {number} x
 * @returns {number} probability in [0,1]
 */
function political_tweeting_probability_function(x) {
    const lmPred = predict_political_probability_from_lm(x);
    if (lmPred !== null) return lmPred;
    const cfg = MODEL_CONFIG.politicalTweeting;
    const s = MATH_UTILS.sigmoid(cfg.slope * (x - cfg.center));
    const p = cfg.base + cfg.amplitude * s;
    return MATH_UTILS.clamp(p, 0, 1);
}

/**
 * Choose which issue the tweet is about, based on issue ideologies.
 * Default: probability proportional to absolute extremity.
 * @param {number[]} topicIdeologies
 * @returns {number} index of chosen topic
 */
function pick_tweet_topic(topicIdeologies) {
    // Prefer model-based weights if available
    let weights = topicIdeologies.map((v) => {
        const w = predict_issue_weight_from_lm(v);
        return (w === null) ? Math.abs(v) : w;
    });
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum <= 0) return Math.floor(Math.random() * topicIdeologies.length);
    let r = Math.random() * sum;
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return weights.length - 1;
}


