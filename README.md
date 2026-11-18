# bulingStop


An anti-bullying web application designed to educate, empower, and provide resources for bullying prevention. Built with vanilla JavaScript, HTML, and CSS — deployed on Vercel.


🌐 **Live Demo**: [https://buling-stop.vercel.app/](https://buling-stop.vercel.app/)


## ✨ Features

- **Educational Content**: Information about types of bullying, warning signs, and prevention strategies
- **Interactive Resources**: Helplines, reporting guides, and support organization links
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Clean UI**: Modern, accessible interface with calm color palette
- **Zero Dependencies**: Vanilla JS, HTML, CSS — no build step required
- **Fast Loading**: Static files, deployed on Vercel's edge network


## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| **Deployment** | Vercel (static hosting) |
| **Version Control** | Git, GitHub |
| **CI/CD** | Vercel auto-deploy on push to main |


## 📁 Project Structure

```
bulingStop/
├── index.html      # Main HTML structure
├── style.css       # Styling & responsive design
├── script.js       # Interactive functionality
├── data.js         # Content data (helplines, resources, info)
└── README.md       # This file
```


## 🚀 Quick Start


### View Live

Visit the deployed application: **[https://buling-stop.vercel.app/](https://buling-stop.vercel.app/)**


### Local Development

```bash
# Clone repository
 git clone https://github.com/nikkig-entr/bulingStop.git
 cd bulingStop

# Open directly in browser (no server needed)
 # Option 1: Double-click index.html
 # Option 2: Use a local server
 npx serve .
 # or
 python -m http.server 8000
```


### Deploy to Vercel

```bash
# Install Vercel CLI
 npm i -g vercel

# Deploy
 vercel

# Or connect GitHub repo at vercel.com for auto-deploy
```


## 🎨 Customization


### Updating Content

Edit `data.js` to modify:
- Helpline numbers and links by country
- Educational content about bullying types
- Resource links and descriptions
- Support organization information

### Styling

Modify `style.css`:
- Color palette (CSS custom properties at top)
- Typography
- Spacing and layout
- Responsive breakpoints

### Functionality

Extend `script.js` for:
- New interactive features
- Animations
- Form handling
- Data persistence (localStorage)


## ♿ Accessibility

- Semantic HTML5 elements
- Proper heading hierarchy (h1-h6)
- Alt text for images
- Keyboard-navigable interactive elements
- Sufficient color contrast (WCAG AA)
- Focus indicators
- Reduced motion support


## 🤝 Contributing

Contributions welcome! This project aims to be a helpful resource:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


### Ideas for Contribution
- Add more country-specific helplines
- Translate content to other languages
- Improve accessibility
- Add interactive quizzes/self-assessment
- Enhance mobile experience
- Add printable resources


## 📄 License

MIT License — Free to use, modify, and distribute for educational and prevention purposes.


## 📞 Emergency Resources

If you or someone you know is in immediate danger, contact emergency services.

**International**:
- [Child Helpline International](https://childhelplineinternational.org/helplines/)
- [Befrienders Worldwide](https://www.befrienders.org/)
- [IASP Crisis Centres](https://www.iasp.info/resources/Crisis_Centres/)

**US**:
- **988** — Suicide & Crisis Lifeline
- **741741** — Crisis Text Line (text HOME)
- **1-800-273-8255** — National Suicide Prevention Lifeline


---

*Built with care to make the web a kinder place. 💙*
