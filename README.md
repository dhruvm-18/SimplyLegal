# SimplyLegal - Frontend

A beautiful, minimalist Google-style frontend for AI-powered legal document analysis with Apple-inspired animations.

## 🚀 Features

- **Modern UI/UX**: Clean Google Material Design with Apple-inspired micro-interactions
- **Authentication**: Firebase Auth with Google and email sign-in
- **Document Upload**: Drag & drop file upload with progress tracking
- **Real-time Processing**: Beautiful processing screen with step-by-step progress
- **Document Analysis**: Comprehensive view with:
  - Plain-English clause summaries
  - Risk assessment with color-coded indicators
  - Actionable checklists with due dates
  - Q&A system with citations
- **Responsive Design**: Mobile-first approach with smooth animations
- **PDF Export**: Generate briefing sheets for documents

## 🎨 Design System

### Colors
- **Primary**: Google Blue (#4285f4)
- **Secondary**: Google Green (#34a853)
- **Warning**: Google Yellow (#fbbc04)
- **Error**: Google Red (#ea4335)

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

### Animations
- **Framer Motion**: Smooth page transitions and micro-interactions
- **Apple-inspired**: Subtle hover effects and loading states
- **Google-style**: Material Design elevation and shadows

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Mock Authentication** - Simple auth system for development
- **Framer Motion** - Animations and transitions
- **React Dropzone** - File upload functionality
- **React Icons** - Icon library
- **CSS Modules** - Scoped styling
- **Axios** - HTTP client for API calls

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.js       # Button component with variants
│   ├── Button.css
│   ├── Card.js         # Card component with elevation
│   ├── Card.css
│   ├── FileUpload.js   # File upload modal
│   ├── FileUpload.css
│   ├── DocumentCard.js # Document list item
│   └── DocumentCard.css
├── pages/              # Page components
│   ├── Login.js        # Authentication page
│   ├── Login.css
│   ├── Dashboard.js    # Main dashboard
│   ├── Dashboard.css
│   ├── DocumentView.js # Document analysis view
│   ├── DocumentView.css
│   ├── ProcessingScreen.js # Processing status
│   └── ProcessingScreen.css
├── lib/                # Utility libraries
│   ├── auth.js         # Firebase authentication
│   └── api.js          # API service layer
├── App.js              # Main app component
├── App.css             # Global app styles
├── index.js            # App entry point
└── index.css           # Global styles and CSS variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd legal-doc-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Authentication**
   - The app uses a simple mock authentication system
   - Demo credentials: `demo@example.com` / `demo123`
   - Test credentials: `test@example.com` / `test123`

4. **Start development server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📱 Pages & Features

### 1. Login Page (`/login`)
- Beautiful gradient background with floating animations
- Google and email authentication
- Smooth form transitions
- Feature highlights section

### 2. Dashboard (`/`)
- Document upload with drag & drop
- Search and filter functionality
- Document grid with status indicators
- Responsive design for all screen sizes

### 3. Processing Screen (`/processing/:docId`)
- Real-time progress tracking
- Step-by-step processing visualization
- Error handling with retry functionality
- Beautiful loading animations

### 4. Document View (`/document/:docId`)
- Tabbed interface (Summary, Risks, Checklist, Q&A)
- Clause-by-clause analysis
- Risk assessment with color coding
- Interactive Q&A with citations
- PDF export functionality

## 🎯 Key Components

### Button Component
```jsx
<Button 
  variant="primary" 
  size="large" 
  loading={false}
  icon={<FiUpload />}
  onClick={handleClick}
>
  Upload Document
</Button>
```

### Card Component
```jsx
<Card 
  elevation="medium" 
  hoverable 
  onClick={handleClick}
>
  <h3>Card Title</h3>
  <p>Card content...</p>
</Card>
```

### FileUpload Component
```jsx
<FileUpload 
  onClose={handleClose}
  onSuccess={handleSuccess}
/>
```

## 🎨 Customization

### CSS Variables
All design tokens are defined in `src/index.css`:

```css
:root {
  --primary-color: #4285f4;
  --spacing-md: 16px;
  --font-size-lg: 18px;
  --radius-md: 8px;
  --transition-normal: 0.25s ease-out;
}
```

### Adding New Components
1. Create component file in `src/components/`
2. Create corresponding CSS file
3. Import and use in pages
4. Follow existing naming conventions

## 📱 Responsive Design

The app is fully responsive with breakpoints:
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to any hosting service
```bash
npm run build
# Upload the build folder to your preferred hosting service
```

## 🔧 Development

### Available Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use CSS modules for styling
- Implement proper error handling
- Add loading states for async operations

## 🎨 Animation Guidelines

### Page Transitions
- Use Framer Motion for smooth page transitions
- Implement staggered animations for lists
- Add hover effects for interactive elements

### Loading States
- Use spinning loaders for async operations
- Implement skeleton screens for content loading
- Add progress bars for file uploads

### Micro-interactions
- Subtle hover effects on buttons and cards
- Smooth focus transitions on form inputs
- Bounce animations for success states

## 🔒 Security

- Mock authentication system for development
- Secure file upload with validation
- Input sanitization for Q&A system
- Proper error handling without exposing sensitive data

## 📈 Performance

- Lazy loading for components
- Optimized images and assets
- Efficient re-renders with React.memo
- Minimal bundle size with tree shaking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Material Design for design inspiration
- Apple Human Interface Guidelines for animation patterns
- Framer Motion for smooth animations
- React community for excellent tooling

---

Built with ❤️ for the legal tech community 