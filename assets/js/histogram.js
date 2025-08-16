/**
 * Histogram management and rendering functions
 */

// Global histogram containers
const histograms = {
    trueAll: { counts: [] },
    // Replaces previous 'truePosting' with separate author histograms
    tweetAuthorsPolitical: { counts: [] },
    tweetAuthorsNonPolitical: { counts: [] },
    postedAttitudes: { counts: [] },
    shadowAttitudes: { counts: [] }
};

/**
 * Initialize a histogram with empty bins
 */
function initHistogram(histObj) {
    histObj.counts = new Array(HISTOGRAM_CONFIG.nBins).fill(0);
}

/**
 * Add a value to the specified histogram
 */
function addValueToHistogram(histName, value) {
    const hist = histograms[histName];
    if (!hist) return;
    
    const [min, max] = HISTOGRAM_CONFIG.range;
    if (value < min || value >= max) return;
    
    const binWidth = (max - min) / HISTOGRAM_CONFIG.nBins;
    const idx = Math.floor((value - min) / binWidth);
    
    if (idx >= 0 && idx < hist.counts.length) {
        hist.counts[idx]++;
    }
}

/**
 * Draw a histogram for the specified panel
 */
function drawHistogram(histName, panelIdx) {
    const hist = histograms[histName];
    const panel = HISTOGRAM_CONFIG.panels[panelIdx];
    const baseY = panel.baseY;
    const barMaxHeight = HISTOGRAM_CONFIG.visual.maxBarHeight;
    const maxCount = Math.max(...hist.counts, 1);
    const binPixelW = width / HISTOGRAM_CONFIG.nBins;
    
    rectMode(CORNER);
    for (let i = 0; i < hist.counts.length; i++) {
        const barH = (hist.counts[i] / maxCount) * barMaxHeight;
        const x = i * binPixelW;
        
        let col;
        if (histName === 'trueAll') col = color(0, 128, 0, 180);
        else if (histName === 'tweetAuthorsPolitical') col = color(0, 102, 204, 180);
        else if (histName === 'tweetAuthorsNonPolitical') col = color(150, 150, 255, 180);
        else if (histName === 'postedAttitudes') col = color(220, 0, 0, 180);
        else col = color(128, 128, 128, 180);
        
        noStroke();
        fill(col);
        rect(x, baseY, binPixelW - 1, -barH);
    }
    
    // Draw baseline and label
    stroke(0);
    line(0, baseY, width, baseY);
    noStroke();
    fill(0);
    
    let label;
    if (histName === 'trueAll') label = 'All users: true means';
    else if (histName === 'tweetAuthorsPolitical') label = 'Tweet authors: political tweets';
    else if (histName === 'tweetAuthorsNonPolitical') label = 'Tweet authors: non-political tweets';
    else if (histName === 'postedAttitudes') label = 'Attitudes: posted (red) vs shadow (gray)';
    else label = 'Attitudes: posted (red) vs shadow (gray)';
    
    text(label, width / 2, baseY + 20);
}

/**
 * Populate the top histogram with static normal distribution
 */
function populateStaticDistribution(nSamples) {
    histograms.trueAll.counts = new Array(HISTOGRAM_CONFIG.nBins).fill(0);
    const [min, max] = HISTOGRAM_CONFIG.range;
    const binWidth = (max - min) / HISTOGRAM_CONFIG.nBins;
    
    for (let i = 0; i < nSamples; i++) {
        const mu = randomGaussian(0, MODEL_CONFIG.randomEffects.sdUserMu);
        let sum = 0;
        for (let j = 0; j < MODEL_CONFIG.nIssues; j++) {
            const iv = randomGaussian(mu, MODEL_CONFIG.randomEffects.sdIssue);
            sum += iv;
        }
        const trueMean = sum / MODEL_CONFIG.nIssues;
        
        if (trueMean < min || trueMean >= max) continue;
        const idx = Math.floor((trueMean - min) / binWidth);
        if (idx >= 0 && idx < histograms.trueAll.counts.length) {
            histograms.trueAll.counts[idx]++;
        }
    }
}

/**
 * Draw standard normal density curve for top panel
 */
function drawNormalDensity(panelIdx) {
    const panel = HISTOGRAM_CONFIG.panels[panelIdx];
    const baseY = panel.baseY;
    const barMaxHeight = HISTOGRAM_CONFIG.visual.maxBarHeight;
    const [min, max] = HISTOGRAM_CONFIG.range;
    
    const nPoints = 200;
    let maxPdf = 0;
    const xs = new Array(nPoints);
    const pdfVals = new Array(nPoints);
    
    for (let i = 0; i < nPoints; i++) {
        const x = min + (max - min) * (i / (nPoints - 1));
        const pdf = MATH_UTILS.standardNormalPdf(x);
        xs[i] = x;
        pdfVals[i] = pdf;
        if (pdf > maxPdf) maxPdf = pdf;
    }
    
    noStroke();
    fill(0, 128, 0, 180);
    beginShape();
    for (let i = 0; i < nPoints; i++) {
        const cx = mapValueToX(xs[i]);
        const cy = baseY - (pdfVals[i] / maxPdf) * barMaxHeight;
        vertex(cx, cy);
    }
    for (let i = nPoints - 1; i >= 0; i--) {
        const cx = mapValueToX(xs[i]);
        vertex(cx, baseY);
    }
    endShape(CLOSE);
    
    // Draw baseline and label
    stroke(0);
    line(0, baseY, width, baseY);
    noStroke();
    fill(0);
    text('All users: true means', width / 2, baseY + 20);
}

/**
 * Draw overlay of posted and shadow attitudes in the same panel
 */
function drawAttitudesOverlay(panelIdx) {
    const panel = HISTOGRAM_CONFIG.panels[panelIdx];
    const baseY = panel.baseY;
    const barMaxHeight = HISTOGRAM_CONFIG.visual.maxBarHeight;
    const [posted, shadow] = [histograms.postedAttitudes, histograms.shadowAttitudes];
    const maxCount = Math.max(...posted.counts, ...shadow.counts, 1);
    const binPixelW = width / HISTOGRAM_CONFIG.nBins;
    
    rectMode(CORNER);
    // Draw shadow first (gray)
    noStroke();
    fill(color(128, 128, 128, 140));
    for (let i = 0; i < shadow.counts.length; i++) {
        const barH = (shadow.counts[i] / maxCount) * barMaxHeight;
        const x = i * binPixelW;
        rect(x, baseY, binPixelW - 1, -barH);
    }
    // Draw posted on top (red)
    fill(color(220, 0, 0, 160));
    for (let i = 0; i < posted.counts.length; i++) {
        const barH = (posted.counts[i] / maxCount) * barMaxHeight;
        const x = i * binPixelW;
        rect(x, baseY, binPixelW - 1, -barH);
    }
    
    // Baseline and unified label
    stroke(0);
    line(0, baseY, width, baseY);
    noStroke();
    fill(0);
    text('Attitudes: posted (red) vs shadow (gray)', width / 2, baseY + 20);
}

/**
 * Draw standard deviation markers on all panels
 */
function drawStdMarkers(panelIdx) {
    const panel = HISTOGRAM_CONFIG.panels[panelIdx];
    const baseY = panel.baseY;
    const barMaxHeight = HISTOGRAM_CONFIG.visual.maxBarHeight;
    const markers = [0, -1, 1, -2, 2];
    
    stroke(0);
    strokeWeight(1);
    for (const m of markers) {
        if (m >= HISTOGRAM_CONFIG.range[0] && m <= HISTOGRAM_CONFIG.range[1]) {
            const x = mapValueToX(m);
            line(x, baseY, x, baseY - barMaxHeight);
        }
    }
    strokeWeight(1);
}
