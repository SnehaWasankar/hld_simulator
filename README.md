# ArchScope

<img width="1512" height="791" alt="image" src="https://github.com/user-attachments/assets/fa4d53d8-3b5f-4545-a4d2-f04528a7559b" />

ArchScope is an interactive web-based tool that lets you design, visualize, and test system architectures with real-time performance simulations. Think of it as a digital playground for architects and engineers to experiment with different system designs before committing to expensive infrastructure decisions.

## Features

#### Visual Architecture Design: Drag-and-drop interface for building system diagrams with 9 component types
<img width="454" height="505" alt="image" src="https://github.com/user-attachments/assets/ad1a401b-ba40-4e36-98d0-f18471515a1d" />

#### Real-time Simulation: Performance testing with accurate latency, throughput, and cost modeling
<img width="459" height="555" alt="image" src="https://github.com/user-attachments/assets/5c2de741-61c2-4e41-897f-d0a3ff32b2ba" />

#### Comprehensive Analytics: Bottleneck detection, cost analysis, and time-series visualization
<img width="457" height="551" alt="image" src="https://github.com/user-attachments/assets/8000c1e4-f5b4-4d4b-bac3-ece82efe3804" />

#### Advanced Configuration: Rate limiting algorithms, cache settings, and custom cost overrides
#### Real-world Services: 30+ AWS, GCP, Azure, and generic service options with realistic pricing

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/arpitg24/ArchScope.git
cd ArchScope

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Running the Application

```bash
# Development server
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
|-- app/                    # Next.js app router
|   |-- layout.tsx          # Root layout with metadata
|   |-- page.tsx            # Home page
|   |-- globals.css         # Global styles
|-- components/            # React components
|   |-- ui/                 # Reusable UI components (shadcn/ui)
|   |-- simulator.tsx      # Main simulator component
|   |-- infra-node.tsx      # Infrastructure node component
|   |-- component-palette.tsx # Component selection panel
|   |-- config-panel.tsx    # Component configuration panel
|   |-- simulation-controls.tsx # Simulation parameters
|   |-- report-panel.tsx    # Results and analytics
|   |-- live-client-panel.tsx # Real-time monitoring
|-- lib/                    # Core logic and utilities
|   |-- types.ts            # TypeScript type definitions
|   |-- services-catalog.ts # Service definitions and pricing
|   |-- simulation-engine.ts # Core simulation logic
|   |-- load-profile.ts     # Traffic pattern generation
|   |-- presets.ts          # Pre-built architecture examples
```

## Key Components

### Core Simulation Engine (`src/lib/simulation-engine.ts`)
- Handles request flow through the architecture
- Calculates latency, throughput, and costs
- Detects bottlenecks and generates metrics

### Service Catalog (`src/lib/services-catalog.ts`)
- Defines available cloud services and their properties
- Contains pricing data and performance characteristics
- Easy to extend with new services or providers

### Main Simulator (`src/components/simulator.tsx`)
- Orchestrates the entire application
- Manages state and user interactions
- Integrates all sub-components

## Getting Started Contributing

### 1. Explore the Codebase

Start by understanding the main components:
- **Types**: Check `src/lib/types.ts` for data structures
- **Services**: Browse `src/lib/services-catalog.ts` to see available components
- **Simulation**: Review `src/lib/simulation-engine.ts` for core logic

### 2. Common Contribution Areas

#### Adding New Services
1. Add service definition to `src/lib/services-catalog.ts`
2. Update component types in `src/lib/types.ts` if needed
3. Add UI components if required

#### Improving Simulation Logic
- Modify `src/lib/simulation-engine.ts`
- Add new metrics or calculations
- Improve performance algorithms

#### UI/UX Enhancements
- Update components in `src/components/`
- Add new visualization features
- Improve user interactions

### 3. Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Test thoroughly

# Run linting and type checking
npm run lint

# Commit your changes
git commit -m "feat: add your feature description"

# Push and create a pull request
git push origin feature/your-feature-name
```

## Configuration

The application uses several configuration files:
- `next.config.ts` - Next.js configuration
- `tailwind.config.js` - TailwindCSS configuration
- `components.json` - shadcn/ui component configuration
- `tsconfig.json` - TypeScript configuration


## License

This project is open source and available under the [MIT License](LICENSE).
