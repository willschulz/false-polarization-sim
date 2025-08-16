/**
 * Selection math for user- and attitude-level processes
 * - political_tweeting_probability_function(userIdeology)
 * - pick_tweet_topic(topicIdeologies)
 *
 * Depends on global MODEL_CONFIG and MATH_UTILS defined in config.js
 */

/**
 * Probability a tweet from a user with ideology x is political.
 * Tunable via MODEL_CONFIG.politicalTweeting.
 * @param {number} x
 * @returns {number} probability in [0,1]
 */
function political_tweeting_probability_function(x) {
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
    const weights = topicIdeologies.map(v => Math.abs(v));
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum <= 0) return Math.floor(Math.random() * topicIdeologies.length);
    let r = Math.random() * sum;
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return weights.length - 1;
}


