# 🏀 Scorebug

A professional live sports scoring application with broadcast-quality themes, designed for tracking basketball games in real-time.

![Scorebug Preview](https://via.placeholder.com/800x400/0f0f1a/ff6b35?text=Scorebug+Live+Scoring)

## Features

### 📋 Team Management
- Create and save teams with custom names and colors
- Add players with names and jersey numbers
- Edit or delete teams at any time
- All data persists between sessions

### 🎮 Match Setup
- Quick team selection with dropdown menus
- Visual preview of team colors before starting
- Resume in-progress games automatically
- One-click game start

### 📊 Live Scorebug Interface
- Broadcast-quality scoreboard display
- Click-to-increment stats (Shift+Click to decrement)
- Real-time score updates
- Quarter and time tracking
- Player stat tables with team colors
- Auto-calculated team totals

### ⚙️ Configurable Stats
Toggle which stats to track:
- Points (PTS)
- Rebounds (REB)
- Assists (AST)
- Steals (STL)
- Blocks (BLK)
- Fouls (PF)
- Turnovers (TO)
- 3-Pointers (3PT)

Quick presets available: Simple, Standard, Full Box Score

### 🎨 Theme System
**Preset Themes:**
- **Default** - Modern dark theme with orange accents
- **ESPN** - Classic red/yellow broadcast style
- **TNT** - Sleek blue/black professional look

**Custom Themes:**
- Create your own themes
- Customize colors, fonts, and border radius
- Live preview while editing
- Save and switch themes instantly

### 📜 Game History
- View all completed games
- Full box scores with expandable details
- Winner highlighting
- Timestamps and final scores

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone or navigate to the project
cd scorebug

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Usage Guide

### First Time Setup
1. Go to **Teams** tab
2. Click **New Team**
3. Enter team name, colors, and add players
4. Repeat for all your teams

### Starting a Game
1. Go to **Match Setup** (home page)
2. Select Home Team from dropdown
3. Select Away Team from dropdown
4. Click **Start Game**

### During a Game
- **Click** any stat to increment (+1)
- **Shift+Click** any stat to decrement (-1)
- Use quarter arrows to change quarter
- Edit time manually in the time field
- Click **End Game** to save and finish

### Customizing Your Experience
- **Settings** - Toggle which stats appear
- **Themes** - Switch broadcast styles or create your own

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS v4** for styling
- **React Router** for navigation
- **LocalStorage** for data persistence

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Layout.tsx
│   ├── TeamCard.tsx
│   └── TeamForm.tsx
├── context/          # React Context for state
│   └── AppContext.tsx
├── pages/            # Route pages
│   ├── MatchSetupPage.tsx
│   ├── TeamsPage.tsx
│   ├── GamePage.tsx
│   ├── HistoryPage.tsx
│   ├── SettingsPage.tsx
│   └── ThemesPage.tsx
├── themes/           # Theme presets
│   └── presets.ts
├── types/            # TypeScript types
│   └── index.ts
├── utils/            # Utility functions
│   └── storage.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Data Persistence

All data is stored in localStorage:
- `scorebug_teams` - Saved teams
- `scorebug_games` - Completed games
- `scorebug_settings` - Theme and stat preferences
- `scorebug_current_game` - In-progress game state

## License

MIT License - feel free to use and modify for your needs.
