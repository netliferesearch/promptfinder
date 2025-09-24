# DesignPrompts - AI Prompt Management Chrome Extension

DesignPrompts is a Chrome extension that helps you efficiently manage, store, and discover AI prompts for tools like ChatGPT, Claude, Midjourney, and more. Your prompts sync across devices through secure cloud storage.

## 🚀 Quick Start

### Installation

1. Download the extension from the [Chrome Web Store](https://chrome.google.com/webstore) (coming soon)
2. Click "Add to Chrome"
3. Pin the extension to your toolbar for easy access
4. Sign in with your Google account or create an account to sync your prompts

### First Steps

1. **Browse existing prompts** - Discover community-shared prompts across different categories
2. **Add your first prompt** - Click the "+" button to save your favorite AI prompts
3. **Search and organize** - Use the search bar to find prompts by keyword, category, or AI tool
4. **Rate and favorite** - Help the community by rating prompts and saving your favorites

## ✨ Key Features

### 🔍 **Smart Search**

- Advanced search across titles, descriptions, and content
- Filter by category, AI tool, or your personal collection
- Intelligent ranking with match highlighting

### ☁️ **Cloud Sync**

- Your prompts are automatically synced across all your Chrome browsers
- Secure backup - never lose your prompts again
- Access your library from any device where you're signed in

### 👥 **Community Features**

- Discover prompts shared by other users
- Rate prompts (1-5 stars) to help others find the best ones
- See community ratings and usage statistics
- Keep your own prompts private or share them with everyone

### 🎯 **Organization Tools**

- Organize prompts by category (Writing, Coding, Creative, Business, etc.)
- Tag prompts with relevant AI tools (ChatGPT, Claude, Midjourney, etc.)
- Favorite system for quick access to your go-to prompts
- Usage tracking to see your most-used prompts

### 🔒 **Privacy & Security**

- Choose to keep prompts private or share with the community
- Secure server-side authentication with Cloud Functions
- Google Sign-In and email/password authentication supported
- Chrome Web Store Manifest V3 compliant for enhanced security
- Your private prompts are only visible to you
- No ads, no tracking of your personal conversations

## 🎨 **Perfect For**

- **Content Creators** - Save content writing prompts, style guides, and creative templates
- **Developers** - Store code generation prompts and debugging helpers
- **Marketers** - Organize campaign ideas, ad copy templates, and strategy prompts
- **Students & Researchers** - Build a library of study aids and research prompts
- **Anyone using AI tools** - Never lose a great prompt again!

## 🛠️ **Development & Contributing**

### For Developers

Want to contribute or run DesignPrompts locally? See our [Development Guide](docs/DEVELOPMENT.md).

### Building from Source

1. **Prerequisites**: Node.js and npm
2. **Clone & Install:**
   ```bash
   git clone https://github.com/mjolne/designprompts.git
   cd designprompts
   npm install
   ```
3. **Build:**
   ```bash
   npm run build
   ```
4. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

### Testing

```bash
npm test        # Run test suite
npm run lint    # Check code quality
```

## 🌐 **Browser Support**

- ✅ **Chrome** (primary platform)
- ✅ **Firefox** (experimental support)
- 🔄 **Edge** (planned)

## 📚 **Documentation**

- [Development Guide](docs/DEVELOPMENT.md) - Set up local development
- [Search System](docs/search-system.md) - Technical details about our search
- [Analytics Privacy](docs/analytics-privacy-policy.md) - Our privacy-first approach
- [Project Roadmap](PROJECT_PLAN.md) - Upcoming features and improvements
- [Technical Documentation](docs/TECHNICAL.md) - Detailed implementation details

## 🔧 **Technical Highlights**

- Built with modern JavaScript (ES Modules)
- Firebase backend with Cloud Functions for secure server-side operations
- Chrome Web Store Manifest V3 compliant architecture
- Advanced search with typo tolerance and ranking
- Comprehensive test suite (766+ tests)
- Privacy-first analytics with GA4 integration
- Accessibility-focused UI design
- Server-side authentication for enhanced security

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Questions or Issues?**

- 🐛 [Report a bug](https://github.com/netliferesearch/promptfinder/issues)
- 💡 [Request a feature](https://github.com/netliferesearch/promptfinder/issues)
- 📧 [Contact us](mailto:effekt@netlife.com)
