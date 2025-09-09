/**
 * Main visualization drawing and utility functions
 */

// Global variables for animation
let balls = [];

/**
 * Compute a dynamic height for selection bands that scales with available space
 * but never below the text height plus minimum padding.
 */
function _computeSelectionBandHeight(panelAbove, panelBelow) {
    const ideal = (HISTOGRAM_CONFIG && HISTOGRAM_CONFIG.visual && HISTOGRAM_CONFIG.visual.selectionFilterHeight) || 60;
    const maxBar = HISTOGRAM_CONFIG.visual.maxBarHeight;
    const gap = (panelBelow.baseY - maxBar) - panelAbove.baseY;
    const maxAllowed = Math.max(0, gap - 4);
    const minPad = 6; // px of vertical padding above/below text
    let textH = 0;
    push();
    textStyle(BOLD);
    // Use current textSize; main sets 12px consistently
    textH = (typeof textAscent === 'function' && typeof textDescent === 'function')
        ? (textAscent() + textDescent())
        : 12; // fallback
    pop();
    const minAllowed = Math.ceil(textH + 2 * minPad);
    // Prefer ideal, cap to available; ensure not below minimum padding where possible
    return Math.max(0, Math.min(Math.max(minAllowed, 0), Math.min(ideal, maxAllowed)));
}

/**
 * Map a value to x-coordinate on canvas
 */
function mapValueToX(val) {
    const [min, max] = HISTOGRAM_CONFIG.range;
    const clamped = (typeof MATH_UTILS !== 'undefined') ? MATH_UTILS.clamp(val, min, max) : Math.min(Math.max(val, min), max);
    const frac = (clamped - min) / (max - min);
    return frac * width;
}

/**
 * Draw the attitude selection filter band between panels 2 and 3
 */
function drawAttitudeSelectionFilter() {
    const panelAbove = HISTOGRAM_CONFIG.panels[1];
    const panelBelow = HISTOGRAM_CONFIG.panels[2];
    const filterHeight = _computeSelectionBandHeight(panelAbove, panelBelow); // px
    // Center between bottom of preceding x-axis and top of SD markers of following panel
    const maxBar = HISTOGRAM_CONFIG.visual.maxBarHeight;
    const yCenter = (panelAbove.baseY + (panelBelow.baseY - maxBar)) / 2;
    const yTop = yCenter - filterHeight / 2;

    noStroke();
    fill(180, 180, 180, 150); // semi-transparent gray band
    rect(0, yTop, width, filterHeight);

    // Label: white, bold, right-aligned inside the band
    fill(255);
    textAlign(RIGHT, CENTER);
    push();
    textStyle(BOLD);
    text('ATTITUDE SELECTION', width - 8, yTop + filterHeight / 2);
    pop();
    textAlign(CENTER, CENTER);
}

/**
 * Draw the user selection filter band between panels 1 and 2
 */
function drawUserSelectionFilter() {
    const panelAbove = HISTOGRAM_CONFIG.panels[0];
    const panelBelow = HISTOGRAM_CONFIG.panels[1];
    const filterHeight = _computeSelectionBandHeight(panelAbove, panelBelow); // px
    // Center between bottom of preceding x-axis and top of SD markers of following panel
    const maxBar = HISTOGRAM_CONFIG.visual.maxBarHeight;
    const yCenter = (panelAbove.baseY + (panelBelow.baseY - maxBar)) / 2;
    const yTop = yCenter - filterHeight / 2;

    noStroke();
    fill(180, 180, 180, 150); // semi-transparent gray band
    rect(0, yTop, width, filterHeight);

    // Label: white, bold, right-aligned
    fill(255);
    textAlign(RIGHT, CENTER);
    push();
    textStyle(BOLD);
    text('USER SELECTION', width - 8, yTop + filterHeight / 2);
    pop();
    textAlign(CENTER, CENTER);
}

/**
 * Main drawing function called every frame by p5.js
 */
function draw() {
    // Transparent background; draw against container behind the canvas
    clear();
    // Ensure panels are initialized even if setup hasn't run yet for some reason
    if (!HISTOGRAM_CONFIG.panels || HISTOGRAM_CONFIG.panels.length < 3) {
        const maxBar = HISTOGRAM_CONFIG.visual.maxBarHeight;
        const defaultHeadroom = HISTOGRAM_CONFIG.visual.panelTopPadding || 0;
        const topHeadroom = HISTOGRAM_CONFIG.visual.topPanelTopPadding ?? defaultHeadroom;
        const bottomPadding = HISTOGRAM_CONFIG.visual.bottomPanelBottomPadding || 0;
        const bottomLabelPad = HISTOGRAM_CONFIG.visual.bottomPanelLabelPadding || 0;
        const baseY1 = topHeadroom + maxBar;
        const baseY3 = height - (bottomPadding + bottomLabelPad);
        const gap = (baseY3 - baseY1) / 2;
        const baseY2 = baseY1 + gap;
        HISTOGRAM_CONFIG.panels = [
            { baseY: baseY1 },
            { baseY: baseY2 },
            { baseY: baseY3 }
        ];
    }
    
    // Optional panel divider lines
    if (HISTOGRAM_CONFIG.visual.showPanelDividers) {
        const ph = height / 3;
        stroke(230);
        line(0, ph, width, ph);
        line(0, 2 * ph, width, 2 * ph);
    }
    
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
    try {
        drawNormalDensity(0);                              // Panel 1: static normal curve
        drawAuthorsOverlay(1);                             // Panel 2: authors overlay
        drawAttitudesOverlay(2);                           // Panel 3: attitudes overlay
    } catch (err) {
        // Avoid breaking the draw loop; log for debugging
        if (console && console.error) console.error('Draw error:', err);
    }

    // Draw selection filters between panels
    drawUserSelectionFilter();
    drawAttitudeSelectionFilter();
    
    // Draw standard deviation markers on all panels
    for (let i = 0; i < HISTOGRAM_CONFIG.panels.length; i++) {
        drawStdMarkers(i);
    }
}

/**
 * Sample a new user and create visualization elements
 */
function sampleUser() {
    // 1) Sample a user from the population (unbiased)
    const mu = randomGaussian(0, MODEL_CONFIG.randomEffects.sdUserMu);
    const issues = [];
    for (let i = 0; i < MODEL_CONFIG.nIssues; i++) {
        issues.push(randomGaussian(mu, MODEL_CONFIG.randomEffects.sdIssue));
    }
    const trueMean = issues.reduce((a, b) => a + b, 0) / MODEL_CONFIG.nIssues;

    // 2) Decide if this tweet is political based on user ideology
    const pPolitical = political_tweeting_probability_function(trueMean);
    const isPolitical = Math.random() < pPolitical;

    // 3) Create falling user square to the corresponding author panel
    const [min, max] = HISTOGRAM_CONFIG.range;
    const binWidthVal = (max - min) / HISTOGRAM_CONFIG.nBins;
    let binIdx = Math.floor((trueMean - min) / binWidthVal);
    if (binIdx < 0) binIdx = 0;
    if (binIdx >= HISTOGRAM_CONFIG.nBins) binIdx = HISTOGRAM_CONFIG.nBins - 1;
    const binPixelW = width / HISTOGRAM_CONFIG.nBins;
    const barStartX = binIdx * binPixelW;
    const startX = barStartX + Math.random() * binPixelW;
    const targetX = startX;
    // Both author types go to the same overlay panel (panel 2)
    const targetPanelIdx = 1;
    const userBall = new Ball(
        startX,
        HISTOGRAM_CONFIG.panels[0].baseY,
        targetX,
        HISTOGRAM_CONFIG.panels[targetPanelIdx].baseY,
        'square',
        // Start black; will stay black if passes filter, or turn gray if not
        color(0, 0, 0),
        trueMean,
        isPolitical ? 'tweetAuthorsPolitical' : 'tweetAuthorsNonPolitical'
    );

    // For political tweets, prepare attitudes and choose tweet topic
    if (isPolitical) {
        const selectedIdx = pick_tweet_topic(issues);
        const pendingIssues = issues.map((val, idx) => ({ val, isTweetTopic: idx === selectedIdx }));
        userBall.pendingIssues = pendingIssues;
        userBall.pendingBinIdx = binIdx;
        userBall.trueMean = trueMean;
    }

    // Mark the author type for color-switch after the USER SELECTION band
    userBall.isPolitical = isPolitical;

    balls.push(userBall);
}

/**
 * Reset all histograms and animations
 */
function resetVisualization() {
    initHistogram(histograms.trueAll);
    initHistogram(histograms.tweetAuthorsPolitical);
    initHistogram(histograms.tweetAuthorsNonPolitical);
    initHistogram(histograms.postedAttitudes);
    initHistogram(histograms.shadowAttitudes);
    balls = [];
    populateStaticDistribution(UI_CONFIG.staticSample.nUsers);
}
