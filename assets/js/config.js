/**
 * ===================================================================
 * CONFIGURATION AND CONSTANTS
 * ===================================================================
 * 
 * This file contains all configuration parameters for the self-censorship
 * visualization model. These parameters control the statistical model,
 * visualization appearance, and user interface behavior.
 */

// ===================================================================
// STATISTICAL MODEL PARAMETERS
// ===================================================================

/**
 * Model configuration object containing all statistical parameters
 * These values are based on empirical estimates from mixed linear probability models
 */
const MODEL_CONFIG = {
    // Default number of issues each user has opinions about
    nIssues: 20,
    
    // Linear probability model coefficients
    // These control how extremity affects posting probability
    coefficients: {
        // Constant term (intercept) - baseline posting probability
        beta0: -0.004686,
        
        // User-level filtering effect - how other issues' extremity affects posting
        // Higher values mean users with extreme views on other topics are more likely to post
        beta1: 0.01455,
        
        // Issue-level filtering effect - how this issue's extremity affects posting
        // Higher values mean more extreme attitudes are more likely to be posted
        beta2: 0.004542
    },
    
    // Political tweeting probability function parameters
    politicalTweeting: {
        // Use a logistic-shaped function of ideology by default
        // p = base + amp * sigmoid(slope * x)
        base: 0.05,
        amplitude: 0.25,
        slope: 0.8,
        center: 0.0
    },
    
    // Random effect standard deviations
    randomEffects: {
        // User-level random intercept standard deviation
        sdUser: 0.011565,
        
        // Topic-level random intercept standard deviation  
        sdTopic: 0.003447,
        
        // Issue-level attitude variation around user mean
        sdIssue: 0.7,
        
        // User mean distribution standard deviation
        sdUserMu: 1.0
    }
};

// ===================================================================
// VISUALIZATION PARAMETERS
// ===================================================================

/**
 * Canvas and visualization settings
 */
const VISUAL_CONFIG = {
    canvas: {
        width: 700,
        height: 800
    },
    
    // Ball/shape appearance
    shapes: {
        size: 5,
        animationSpeed: 4,
        easingFactor: 0.05
    },
    
    // Color scheme for different elements
    colors: {
        // Stage colors (p5.js color objects will be created in main.js)
        trueAll: [0, 128, 0, 180],        // Green for all users' true means
        truePosting: [0, 102, 204, 180],  // Blue for posting users
        postedAttitudes: [220, 0, 0, 180], // Red for visible attitudes
        shadowAttitudes: [128, 128, 128, 180], // Gray for hidden attitudes
        
        // UI colors
        baseline: [0, 0, 0],              // Black for baselines
        stdMarkers: [0, 0, 0]             // Black for standard deviation markers
    }
};

// ===================================================================
// HISTOGRAM CONFIGURATION
// ===================================================================

/**
 * Histogram display and computation settings
 */
const HISTOGRAM_CONFIG = {
    // Number of bins for histogram discretization
    nBins: 100,
    
    // Range of values displayed on x-axis (ideology scale)
    // Symmetric around zero spanning 6 units in each direction
    range: [-6, 6],
    
    // Visual properties
    visual: {
        maxBarHeight: 80,    // Maximum pixel height for histogram bars
        panelSpacing: null   // Will be calculated based on canvas height
    },
    
    // Panel configuration (will be populated in main.js based on canvas)
    panels: []
};

// ===================================================================
// USER INTERFACE PARAMETERS
// ===================================================================

/**
 * Control settings and behavior
 */
const UI_CONFIG = {
    // Auto-sampling settings
    autoSampling: {
        defaultSpeed: 10,  // Milliseconds between automatic samples
        enabled: false
    },
    
    // Slider ranges and defaults
    sliders: {
        nIssues: {
            min: 3,
            max: 50,
            step: 1,
            default: 20
        },
        beta1: {
            min: 0,
            max: 0.05,
            step: 0.001,
            default: 0.014
        },
        beta2: {
            min: 0,
            max: 0.02,
            step: 0.0005,
            default: 0.0045
        }
    },
    
    // Static distribution parameters
    staticSample: {
        nUsers: 2000  // Number of users for the static top distribution
    },
    
    // Histogram scaling mode
    histogramScaling: {
        // false: consistent y-scale across overlaid distributions (raw comparison)
        // true: scale each overlaid distribution to its own max (maximize visibility)
        independent: false
    }
};

// ===================================================================
// MATHEMATICAL UTILITIES
// ===================================================================

/**
 * Mathematical constants and utility functions
 */
const MATH_UTILS = {
    // Standard normal distribution parameters
    normal: {
        sqrt2Pi: Math.sqrt(2 * Math.PI)
    },
    
    /**
     * Standard normal probability density function
     * @param {number} x - Input value
     * @returns {number} PDF value at x
     */
    standardNormalPdf: function(x) {
        return (1 / this.normal.sqrt2Pi) * Math.exp(-0.5 * x * x);
    },
    
    /**
     * Logistic sigmoid function
     */
    sigmoid: function(z) {
        return 1 / (1 + Math.exp(-z));
    },
    
    /**
     * Clamp a value between min and max (p5.js constrain equivalent)
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
};

// ===================================================================
// SAMPLING/SELECTION FUNCTIONS
// ===================================================================

/**
 * Probability a tweet from a user with ideology x is political.
 * Tunable via MODEL_CONFIG.politicalTweeting.
 */
// moved to selection.js

/**
 * Choose which issue the tweet is about, based on issue ideologies.
 * Default: probability proportional to absolute extremity.
 * @param {number[]} topicIdeologies
 * @returns {number} index of chosen topic
 */
// moved to selection.js

// ===================================================================
// DOCUMENTATION STRINGS
// ===================================================================

/**
 * Help text and explanations for UI elements
 */
const HELP_TEXT = {
    nIssues: "Controls how many political issues each simulated user has opinions about. More issues provide a richer basis for self-selection effects.",
    
    beta1: "User-level filtering coefficient. Higher values mean users with extreme views on other topics are more likely to post on any given topic.",
    
    beta2: "Issue-level filtering coefficient. Higher values mean more extreme attitudes on specific issues are more likely to be posted.",
    
    visualization: "This four-panel visualization shows how self-selection (who posts) and self-censorship (what gets posted) combine to create apparent polarization in visible attitudes."
};

// ===================================================================
// VALIDATION FUNCTIONS
// ===================================================================

/**
 * Parameter validation utilities
 */
const VALIDATORS = {
    /**
     * Validate that a number is within expected bounds
     * @param {number} value - Value to validate
     * @param {number} min - Minimum allowed value
     * @param {number} max - Maximum allowed value
     * @param {string} paramName - Parameter name for error messages
     * @returns {boolean} True if valid
     */
    validateRange: function(value, min, max, paramName) {
        if (isNaN(value) || value < min || value > max) {
            console.warn(`Invalid ${paramName}: ${value}. Expected value between ${min} and ${max}.`);
            return false;
        }
        return true;
    },
    
    /**
     * Validate model configuration
     * @param {Object} config - Configuration object to validate
     * @returns {boolean} True if configuration is valid
     */
    validateConfig: function(config) {
        // Add validation logic as needed
        return true;
    }
};

// Export configuration objects for use in other modules
// (In browser environment, these will be global variables) 