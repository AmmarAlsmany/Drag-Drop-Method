# Maktabi Tech - Professional Media Control Interface

A modern, enterprise-grade media control dashboard built with React and Tailwind CSS. This application provides an intuitive, professional interface for managing media sources, displays, and control systems with advanced drag-and-drop functionality.

## 🚀 Features

### Core Functionality
- **Media Source Management**: Browse and search through available media sources
- **Advanced Drag & Drop**: Intuitive drag-and-drop with resize capabilities
- **Multi-Display Support**: Manage multiple displays and video walls
- **Real-time Controls**: Live recording indicators and control buttons
- **Professional UI**: Clean, modern interface optimized for control rooms

### Interface Components
- **Left Sidebar**: Navigation menu with source management and search
- **Video Wall**: Main drag-drop canvas with image manipulation
- **Table Monitors**: Multiple chart display sections
- **Right Control Panel**: Media control buttons and presets
- **Recording Status**: Live recording indicator with timer

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19.1.1
- **Styling**: Tailwind CSS 4.1.13
- **Build Tool**: Vite 7.1.6
- **Development**: ESLint for code quality
- **Icons**: Custom PNG icons and SVG graphics

### Backend
- **Python**: Flask 3.1.0 with CORS support
- **Network Scanning**: Device discovery and network monitoring
- **Device API**: Hardware device communication and control
- **Dependencies**: See `requirements.txt` for complete list

## 📦 Installation

### Prerequisites
- **Node.js** (version 16 or higher)
- **Python** (version 3.8 or higher)
- **npm** or yarn package manager
- **pip** package manager for Python

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd maktabi-tech
   ```

2. **Run the setup script**
   ```bash
   # Windows
   setup.bat

   # Linux/Mac
   ./setup.sh
   ```

3. **Open your browser**
   Navigate to `http://localhost:5173` for the frontend
   Backend API will be available at `http://localhost:5000`

### Manual Setup

If you prefer to set up manually:

1. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

2. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the Backend Server**
   ```bash
   python device_api.py
   ```

4. **Start the Frontend (in a new terminal)**
   ```bash
   npm run dev
   ```

## 🎯 How to Use

### Getting Started

1. **Launch the Application**
   - Start the development server using `npm run dev`
   - The interface will load with three main sections

2. **Navigate the Interface**
   - **Left Sidebar**: Contains navigation icons and source management
   - **Main Area**: Displays video walls and table monitors
   - **Right Panel**: Provides control buttons and presets

### Using Media Sources

1. **Browse Sources**
   - Use the search bar in the left sidebar to find specific media
   - Scroll through available source images in the source panel

2. **Drag and Drop Media**
   - Click and drag any image from the source panel
   - Drop it onto the "Table Monitors" area in the main display
   - Images will be positioned where you drop them

3. **Manage Dropped Images**
   - Click on any dropped image to select it
   - Use the red "X" button to remove unwanted images
   - Press `Delete` key to remove selected images

### Control Features

1. **Recording Controls**
   - Monitor recording status via the red indicator
   - View recording duration in real-time

2. **Display Controls**
   - Use power and screen size buttons for display management
   - Access various control functions via the right sidebar

3. **Preset Management**
   - Save current configurations using the "Save Preset" button
   - Access saved presets for quick setup

## 🎨 Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    Header with Recording Status              │
├─────────────┬─────────────────────────────────┬─────────────┤
│             │                                 │             │
│   Left      │         Main Display Area       │    Right    │
│  Sidebar    │                                 │   Control   │
│             │  • Video Wall Controls          │    Panel    │
│  • Logo     │  • Table Monitors (Drop Zone)   │             │
│  • Nav      │  • Drag & Drop Interface        │  • Controls │
│  • Sources  │                                 │  • Presets  │
│  • Search   │                                 │             │
│             │                                 │             │
└─────────────┴─────────────────────────────────┴─────────────┘
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality

## 📁 Professional Project Structure

```
src/
├── App.jsx                    # Main application orchestrator
├── components/
│   ├── LeftSidebar.jsx       # Navigation & source management
│   ├── VideoWall.jsx         # Main drag-drop canvas
│   ├── TableMonitor.jsx      # Reusable chart display component
│   ├── DisplayHeader.jsx     # Recording status header
│   ├── RightSidebar.jsx      # Control panel component
│   └── ResizeHandles.jsx     # Drag resize handle components
├── hooks/
│   └── useDragAndDrop.js     # Custom drag-drop logic hook
├── assets/
│   ├── icon/                 # Navigation and UI icons
│   ├── righticon/            # Control panel icons
│   ├── source/               # Media source images
│   └── *.png                 # Various UI assets
├── App.css                   # Global styles
├── index.css                 # Base styles
└── main.jsx                  # Application entry point
```

### 🏗️ Architecture Benefits
- **Modular Design**: Each component has a single responsibility
- **Reusable Components**: TableMonitor can display any chart
- **Custom Hooks**: Encapsulated drag-drop logic for reusability
- **Separation of Concerns**: Clean separation between UI and logic
- **Maintainable**: Easy to update and extend individual components

## 🎮 Key Interactions

### Advanced Drag and Drop
- **Source to Video Wall**: Drag images from source panel to video wall canvas
- **Precise Positioning**: Drop images anywhere within the canvas area
- **Visual Feedback**: Hover effects and cursor changes during operations
- **Resize Handles**: Corner and edge handles for image resizing
- **Aspect Ratio**: Maintains original image proportions during resize

### Professional Image Management
- **Selection**: Click to select dropped images with visual indicators
- **Removal**: Use X button (hover) or Delete key to remove images
- **Resizing**: Drag from corners or edges while maintaining aspect ratio
- **Layering**: Automatically brings selected images to front
- **Boundary Constraints**: Images stay within canvas boundaries

### Navigation & Controls
- **Sidebar Navigation**: Professional icon-based navigation
- **Smart Search**: Real-time filtering of media sources
- **Scroll Management**: Transparent scrollbars for clean UI
- **Control Panels**: Multiple sections with consistent styling

## 🎯 Professional Use Cases

- **Media Control Rooms**: Enterprise-grade media management setups
- **Broadcast Studios**: Professional live media source switching
- **Command Centers**: Multi-display monitoring and control
- **Event Management**: Large-scale multi-display coordination
- **Educational Facilities**: Interactive learning and presentation systems
- **Corporate Environments**: Professional presentation and monitoring

## 🔮 Enterprise Roadmap

- **Real-time Streaming**: Integration with live media streams
- **Advanced Presets**: Save and manage complex display configurations
- **Multi-user Collaboration**: Team-based control room management
- **Custom Themes**: Branded interface customization
- **API Integration**: Connect with external media management systems
- **Analytics Dashboard**: Usage tracking and performance metrics

## 📝 Professional Development

- **Modern React Architecture**: Built with React 19+ and functional components
- **Custom Hooks**: Reusable logic with `useDragAndDrop` hook
- **Component-Based Design**: Modular, maintainable component structure
- **Performance Optimized**: Efficient state management and rendering
- **Professional Styling**: Tailwind CSS with consistent design system
- **Type Safety**: Ready for TypeScript integration
- **Error Handling**: Comprehensive error boundaries and user feedback

## 🛠️ Component Documentation

### Core Components

#### `LeftSidebar`
- **Purpose**: Navigation and source management
- **Features**: Logo, navigation icons, search functionality, source images
- **Props**: `onDragStart` function for drag operations

#### `VideoWall`
- **Purpose**: Main drag-drop canvas for image manipulation
- **Features**: Drag-drop zone, image positioning, resize handles
- **Props**: Canvas ref, dropped images, event handlers

#### `TableMonitor`
- **Purpose**: Reusable chart display component
- **Features**: Control icons, chart display, consistent styling
- **Props**: `chartImage`, `title` (optional)

#### `useDragAndDrop` Hook
- **Purpose**: Encapsulates all drag-drop logic
- **Returns**: State and handlers for drag-drop operations
- **Features**: Image positioning, resizing, selection management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the component structure guidelines
4. Make your changes with proper documentation
5. Run tests and linting (`npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines
- Follow the established component structure
- Use the custom hooks for shared logic
- Maintain consistent styling with Tailwind CSS
- Add proper prop types and documentation
- Test drag-drop functionality thoroughly

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Maktabi Tech** - Enterprise Media Control Solutions
*Professional • Scalable • Reliable*