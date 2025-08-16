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
        if (histName === 'trueAll') {
            col = color(0, 128, 0, 180);
        } else if (histName === 'tweetAuthorsPolitical') {
            // Political posts: #f59e0b, alpha 0.7 (~178)
            col = color(245, 158, 11, 178);
        } else if (histName === 'tweetAuthorsNonPolitical') {
            // Non-political posts: #1f3a8a, alpha 0.7 (~178)
            col = color(31, 58, 138, 178);
        } else if (histName === 'postedAttitudes') {
            // Visible attitudes (D): #ef6351, alpha 0.7 (~178)
            col = color(239, 99, 81, 178);
        } else if (histName === 'shadowAttitudes') {
            // Invisible attitudes (C): #007f5f, alpha 0.7 (~178)
            col = color(0, 127, 95, 178);
        } else {
            col = color(128, 128, 128, 180);
        }
        
        noStroke();
        fill(col);
        rect(x, baseY, binPixelW - 1, -barH);
    }
    
    // Draw baseline slightly below bars to avoid covering their bottoms
    stroke(0);
    line(0, baseY + 1, width, baseY + 1);
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
 * Draw overlay of political vs non-political tweet authors in the same panel
 */
function drawAuthorsOverlay(panelIdx) {
    const panel = HISTOGRAM_CONFIG.panels[panelIdx];
    const baseY = panel.baseY;
    const barMaxHeight = HISTOGRAM_CONFIG.visual.maxBarHeight;
    const political = histograms.tweetAuthorsPolitical;
    const nonPolitical = histograms.tweetAuthorsNonPolitical;
    const independent = true; // hard-coded independent scaling for testing
    const maxCount = independent
        ? Math.max(Math.max(...political.counts, 1), Math.max(...nonPolitical.counts, 1))
        : Math.max(...political.counts, ...nonPolitical.counts, 1);
    const binPixelW = width / HISTOGRAM_CONFIG.nBins;

    rectMode(CORNER);
    // Draw non-political first (blue #1f3a8a)
    noStroke();
    fill(color(31, 58, 138, 178));
    for (let i = 0; i < nonPolitical.counts.length; i++) {
        const countMax = independent ? Math.max(...nonPolitical.counts, 1) : maxCount;
        const barH = (nonPolitical.counts[i] / countMax) * barMaxHeight;
        const x = i * binPixelW;
        rect(x, baseY, binPixelW - 1, -barH);
    }

    // Draw political on top (orange #f59e0b)
    fill(color(245, 158, 11, 178));
    for (let i = 0; i < political.counts.length; i++) {
        const countMax = independent ? Math.max(...political.counts, 1) : maxCount;
        const barH = (political.counts[i] / countMax) * barMaxHeight;
        const x = i * binPixelW;
        // Overlap handling: lighten black where it overlaps gray using simple alpha blending
        // Draw gray again clipped would be heavy; instead, draw black with lower alpha to reveal gray beneath
        rect(x, baseY, binPixelW - 1, -barH);
    }

    // Baseline and unified label
    stroke(0);
    line(0, baseY + 1, width, baseY + 1);
    noStroke();
    fill(0);
    text('Ideological Positions of Tweet Authors (Political and Non-Political)', width / 2, baseY + 20);

    // Legend on left (squares)
    push();
    const legendX = 10;
    const legendYTop = baseY - barMaxHeight + 16;
    rectMode(CORNER);
    noStroke();
    // Political (orange #f59e0b)
    fill(color(245, 158, 11, 178));
    rect(legendX, legendYTop - 6, 12, 12);
    // Non-political (blue #1f3a8a) with extra vertical spacing
    fill(color(31, 58, 138, 178));
    rect(legendX, legendYTop + 8, 12, 12);
    // Labels
    fill(0);
    textAlign(LEFT, CENTER);
    text('Political', legendX + 18, legendYTop);
    text('Non-political', legendX + 18, legendYTop + 14);
    pop();
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
    fill(160, 160, 160, 180); // gray fill for true-means distribution
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
    
    // Draw black outline along the curve
    noFill();
    stroke(0);
    beginShape();
    for (let i = 0; i < nPoints; i++) {
        const cx = mapValueToX(xs[i]);
        const cy = baseY - (pdfVals[i] / maxPdf) * barMaxHeight;
        vertex(cx, cy);
    }
    endShape();
    
    // Draw baseline slightly below area fill to avoid covering its bottom edge
    stroke(0);
    line(0, baseY + 1, width, baseY + 1);
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
    const independent = true; // hard-coded independent scaling for testing
    const maxCount = independent
        ? Math.max(Math.max(...posted.counts, 1), Math.max(...shadow.counts, 1))
        : Math.max(...posted.counts, ...shadow.counts, 1);
    const binPixelW = width / HISTOGRAM_CONFIG.nBins;
    
    rectMode(CORNER);
    // Draw shadow first (invisible attitudes C: #007f5f)
    noStroke();
    fill(color(0, 127, 95, 178));
    for (let i = 0; i < shadow.counts.length; i++) {
        const countMax = independent ? Math.max(...shadow.counts, 1) : maxCount;
        const barH = (shadow.counts[i] / countMax) * barMaxHeight;
        const x = i * binPixelW;
        const yTop = baseY - barH;
        const r = Math.min(6, barH); // rounded top corners only
        rect(x, yTop, binPixelW - 1, barH, r, r, 0, 0);
    }
    // Draw posted on top (visible attitudes D: #ef6351)
    fill(color(239, 99, 81, 178));
    for (let i = 0; i < posted.counts.length; i++) {
        const countMax = independent ? Math.max(...posted.counts, 1) : maxCount;
        const barH = (posted.counts[i] / countMax) * barMaxHeight;
        const x = i * binPixelW;
        const yTop = baseY - barH;
        const r = Math.min(6, barH);
        // Overlap handling: draw black with lower alpha so gray remains visible under overlaps
        rect(x, yTop, binPixelW - 1, barH, r, r, 0, 0);
    }
    
    // Baseline and unified label (1px below bars)
    stroke(0);
    line(0, baseY + 1, width, baseY + 1);
    noStroke();
    fill(0);
    text('Ideological Positions of Attitudes (Posted and Unposted)', width / 2, baseY + 20);

    // Legend on left (circles)
    push();
    const legendX = 10;
    const legendYTop = baseY - barMaxHeight + 16;
    noStroke();
    // Visible (topic) D: #ef6351
    fill(color(239, 99, 81, 178));
    circle(legendX + 6, legendYTop, 12);
    // Invisible (shadow) C: #007f5f with extra vertical spacing
    fill(color(0, 127, 95, 178));
    circle(legendX + 6, legendYTop + 14, 12);
    // Labels
    fill(0);
    textAlign(LEFT, CENTER);
    text('Posted', legendX + 18, legendYTop);
    text('Unposted', legendX + 18, legendYTop + 14);
    pop();
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
