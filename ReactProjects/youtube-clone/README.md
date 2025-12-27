# 🎬 YouTube Clone - Full-Stack Video Platform

A production-ready YouTube clone built with React and Supabase, featuring advanced video management, intelligent search, personalized recommendations, creator tools, and polished UI animations.

![React](https://img.shields.io/badge/React-19.2.0-61dafb?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-2.86.0-3ecf8e?logo=supabase)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Full--Text%20Search-336791?logo=postgresql)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Key Features

### 🎥 Video Platform
- **📹 Video Upload & Management** - Multi-format support with automatic compression
- **▶️ Advanced Video Player** - Custom controls, quality selection, playback speed
- **🎬 Channel System** - Create and customize your own video channel
- **📋 Playlists** - Organize videos into collections with full CRUD operations
- **🔒 Privacy Controls** - Public, unlisted, and private video settings

### 🔍 Intelligent Search & Discovery
- **⚡ Advanced Search** - Pattern matching across titles, descriptions, channels, and tags
- **🎯 Search Highlighting** - Visual highlighting of matching terms in results
- **📊 Smart Suggestions** - Auto-complete with trending and related searches
- **🏷️ Category Filtering** - Browse by 25+ video categories
- **🤖 Personalized Recommendations** - AI-powered suggestions based on watch history

### 💬 Social Features
- **💭 Threaded Comments** - Nested replies with real-time updates
- **👍 Engagement System** - Like/dislike for videos and comments
- **🔔 Activity Tracking** - Watch history and view analytics
- **👤 User Profiles** - Customizable profiles with avatars and bios

### 📊 Creator Tools
- **📈 Live Dashboard** - Real-time analytics for creators
- **💰 Revenue Tracking** - Simulated ad revenue and engagement metrics
- **📉 Performance Insights** - Views, watch time, engagement rates
- **🎨 Channel Customization** - Banners, avatars, descriptions

### 🎨 UI/UX Excellence
- **✨ Smooth Animations** - 60fps animations with GPU acceleration
- **🌓 Dark Mode** - Full dark theme support with smooth transitions
- **📱 Responsive Design** - Mobile-first, works on all screen sizes
- **♾️ Infinite Scroll** - Seamless content loading as you browse
- **🎭 Polished Interactions** - Hover effects, transitions, loading states

### 💰 Monetization Simulation
- **📺 Ad System** - Pre-roll, banner, overlay, and companion ads
- **🎯 Ad Targeting** - Category-based ad placement
- **📊 Ad Analytics** - Impressions, clicks, CTR, and RPM tracking
- **⏭️ Skip Controls** - User-friendly ad skip functionality

## 🚀 Quick Start

### Prerequisites

```bash
Node.js >= 18.x
npm >= 8.x
Supabase account (free tier works)
```

### Installation

```bash
# Clone the repository
git clone https://github.com/mm1618bu/MMartinezPortfolioRedo.git
cd MMartinezPortfolioRedo/ReactProjects/youtube-clone

# Install dependencies
npm install

# Configure environment
cp .env.template .env
# Add your Supabase URL and keys to .env

# Start development server
npm start
```

Visit **http://localhost:3000** to see your app running!

### Environment Setup

Create `.env` file with your Supabase credentials:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Optional features
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ADS=true
```

## �️ Tech Stack

### Frontend Architecture
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.0 | UI framework with hooks and concurrent features |
| **React Router** | 7.9.6 | Client-side routing and navigation |
| **React Query** | 5.90.12 | Data fetching, caching, and state management |
| **React Icons** | 5.4.0 | Comprehensive icon library |

### Backend Services
| Technology | Purpose |
|-----------|---------|
| **Supabase** | PostgreSQL database, auth, and storage |
| **PostgreSQL** | Relational database with full-text search |
| **Supabase Storage** | Video and image file storage |
| **Supabase Auth** | User authentication and authorization |

### Development Tools
- **React Scripts** 5.0.1 - Build tooling and dev server
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **GitHub Actions** - CI/CD automation

### Key Libraries
- **Custom Hooks** - Reusable React logic
- **CSS3 Animations** - Smooth UI transitions
- **Modern JavaScript** - ES2022+ features

## 📚 Complete Documentation

### Core Implementation Guides
- **[Search Implementation](FULL_TEXT_SEARCH_IMPLEMENTATION.md)** - Complete search system with PostgreSQL full-text capabilities
- **[Search Comparison](FULL_TEXT_SEARCH_COMPARISON.md)** - Before/after analysis of search improvements
- **[Personalized Recommendations](PERSONALIZED_RECOMMENDATIONS_GUIDE.md)** - AI-powered video suggestions based on watch history
- **[Personalized Recommendations Implementation](PERSONALIZED_RECOMMENDATIONS_IMPLEMENTATION.md)** - Technical implementation details
- **[Live Creator Dashboard](LIVE_CREATOR_DASHBOARD_GUIDE.md)** - Real-time analytics for content creators
- **[Dashboard Implementation Summary](DASHBOARD_IMPLEMENTATION_SUMMARY.md)** - Technical dashboard details
- **[Ad System Guide](AD_SYSTEM_GUIDE.md)** - Complete advertising simulation system
- **[Infinite Scroll Guide](INFINITE_SCROLL_GUIDE.md)** - Seamless content loading implementation
- **[Backup & Recovery Plan](BACKUP_RECOVERY_PLAN.md)** - Disaster recovery strategy

### Quick Reference Guides
- **[Search Quick Reference](FULL_TEXT_SEARCH_QUICK_REFERENCE.md)** - Fast lookup for search features
- **[Recommendations Quick Reference](PERSONALIZED_RECOMMENDATIONS_QUICK_REFERENCE.md)** - Recommendation features at a glance
- **[Dashboard Quick Reference](DASHBOARD_QUICK_REFERENCE.md)** - Creator dashboard features
- **[Dashboard Visual Guide](DASHBOARD_VISUAL_GUIDE.md)** - Visual walkthrough with screenshots
- **[Backup Quick Start](BACKUP_QUICK_START.md)** - Get backups running in 5 minutes

### Specialized Guides
- **[CI/CD Setup](CICD_SETUP_GUIDE.md)** - GitHub Actions pipeline configuration
- **[Autoplay Feature](AUTOPLAY_FEATURE.md)** - Continuous video playback
- **[Channel Creation](CHANNEL_CREATION_GUIDE.md)** - Channel setup and management
- **[Playlist System](FEATURE_SAVE_TO_PLAYLIST.md)** - Playlist functionality
- **[Video Compression](COMPRESSION_OPTIMIZATION.md)** - Video optimization techniques
- **[FFmpeg Setup](FFMPEG_SETUP.md)** - Video processing configuration
- **[Rate Limiting](RATE_LIMITING_GUIDE.md)** - API rate limiting implementation
- **[Search Feature](SEARCH_FEATURE.md)** - Search system overview

### System Documentation
- **[Workflow README](.github/workflows/README.md)** - GitHub Actions workflows
- **[SQL Migrations](sql/)** - Database schema and migrations
- **[Next Steps](NEXT_STEPS.md)** - Roadmap and future features

## 📜 Available Scripts

### Development Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start development server at http://localhost:3000 |
| `npm test` | Run tests in interactive watch mode |
| `npm run lint` | Check code quality with ESLint |
| `npm run lint:fix` | Auto-fix ESLint errors |
| `npm run format` | Format code with Prettier |

### Production Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Create optimized production build |
| `npm run test:ci` | Run tests with coverage (CI mode) |
| `npm run analyze` | Analyze bundle size |

### Deployment Commands

| Command | Description |
|---------|-------------|
| `./scripts/ci-local.sh` | Test CI pipeline locally |
| `./scripts/deploy.sh` | Deploy to production/staging |

## 🗂️ Project Structure

```
youtube-clone/
├── .github/
│   └── workflows/              # GitHub Actions CI/CD pipelines
├── public/
│   └── WishlistData.json      # Sample data
├── src/
│   ├── front-end/
│   │   ├── components/         # React components
│   │   │   ├── VideoPlayer.jsx    # Video playback
│   │   │   ├── VideoGrid.jsx      # Video listings
│   │   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   │   ├── HomeFeed.jsx       # Main feed
│   │   │   ├── CommentsSection.jsx
│   │   │   ├── Channel.jsx
│   │   │   ├── Playlists.jsx
│   │   │   └── ... (20+ components)
│   │   ├── utils/              # Utility functions
│   │   │   ├── searchAPI.js       # Search functionality
│   │   │   ├── homeFeedAPI.js     # Video feed logic
│   │   │   ├── historyBasedRecommendations.js
│   │   │   ├── supabase.js        # Supabase client
│   │   │   └── adSimulationEngine.js
│   │   └── assets/             # Images and static files
│   ├── styles/
│   │   └── main.css            # Global styles with animations
│   ├── App.js                  # Main application component
│   ├── App.css                 # App-level styles
│   └── index.js                # React entry point
├── sql/                        # Database migrations
│   ├── create_tables.sql
│   ├── add_full_text_search.sql
│   └── ... (10+ migration files)
├── scripts/                    # Build and deployment scripts
└── docs/                       # Extended documentation
    ├── FULL_TEXT_SEARCH_*.md
    ├── PERSONALIZED_RECOMMENDATIONS_*.md
    ├── DASHBOARD_*.md
    └── ... (30+ documentation files)
```

## 🎨 Recent Improvements

### Search System Enhancements
- ✅ **Advanced Pattern Matching** - Search across title, description, channel name, and meta tags
- ✅ **Search Highlighting** - Visual emphasis on matching terms in results
- ✅ **Auto-complete Suggestions** - Real-time search suggestions as you type
- ✅ **Graceful Fallbacks** - Robust error handling with fallback search methods
- ✅ **Performance Optimization** - Debounced input and efficient query patterns

### UI/UX Polish
- ✅ **Smooth Animations** - 60fps animations throughout the app
  - Fade-in effects for content loading
  - Slide-in animations for modals and dropdowns
  - Scale and transform effects for interactive elements
  - Shimmer loading states for skeleton screens
- ✅ **Enhanced Video Cards** - 3D hover effects with lift and shadow
- ✅ **Navbar Improvements** - Gradient accents and smooth transitions
- ✅ **Button Polish** - Ripple effects and gradient backgrounds
- ✅ **Loading States** - Skeleton screens and spinners
- ✅ **Dark Mode** - Complete dark theme with smooth transitions

### Sidebar Redesign
- ✅ **Section Organization** - Logical grouping of navigation items
- ✅ **Visual Hierarchy** - Clear sections with titles and dividers
- ✅ **Hover Animations** - Smooth transitions and active state indicators
- ✅ **User Info Card** - Enhanced profile display with avatar
- ✅ **Responsive Design** - Mobile-friendly collapsible sidebar

### Database Optimization
- ✅ **Removed Legacy Tables** - Cleaned up video_categories and video_tags dependencies
- ✅ **Streamlined Queries** - Optimized to use actual table schema (keywords, meta_tags)
- ✅ **Error Handling** - Graceful degradation when RPC functions unavailable
- ✅ **Performance** - Reduced query complexity and improved response times

## 🔧 Configuration

### Database Setup

1. **Create Supabase Project**
   - Visit [supabase.com](https://supabase.com) and create a free account
   - Create a new project and note your URL and keys

2. **Run Migrations**
   ```bash
   # Copy SQL files from sql/ directory
   # Run in Supabase SQL Editor in this order:
   1. create_tables.sql
   2. create_channels_table.sql
   3. create_playlists_schema.sql
   4. create_comments_table.sql
   5. create_replies_table.sql
   # ... (see sql/ directory for complete list)
   ```

3. **Configure Storage**
   - Create buckets: `videos`, `thumbnails`, `avatars`, `banners`
   - Set up RLS policies (see `fix_storage_policies.sql`)

4. **Set Up Authentication**
   - Enable email authentication
   - Configure password requirements
   - Set up email templates (optional)

### Environment Variables

```env
# Required
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJxxx...

# Optional Features
REACT_APP_ENABLE_ANALYTICS=true       # Enable analytics tracking
REACT_APP_ENABLE_ADS=true            # Enable ad simulation
REACT_APP_ENABLE_RECOMMENDATIONS=true # Enable personalized recommendations
```

## 🧪 Testing

### Running Tests

```bash
# Watch mode (development)
npm test

# Single run with coverage
npm run test:coverage

# CI mode (no watch)
npm run test:ci
```

### Coverage Goals
- **Target**: >80% code coverage
- **Reports**: Available in `coverage/` directory
- **CI Integration**: Automated coverage checks on PRs

### Testing Stack
- **Jest** - Test framework
- **React Testing Library** - Component testing
- **Coverage Reports** - Istanbul/nyc

## 🚀 Deployment

### Automated Deployment (Recommended)

The project includes GitHub Actions workflows:

1. **Push to `main`** → Triggers production deployment
2. **Pull Requests** → Runs tests and builds preview
3. **Manual Trigger** → Deploy to specific environments

See [CICD_SETUP_GUIDE.md](CICD_SETUP_GUIDE.md) for complete setup.

### Manual Deployment Options

#### Vercel (Recommended)
```bash
npm install -g vercel
npm run build
vercel --prod
```

#### Netlify
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod
```

#### AWS S3 + CloudFront
```bash
npm run build
aws s3 sync build/ s3://your-bucket/ --delete
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

#### Docker
```bash
docker build -t youtube-clone .
docker run -p 3000:3000 youtube-clone
```

## 📊 Feature Deep Dive

### Advanced Search System

Our search implementation provides:

- **Multi-field Search**: Searches across titles, descriptions, channel names, and meta tags
- **Pattern Matching**: Uses PostgreSQL ILIKE for flexible text matching
- **Real-time Suggestions**: Auto-complete as you type
- **Debounced Input**: 500ms delay to reduce unnecessary queries
- **Result Highlighting**: Visual emphasis on matching terms
- **Smart Sorting**: Results ordered by relevance (views, recency)
- **Graceful Fallbacks**: Works without advanced RPC functions

**Implementation**: See [FULL_TEXT_SEARCH_IMPLEMENTATION.md](FULL_TEXT_SEARCH_IMPLEMENTATION.md)

### Personalized Recommendations

AI-powered video suggestions based on:

- **Watch History Analysis**: Tracks user viewing patterns
- **Channel Affinity**: Prefers creators you frequently watch
- **Engagement Metrics**: Considers likes, comments, completion rate
- **Diversity Injection**: Prevents filter bubbles with varied content
- **Cold Start Handling**: Provides trending videos for new users

**How it works**:
1. Analyzes your last 50 watched videos
2. Calculates preference scores for channels
3. Ranks videos based on multiple factors (40% channel, views, recency)
4. Injects 30% diverse content to avoid echo chambers
5. Updates in real-time as you watch more videos

**Implementation**: See [PERSONALIZED_RECOMMENDATIONS_GUIDE.md](PERSONALIZED_RECOMMENDATIONS_GUIDE.md)

### Live Creator Dashboard

Real-time analytics dashboard featuring:

- **📈 Live Metrics**: Views, watch time, engagement (updates every 30s)
- **💰 Revenue Tracking**: Simulated ad revenue with RPM calculations
- **📊 Performance Charts**: Visual graphs for trends over time
- **👥 Audience Insights**: Demographics and viewing patterns
- **🎯 Content Performance**: Individual video analytics
- **🔔 Real-time Alerts**: Notifications for milestones and achievements

**Implementation**: See [LIVE_CREATOR_DASHBOARD_GUIDE.md](LIVE_CREATOR_DASHBOARD_GUIDE.md)

### Ad Simulation System

Complete advertising ecosystem:

**Ad Types**:
- 🎬 **Pre-roll Video Ads**: Before video playback (skippable after 5s)
- 📰 **Banner Ads**: Top/bottom page banners
- 🎨 **Overlay Ads**: Semi-transparent video overlays
- 📱 **Companion Ads**: Sidebar display ads

**Features**:
- Category-based targeting
- Frequency capping (max per hour)
- Skip functionality with countdown
- Click tracking and CTR calculation
- Revenue simulation (CPM/CPC models)
- Analytics dashboard with real-time metrics

**Implementation**: See [AD_SYSTEM_GUIDE.md](AD_SYSTEM_GUIDE.md)

### Infinite Scroll

Seamless content loading:

- **Auto-load**: Triggers when user scrolls to bottom
- **Performance**: Uses React Query for caching and deduplication
- **Smooth UX**: Loading indicators and skeleton screens
- **Pagination**: Efficient offset-based loading (20 videos per page)
- **Error Handling**: Retry mechanism for failed loads

**Implementation**: See [INFINITE_SCROLL_GUIDE.md](INFINITE_SCROLL_GUIDE.md)

## 🎨 UI Animation System

### Keyframe Animations

```css
fadeIn      - Smooth entrance with upward movement
slideInUp   - Slide from bottom with fade
slideInDown - Slide from top with fade
scaleIn     - Pop-in scale effect
shimmer     - Loading skeleton animation
pulse       - Breathing effect for emphasis
ripple      - Material Design touch feedback
spin        - Loading spinner rotation
```

### Interactive Elements

- **Video Cards**: 3D lift on hover with shadow and border glow
- **Buttons**: Gradient backgrounds with ripple click effects
- **Navbar**: Logo rotation, text gradient shift, avatar ring pulse
- **Dropdowns**: Scale and slide animations with stagger
- **Loading States**: Shimmer skeletons and spinners
- **Hover Effects**: Transform, scale, and color transitions

### Performance

- 60fps animations using GPU acceleration
- `cubic-bezier` easing for natural motion
- Hardware-accelerated properties (transform, opacity)
- Optimized repaints and reflows
- Debounced scroll events

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/MMartinezPortfolioRedo.git
   cd MMartinezPortfolioRedo/ReactProjects/youtube-clone
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests for new features

4. **Test Locally**
   ```bash
   npm test
   npm run lint
   ./scripts/ci-local.sh
   ```

5. **Commit and Push**
   ```bash
   git commit -m 'feat: add amazing feature'
   git push origin feature/amazing-feature
   ```

6. **Open Pull Request**
   - Describe changes clearly
   - Link related issues
   - Request review

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     New feature
fix:      Bug fix
docs:     Documentation only
style:    Code style (formatting, no logic change)
refactor: Code restructuring
perf:     Performance improvement
test:     Adding/updating tests
ci:       CI/CD changes
chore:    Maintenance tasks
```

### Code Style

- **JavaScript**: ES2022+, functional components, hooks
- **CSS**: BEM naming, CSS variables, animations
- **React**: Hooks, React Query, context when needed
- **Testing**: React Testing Library, meaningful test names

## 🐛 Troubleshooting

### Common Issues

**Problem**: Search returns no results
- **Solution**: Check Supabase connection, verify videos table has data

**Problem**: Videos not playing
- **Solution**: Ensure video URLs are accessible, check CORS settings

**Problem**: Animations choppy
- **Solution**: Enable hardware acceleration in browser, check GPU usage

**Problem**: Build fails
- **Solution**: Clear node_modules and reinstall: `rm -rf node_modules && npm install`

**Problem**: Supabase errors
- **Solution**: Verify environment variables, check API keys are valid

### Getting Help

- 📖 Check documentation in `/docs` directory
- 🐛 Search [existing issues](https://github.com/mm1618bu/MMartinezPortfolioRedo/issues)
- 💬 Open a new issue with detailed description
- 📧 Contact: [Create issue on GitHub](https://github.com/mm1618bu/MMartinezPortfolioRedo/issues/new)

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ⚠️ License and copyright notice required
- ❌ No liability or warranty

## 🙏 Acknowledgments

### Built With
- [React](https://reactjs.org/) - UI framework
- [Supabase](https://supabase.com/) - Backend platform
- [PostgreSQL](https://www.postgresql.org/) - Database
- [React Query](https://tanstack.com/query) - Data fetching
- [React Router](https://reactrouter.com/) - Navigation
- [React Icons](https://react-icons.github.io/) - Icon library

### Inspired By
- YouTube's video platform architecture
- Modern React best practices
- Material Design principles

### Special Thanks
- Create React App team for excellent tooling
- Supabase team for amazing backend services
- Open source community for invaluable libraries

## 📞 Support & Contact

### Get Help
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/mm1618bu/MMartinezPortfolioRedo/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/mm1618bu/MMartinezPortfolioRedo/discussions)
- 📖 **Documentation**: See `/docs` directory
- ⭐ **Star this repo** if you find it helpful!

### Stay Updated
- Watch this repository for updates
- Check [NEXT_STEPS.md](NEXT_STEPS.md) for roadmap
- Follow commit history for recent changes

---

<div align="center">

**Made with ❤️ using React and Supabase**

[⬆ Back to Top](#-youtube-clone---full-stack-video-platform)

</div>
