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
    background(255, 255, 255);
    
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
    drawNormalDensity(0);                              // Panel 1: static normal curve
    drawHistogram('tweetAuthorsPolitical', 1);         // Panel 2: political tweet authors
    drawHistogram('tweetAuthorsNonPolitical', 2);      // Panel 3: non-political tweet authors
    drawAttitudesOverlay(3);                           // Panel 4: attitudes overlay
    
    // Draw standard deviation markers on all panels
    for (let i = 0; i < 4; i++) {
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
    const targetPanelIdx = isPolitical ? 1 : 2;
    const userBall = new Ball(
        startX,
        HISTOGRAM_CONFIG.panels[0].baseY,
        targetX,
        HISTOGRAM_CONFIG.panels[targetPanelIdx].baseY,
        'square',
        color(0, 102, 204),
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
