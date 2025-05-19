# AeroFoilPro - Airfoil Database

A modern web application for searching, comparing, and analyzing airfoils. Built with Astro.js and Tailwind CSS.

## Features

- 🔍 Search and filter airfoils by name, camber, thickness, and applications
- 📊 Compare up to 3 airfoils side by side
- 📈 View detailed performance metrics and visualizations
- 💾 Save favorite airfoils and track recently viewed
- 📱 Responsive design for all devices

## Tech Stack

- [Astro.js](https://astro.build/) - Static site generator
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) - Airfoil visualization

## Project Structure

```
src/
├── components/
│   ├── airfoil/
│   │   ├── AirfoilCard.astro
│   │   └── AirfoilGrid.astro
│   ├── comparison/
│   │   ├── ComparisonBanner.astro
│   │   └── ComparisonModal.astro
│   ├── layout/
│   │   ├── Header.astro
│   │   └── Sidebar.astro
│   └── search/
│       └── SearchBar.astro
├── layouts/
│   └── Layout.astro
├── pages/
│   └── index.astro
├── scripts/
│   ├── app.js
│   ├── comparison.js
│   ├── search.js
│   └── storage.js
└── types.ts
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aerofoilpro.git
   cd aerofoilpro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [NACA Airfoil Database](https://m-selig.ae.illinois.edu/ads/coord_database.html) for airfoil data
- [UI Components](https://tailwindui.com/) for design inspiration 
