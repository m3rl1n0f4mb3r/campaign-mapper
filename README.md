# Campaign Mapper

A hex map campaign manager for tabletop RPGs. Create, manage, and explore hexcrawl sandbox campaigns with procedural generation, image overlays, faction tracking, and comprehensive campaign notes.

## Features

### Hex Grid System
- **Flexible Grid Configuration**: Adjustable grid size, hex dimensions, and spacing
- **Pointy-top and Flat-top Orientations**: Support for both hex orientations with configurable row/column offsets
- **Image Overlay**: Import map images and overlay a hex grid on top for easy digitization of existing maps
- **Zoom and Pan**: Navigate large maps with intuitive controls

### Terrain & Generation
- **13 Default Terrain Types**: Plains, forests, hills, mountains, swamps, water, desert, and more
- **Custom Terrain Types**: Add your own terrain types with custom colors and symbols
- **Procedural Terrain Generation**: Generate terrain for individual hexes or entire regions using neighbor-influenced biome logic
- **Biome System**: Coherent terrain generation based on configurable biome tables

### Features & Settlements
- **Settlement Types**: Hamlets, villages, cities, castles, towers, and abbeys with unique generated details
- **Landmarks**: Procedurally generated points of interest
- **Lairs & Dungeons**: Monster lairs with terrain-appropriate encounters
- **Name Generation**: Flexible name generator for settlements, dungeons, and factions

### Factions
- **Faction Management**: Create and manage political factions
- **Territory Control**: Assign hexes to faction control with visual territory display
- **Relationships**: Track faction relationships (war, hostility, neutral, trade, alliance)
- **Auto-generation**: Major settlements can automatically spawn controlling factions

### Campaign Tracking
- **Hex Notes**: Arbitrary key-value notes system for each hex
- **Tags**: Customizable tagging system for organization
- **Exploration Status**: Track explored/unexplored hexes with fog of war display
- **Feature Overrides**: Customize generated content while preserving the original

### Data Management
- **Auto-save**: Changes are automatically saved to browser storage
- **Export/Import**: Save maps as JSON files for backup or sharing
- **Multiple Maps**: Manage multiple campaign maps

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd campaign-mapper

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

### Creating a New Map

1. Click **Maps > + New Map**
2. Enter a map name and grid dimensions
3. Optionally select a mode:
   - **Overlay**: Import an image to trace over
   - **Generated**: Auto-generate terrain for all hexes
   - **Blank**: Start with empty hexes

### Working with Hexes

- **Click** a hex to select it and open the detail panel
- **Shift+Click** to multi-select hexes
- **Click+Drag** to box-select multiple hexes

### Hex Detail Panel

The detail panel has three tabs:

- **Details**: Edit terrain, name, notes, tags, and exploration status
- **Features**: View and edit generated features (settlements, landmarks, lairs)
- **Generator**: Generate terrain, features, or entire regions

### Settings

Access settings via the gear icon to configure:
- Grid alignment and spacing
- Display options (terrain colors, coordinates, fog of war)
- Custom terrain types

### Keyboard Shortcuts

- **Escape**: Clear selection
- **Scroll**: Zoom in/out (when hovering over map)

## Project Structure

```
src/
├── components/          # React components
│   ├── FactionPanel     # Faction management UI
│   ├── HexDetailPanel   # Hex editing and generation
│   ├── HexListPanel     # Filtered hex lists
│   ├── HexMap           # Main map canvas
│   ├── MultiSelectPanel # Bulk hex operations
│   ├── SettingsPanel    # App settings
│   └── Toolbar          # Main toolbar
├── lib/
│   ├── generator/       # Procedural generation system
│   │   ├── tables/      # Data tables for generation
│   │   ├── biomeGenerator
│   │   ├── featureGenerator
│   │   ├── nameGenerator
│   │   └── politicalGenerator
│   ├── hexUtils         # Hex math utilities
│   ├── mapFactory       # Map CRUD operations
│   ├── storage          # Persistence layer
│   └── types            # TypeScript definitions
└── styles/
    └── index.css        # Global styles
```

## Technical Details

### Coordinate System

The app uses axial coordinates (q, r) internally for hex math, with conversion to offset coordinates (col, row) for display. This provides efficient neighbor calculations and coordinate transformations.

### Storage

Maps are stored in browser localStorage with automatic saving on changes. Export functionality allows backing up maps as JSON files.

### Generation System

The procedural generation uses a table-based system inspired by classic sandbox RPG tools, particularly the Sandbox Generator by Atelier Clandestin.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- The procedural generation system is heavily inspired by [**Sandbox Generator**](https://atelierclandestin.net/products/sandbox-generator-pdf-english) by Atelier Clandestin. This excellent book provides comprehensive tables and procedures for generating hexcrawl sandboxes, including biomes, settlements, landmarks, lairs, dungeons, factions, and more. Highly recommended for any GM running sandbox campaigns.
- Built with React, TypeScript, and Vite
