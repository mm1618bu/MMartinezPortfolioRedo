# YouTube Clone

A full-featured YouTube clone built with React, featuring video upload, playback, comments, channels, playlists, ad simulation, and category-based browsing.

![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/CI/badge.svg)
![Deploy](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Deploy/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

- 📹 **Video Management**: Upload, play, and manage videos with full metadata
- 💬 **Comments & Replies**: Threaded comment system with real-time updates
- 📺 **Channels**: Create and manage channels with customizable profiles
- 📋 **Playlists**: Save videos to playlists for organized viewing
- 🎯 **Category Filtering**: Browse videos by 25+ categories
- ♾️ **Infinite Scroll**: Seamless automatic loading of more videos as you scroll
- 📊 **Analytics**: Track views, engagement, and ad performance
- 📊 **Live Creator Dashboard**: Real-time stats and content management for creators
- ✨ **Personalized Recommendations**: AI-powered suggestions based on watch history
- 💰 **Ad Simulation**: Complete advertising system with multiple ad types
- 🔍 **Search**: Find videos, channels, and content
- 👤 **User Profiles**: Manage subscriptions and viewing history
- 🎨 **Responsive UI**: Mobile-friendly design with modern aesthetics

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Supabase account (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd youtube-clone

# Install dependencies
npm install

# Set up environment variables
cp .env.template .env
# Edit .env with your Supabase credentials

# Start development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

### Core Guides
- **[CI/CD Setup Guide](CICD_SETUP_GUIDE.md)** - Complete guide for GitHub Actions setup
- **[Ad System Guide](AD_SYSTEM_GUIDE.md)** - Comprehensive ad simulation documentation
- **[Infinite Scroll Guide](INFINITE_SCROLL_GUIDE.md)** - Infinite scroll implementation details
- **[Personalized Recommendations Guide](PERSONALIZED_RECOMMENDATIONS_GUIDE.md)** - Watch history-based recommendation system

### Quick References
- **[Personalized Recommendations Quick Reference](PERSONALIZED_RECOMMENDATIONS_QUICK_REFERENCE.md)** - Fast lookup for recommendation featur
### Quick References
- **[Dashboard Quick Reference](DASHBOARD_QUICK_REFERENCE.md)** - Fast lookup for dashboard features
- **[Dashboard Visual Guide](DASHBOARD_VISUAL_GUIDE.md)** - Visual walkthrough with layouts
- **[Dashboard Implementation Summary](DASHBOARD_IMPLEMENTATION_SUMMARY.md)** - Technical implementation details

### System Documentation
- **[Workflow README](.github/workflows/README.md)** - GitHub Actions workflow details

## 🛠️ Tech Stack

### Frontend
- **React 19.2.0** - UI framework
- **React Router 7.9.6** - Client-side routing
- **React Query 5.90.12** - Data fetching and caching
- **React Icons 5.4.0** - Icon library

### Backend
- **Supabase 2.86.0** - PostgreSQL database, authentication, and storage
- **PostgreSQL** - Relational database with full-text search

### Development & CI/CD
- **React Scripts 5.0.1** - Build tooling
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **GitHub Actions** - CI/CD automation

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## 📜 Available Scripts

### Development

```bash
npm start          # Start development server (http://localhost:3000)
npm test           # Run tests in watch mode
npm run lint       # Check code quality with ESLint
npm run lint:fix   # Fix ESLint errors automatically
npm run format     # Format code with Prettier
```

### Production

```bash
npm run build      # Create production build
npm run test:ci    # Run tests with coverage (CI mode)
npm run analyze    # Analyze bundle size
```

### CI/CD

```bash
./scripts/ci-local.sh  # Test CI pipeline locally
./scripts/deploy.sh    # Deploy to production/staging
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ADS=true
```

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migrations in the `sql/` directory
3. Set up storage buckets for videos and images
4. Configure authentication providers

See the database setup guide for detailed instructions.

## 🎨 Project Structure

```
youtube-clone/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── src/
│   ├── components/         # React components
│   ├── services/           # API services
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── adSimulationEngine.js  # Ad system
│   ├── homeFeedAPI.js      # Video feed logic
│   └── App.js              # Main app component
├── AD_SYSTEM_GUIDE.md      # Ad system documentation
├── CICD_SETUP_GUIDE.md     # CI/CD setup guide
└── README.md               # This file
```

## 🧪 Testing

### Run Tests

```bash
# Interactive mode
npm test

# With coverage
npm run test:coverage

# CI mode (no watch)
npm run test:ci
```

### Test Coverage

The project aims for >80% test coverage. Current coverage reports are available in the `coverage/` directory after running tests.

## 🚀 Deployment

### Automated Deployment (CI/CD)

The project includes GitHub Actions workflows for automated deployment:

1. **Push to `main`** → Triggers production deployment
2. **Pull Request** → Runs tests and creates preview build
3. **Manual trigger** → Deploy to staging or rollback

See [CICD_SETUP_GUIDE.md](CICD_SETUP_GUIDE.md) for complete setup instructions.

### Manual Deployment

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### AWS S3
```bash
npm run build
aws s3 sync build/ s3://your-bucket-name/ --delete
```

## 📊 Features Deep Dive

### Ad Simulation System

Complete advertising simulation with:
- **4 Ad Types**: Video pre-roll, banner, overlay, companion
- **Targeting**: Category-based ad targeting
- **Frequency Control**: Maximum ads per hour, minimum time between ads
- **Skip Functionality**: 5-second skip delay for video ads
- **Analytics Dashboard**: Real-time metrics (impressions, clicks, CTR, revenue, RPM)
- **Revenue Tracking**: Simulated ad revenue calculation

See [AD_SYSTEM_GUIDE.md](AD_SYSTEM_GUIDE.md) for detailed documentation.

### Category System

Browse videos by 25+ categories:
- Technology
- Gaming
- Music
- Education
- Entertainment
- Sports
- News
- Comedy
- And many more...

### Video Management

- **Upload**: Support for multiple video formats
- **Processing**: Automatic video compression and optimization
- **Metadata**: Title, description, category, visibility settings
- **Thumbnails**: Custom or auto-generated thumbnails
- **Analytics**: View count, engagement metrics

### Comment System

- **Threaded Comments**: Nested replies up to multiple levels
- **Real-time Updates**: Live comment feed with React Query
- **Moderation**: Delete, edit, and pin comments
- **Notifications**: Get notified of replies to your comments

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests and linting (`./scripts/ci-local.sh`)
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Test updates
- `ci:` - CI/CD changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Create React App](https://create-react-app.dev/) - React bootstrapping
- [Supabase](https://supabase.com/) - Backend infrastructure
- [React Icons](https://react-icons.github.io/react-icons/) - Icon library
- [React Query](https://tanstack.com/query) - Data fetching

## 📞 Support

- 📧 Email: your.email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/YOUR_REPO/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/YOUR_USERNAME/YOUR_REPO/discussions)

---

## 📚 Additional Documentation

For more detailed information, see:

- **[CI/CD Setup Guide](CICD_SETUP_GUIDE.md)** - Complete CI/CD pipeline setup
- **[Ad System Guide](AD_SYSTEM_GUIDE.md)** - Ad simulation system documentation
- **[Workflow README](.github/workflows/README.md)** - GitHub Actions workflows

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
