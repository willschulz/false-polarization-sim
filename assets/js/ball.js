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
        this.size = 8;
        
        // Data properties
        this.value = value;
        this.histTarget = histTarget;
        this.landed = false;
        
        // User-specific properties (for squares that spawn issue circles)
        this.pendingIssues = null; // array of {val, isPosted}
        this.pendingBinIdx = null;
        this.trueMean = null;
        this.issuesProcessed = false;
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
                
                // Update histogram
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
            const startY = HISTOGRAM_CONFIG.panels[1].baseY;
            const targetX = mapValueToX(issue.val);
            const targetY = issue.isPosted 
                ? HISTOGRAM_CONFIG.panels[2].baseY 
                : HISTOGRAM_CONFIG.panels[3].baseY;
            const col = issue.isPosted 
                ? color(220, 0, 0) 
                : color(128, 128, 128);
            const histKey = issue.isPosted ? 'postedAttitudes' : 'shadowAttitudes';
            
            balls.push(new Ball(startX, startY, targetX, targetY, 'circle', col, issue.val, histKey));
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
            rect(this.x, this.y, this.size, this.size);
        } else {
            circle(this.x, this.y, this.size);
        }
    }
}
