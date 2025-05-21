# Script Counter UI

A modern, user-friendly dashboard for analyzing website scripts. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Clean, professional interface designed for sales professionals
- Real-time script analysis with visualizations
- Historical analysis tracking
- Detailed script breakdowns
- Exportable reports
- Tagging system for categorizing websites

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- SQLite (included in the project)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/Script-Counter.git
   cd Script-Counter/script-gtm-ui
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the database:

   ```bash
   npx prisma migrate dev
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── analysis/       # Analysis pages
│   └── history/        # History pages
├── components/         # React components
│   ├── ui/            # UI components
│   ├── layout/        # Layout components
│   └── analysis/      # Analysis-specific components
├── lib/               # Utility functions and services
│   ├── db/           # Database utilities
│   └── api/          # API utilities
└── types/            # TypeScript type definitions
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## API Integration

The UI connects to the Script Counter API service. Make sure the API service is running at `http://localhost:3000` before using the UI.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
