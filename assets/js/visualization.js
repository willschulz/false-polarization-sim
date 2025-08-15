/**
 * Main visualization drawing and utility functions
 */

// Global variables for animation
let balls = [];

/**
 * Map a value to x-coordinate on canvas
 */
function mapValueToX(val) {
    const [min, max] = HISTOGRAM_CONFIG.range;
    const clamped = constrain(val, min, max);
    const frac = (clamped - min) / (max - min);
    return frac * width;
}

/**
 * Main drawing function called every frame by p5.js
 */
function draw() {
    background(250);
    
    // Draw panel dividers
    const ph = height / 4;
    stroke(230);
    line(0, ph, width, ph);
    line(0, 2 * ph, width, 2 * ph);
    line(0, 3 * ph, width, 3 * ph);
    
    // Update and draw balls
    for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        b.update();
        b.draw();
        if (b.landed) {
            balls.splice(i, 1);
        }
    }
    
    // Draw visualizations
    drawNormalDensity(0);           // Top panel: static normal curve
    drawHistogram('truePosting', 1);         // Panel 2: posting users histogram
    drawHistogram('postedAttitudes', 2);     // Panel 3: posted attitudes histogram
    drawHistogram('shadowAttitudes', 3);     // Panel 4: shadow attitudes histogram
    
    // Draw standard deviation markers on all panels
    for (let i = 0; i < 4; i++) {
        drawStdMarkers(i);
    }
}

/**
 * Sample a new user and create visualization elements
 */
function sampleUser() {
    // Sample user's latent ideological center
    const mu = randomGaussian(0, MODEL_CONFIG.randomEffects.sdUserMu);
    
    // Sample issue-level attitudes around user center
    const issues = [];
    const absIssues = [];
    let sumAbs = 0;
    
    for (let i = 0; i < MODEL_CONFIG.nIssues; i++) {
        const iv = randomGaussian(mu, MODEL_CONFIG.randomEffects.sdIssue);
        issues.push(iv);
        const a = Math.abs(iv);
        absIssues.push(a);
        sumAbs += a;
    }
    
    // Compute user's true mean across issues
    const trueMean = issues.reduce((a, b) => a + b, 0) / MODEL_CONFIG.nIssues;
    
    // Sample user-level random intercept
    const u_user = randomGaussian(0, MODEL_CONFIG.randomEffects.sdUser);
    
    // Compute posting probabilities for each issue
    const pIssues = [];
    for (let i = 0; i < MODEL_CONFIG.nIssues; i++) {
        const abs_i = absIssues[i];
        const otherExt = (MODEL_CONFIG.nIssues > 1) ? (sumAbs - abs_i) / (MODEL_CONFIG.nIssues - 1) : 0;
        const v_topic = randomGaussian(0, MODEL_CONFIG.randomEffects.sdTopic);
        
        let eta = MODEL_CONFIG.coefficients.beta0 + 
                 MODEL_CONFIG.coefficients.beta1 * otherExt + 
                 MODEL_CONFIG.coefficients.beta2 * abs_i + 
                 u_user + v_topic;
        
        const p_i = constrain(eta, 0, 1);
        pIssues.push(p_i);
    }
    
    // Determine if user posts at least one issue
    let prodNot = 1;
    for (let i = 0; i < pIssues.length; i++) {
        prodNot *= (1 - pIssues[i]);
    }
    const pUserPost = 1 - prodNot;
    const posts = Math.random() < pUserPost;
    
    if (!posts) {
        return; // User doesn't post anything
    }
    
    // Prepare pending issues with posting decisions
    const pendingIssues = [];
    for (let i = 0; i < MODEL_CONFIG.nIssues; i++) {
        const isPosted = Math.random() < pIssues[i];
        pendingIssues.push({ val: issues[i], isPosted: isPosted });
    }
    
    // Create user square that falls to posting users panel
    const [min, max] = HISTOGRAM_CONFIG.range;
    const binWidthVal = (max - min) / HISTOGRAM_CONFIG.nBins;
    let binIdx = Math.floor((trueMean - min) / binWidthVal);
    if (binIdx < 0) binIdx = 0;
    if (binIdx >= HISTOGRAM_CONFIG.nBins) binIdx = HISTOGRAM_CONFIG.nBins - 1;
    
    const binPixelW = width / HISTOGRAM_CONFIG.nBins;
    const barStartX = binIdx * binPixelW;
    const startX = barStartX + Math.random() * binPixelW;
    const targetX = startX;
    
    const userBall = new Ball(
        startX,
        HISTOGRAM_CONFIG.panels[0].baseY,
        targetX,
        HISTOGRAM_CONFIG.panels[1].baseY,
        'square',
        color(0, 102, 204),
        trueMean,
        'truePosting'
    );
    
    userBall.pendingIssues = pendingIssues;
    userBall.pendingBinIdx = binIdx;
    userBall.trueMean = trueMean;
    
    balls.push(userBall);
}

/**
 * Reset all histograms and animations
 */
function resetVisualization() {
    initHistogram(histograms.trueAll);
    initHistogram(histograms.truePosting);
    initHistogram(histograms.postedAttitudes);
    initHistogram(histograms.shadowAttitudes);
    balls = [];
    populateStaticDistribution(UI_CONFIG.staticSample.nUsers);
}
