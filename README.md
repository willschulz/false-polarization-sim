# Self-Censorship Multi-Stage Visualization Dashboard

A interactive web-based visualization demonstrating how user-level self-selection and attitude-level self-censorship combine to create false polarization in online discourse.

## Overview

This dashboard visualizes a four-stage filtering process that shows how the attitudes we see online become systematically different from the true distribution of public opinion. The visualization is based on statistical models of posting behavior from empirical research on social media self-censorship.

## The Four Stages

1. **All Users' True Means** (Green): The actual distribution of ideological positions in the population
2. **Posting Users** (Blue): Users who choose to post at least one issue (self-selection effect)
3. **Visible Attitudes** (Red): Individual attitudes that get posted and become visible
4. **Shadow Attitudes** (Gray): Individual attitudes that remain unposted and hidden

## Key Concepts

### Self-Selection
Some users are more likely to post than others. Users with more extreme views across multiple issues tend to be more active posters, leading to over-representation of extreme positions in the visible discourse.

### Self-Censorship  
Even among active users, some attitudes get posted while others don't. More extreme attitudes on individual issues are more likely to be posted, further amplifying the apparent polarization.

### False Polarization
The combination of these two filtering mechanisms makes the visible discourse appear more polarized than the underlying population actually is.

## Technical Details

### Statistical Model

The posting probability for each attitude follows a mixed linear probability model:

```
P(post) = β₀ + β₁ × (average extremity of other issues) + β₂ × (extremity of current issue) + random effects
```

Where:
- **β₀** = -0.004686 (baseline posting probability)
- **β₁** = 0.01455 (user-level filtering effect)  
- **β₂** = 0.004542 (issue-level filtering effect)

### Parameters You Can Control

- **Number of issues per user**: How many political topics each simulated user has opinions about (3-50)
- **User-level filtering effect (β₁)**: How much having extreme views on other topics increases posting probability (0-0.05)
- **Issue-level filtering effect (β₂)**: How much extremity on the current issue increases posting probability (0-0.02)

## Project Structure

```
online_filtering_viz/
├── index.html              # Main HTML structure
├── README.md               # This documentation
├── server.py              # Simple Python server for local hosting
├── assets/
│   ├── css/
│   │   └── styles.css     # All styling and responsive design
│   └── js/
│       ├── config.js      # Configuration and constants
│       ├── ball.js        # Animated element class
│       ├── histogram.js   # Histogram utilities
│       ├── visualization.js # Main visualization logic
│       ├── controls.js    # UI controls and event handlers
│       └── main.js        # Application initialization
└── docs/
    └── (future documentation)
```

## Running the Dashboard

### Option 1: Simple Python Server (Recommended)
```bash
python3 server.py
```
Then open http://localhost:8080 in your browser.

### Option 2: Any Web Server
Since this is a static web application, you can serve it with any web server:
```bash
# Python 3
python3 -m http.server 8080

# Node.js (if you have http-server installed)
npx http-server

# PHP
php -S localhost:8080
```

### Option 3: Direct File Access
You can also open `index.html` directly in your browser, though some browsers may have CORS restrictions for local files.

## How to Use

1. **Sample User**: Click to generate one new user and watch their filtering process
2. **Start Auto Sample**: Continuously generate new users to see patterns emerge
3. **Reset**: Clear all data and start fresh
4. **Adjust Parameters**: Use the sliders to see how different filtering strengths affect the results

### Keyboard Shortcuts
- **S**: Sample one user
- **A**: Toggle auto sampling
- **R**: Reset visualization

## Development

### File Organization
The code is organized into logical modules:
- `config.js`: All parameters and constants
- `ball.js`: Animation logic for falling elements
- `histogram.js`: Data aggregation and chart rendering
- `visualization.js`: Main simulation and drawing logic
- `controls.js`: User interface handling
- `main.js`: Application initialization

### Adding New Features
- **New parameters**: Add to `MODEL_CONFIG` in `config.js`
- **UI elements**: Add to `index.html` and wire up in `controls.js`
- **Visualization changes**: Modify drawing functions in `visualization.js` or `histogram.js`

### Dependencies
- **p5.js**: For canvas-based visualization and animation
- Modern web browser with ES6+ support

## Research Background

This visualization is based on research into self-censorship and opinion expression online. The statistical model parameters come from analysis of social media posting behavior, where researchers found that:

1. Users with more extreme views across multiple topics are more likely to post
2. More extreme individual attitudes are more likely to be shared
3. These filtering effects compound to create apparent polarization that exceeds true ideological differences

## Browser Compatibility

Tested and working in:
- Chrome 90+
- Firefox 88+  
- Safari 14+
- Edge 90+

## Future Enhancements

- [ ] Export data/visualizations
- [ ] Additional statistical models
- [ ] Interactive parameter exploration
- [ ] Comparison views
- [ ] Mobile-optimized interface
- [ ] Real-time collaboration features

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions welcome! Please see CONTRIBUTING.md for guidelines.

## Citation

If you use this visualization in research or teaching, please cite:

```
Self-Censorship Multi-Stage Visualization Dashboard
[Your citation details here]
``` 