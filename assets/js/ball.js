/**
 * Ball class for animated visualization elements
 * Represents both users (squares) and attitudes (circles) falling through panels
 */
class Ball {
    constructor(x, y, targetX, targetY, shape, color, value, histTarget) {
        // Position and movement
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        
        // Visual properties
        this.shape = shape; // 'square' or 'circle'
        this.color = color;
        this.size = VISUAL_CONFIG.shapes.size;
        
        // Data properties
        this.value = value;
        this.histTarget = histTarget;
        this.landed = false;
        
        // User-specific properties (for squares that spawn issue circles)
        this.pendingIssues = null; // array of {val, isTweetTopic}
        this.pendingBinIdx = null;
        this.trueMean = null;
        this.issuesProcessed = false;
        this.isTweetTopic = false;
        this.isPolitical = undefined; // for user squares
    }
    
    /**
     * Update ball position and handle landing logic
     */
    update() {
        const speed = 4;
        if (!this.landed) {
            this.y += speed;
            // Ease x toward target for natural arc
            this.x += (this.targetX - this.x) * 0.05;
            
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.landed = true;
                
                // Update histogram for this object when it lands
                if (this.histTarget) {
                    addValueToHistogram(this.histTarget, this.value);
                }
                
                // Spawn issue circles if this is a user ball with pending issues
                if (this.pendingIssues && !this.issuesProcessed) {
                    this.issuesProcessed = true;
                    this._spawnIssueCircles();
                }
            }
        }
    }
    
    /**
     * Spawn circle elements for user's issues
     * @private
     */
    _spawnIssueCircles() {
        const binPixelW = width / HISTOGRAM_CONFIG.nBins;
        const barStartX = this.pendingBinIdx * binPixelW;
        
        for (const issue of this.pendingIssues) {
            const startX = barStartX + Math.random() * binPixelW;
            // Circles originate from the political authors panel (panel 2)
            const startY = HISTOGRAM_CONFIG.panels[1].baseY;
            const targetX = mapValueToX(issue.val);
            // Send both posted and shadow attitudes to the attitudes overlay panel (panel 3 in 3-panel layout)
            const targetY = HISTOGRAM_CONFIG.panels[2].baseY;
            // Start all circles as political color (orange) before the selection filter
            const col = color(245, 158, 11);
            const histKey = issue.isTweetTopic ? 'postedAttitudes' : 'shadowAttitudes';
            
            const circle = new Ball(startX, startY, targetX, targetY, 'circle', col, issue.val, histKey);
            circle.isTweetTopic = issue.isTweetTopic;
            balls.push(circle);
        }
    }
    
    /**
     * Render the ball
     */
    draw() {
        noStroke();
        fill(this.color);
        if (this.shape === 'square') {
            rectMode(CENTER);
            // For user squares: after the USER SELECTION band, set color by post type
            if (this.isPolitical !== undefined) {
                const panelAbove = HISTOGRAM_CONFIG.panels[0];
                const panelBelow = HISTOGRAM_CONFIG.panels[1];
                const filterHeight = HISTOGRAM_CONFIG.visual.selectionFilterHeight;
                const yCenter = (panelAbove.baseY + (panelBelow.baseY - HISTOGRAM_CONFIG.visual.maxBarHeight)) / 2;
                const yTop = yCenter - filterHeight / 2;
                const __dynFilterH = (typeof _computeSelectionBandHeight === 'function') ? _computeSelectionBandHeight(panelAbove, panelBelow) : ((HISTOGRAM_CONFIG && HISTOGRAM_CONFIG.visual && HISTOGRAM_CONFIG.visual.selectionFilterHeight) || 60);
                const __yBottom = (yCenter - __dynFilterH / 2) + __dynFilterH;
                if (this.y >= __yBottom) {
                    if (!this.isPolitical) {
                        // Non-political posts: #1f3a8a
                        fill(color(31, 58, 138));
                    } else {
                        // Political posts: #f59e0b
                        fill(color(245, 158, 11));
                    }
                }
            }
            rect(this.x, this.y, this.size, this.size);
        } else {
            // Attitude circle: start as political color (orange) and switch after crossing selection band
            const panelAbove = HISTOGRAM_CONFIG.panels[1];
            const panelBelow = HISTOGRAM_CONFIG.panels[2];
            const filterHeight = HISTOGRAM_CONFIG.visual.selectionFilterHeight;
            const yCenter = (panelAbove.baseY + (panelBelow.baseY - HISTOGRAM_CONFIG.visual.maxBarHeight)) / 2;
            const yTop = yCenter - filterHeight / 2;
            const __dynFilterH = (typeof _computeSelectionBandHeight === 'function') ? _computeSelectionBandHeight(panelAbove, panelBelow) : ((HISTOGRAM_CONFIG && HISTOGRAM_CONFIG.visual && HISTOGRAM_CONFIG.visual.selectionFilterHeight) || 60);
            const __yBottom = (yCenter - __dynFilterH / 2) + __dynFilterH;
            if (this.y >= __yBottom) {
                if (this.isTweetTopic) {
                    // Visible attitudes (D): #ef6351
                    fill(color(239, 99, 81));
                } else {
                    // Invisible attitudes (C): #007f5f
                    fill(color(0, 127, 95));
                }
            } else {
                // Before crossing selection band: political color
                fill(color(245, 158, 11));
            }
            circle(this.x, this.y, this.size);
        }
    }
}
