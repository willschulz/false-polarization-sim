/**
 * Histogram management and rendering functions
 */

// Global histogram containers
const histograms = {
    trueAll: { counts: [] },
    truePosting: { counts: [] },
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
        else if (histName === 'truePosting') col = color(0, 102, 204, 180);
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
    else if (histName === 'truePosting') label = 'Posting users: true means';
    else if (histName === 'postedAttitudes') label = 'Visible attitudes (posted)';
    else label = 'Shadow attitudes (unposted)';
    
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
