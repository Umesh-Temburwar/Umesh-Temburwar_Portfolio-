# Umesh Temburwar — Developer Portfolio

Welcome to my personal developer portfolio! This repository contains the source code for my portfolio website, built to showcase my projects, technical skills, experience, and certifications. The site features a modern, responsive design with smooth animations and interactive components.

## Features

- **Responsive Multi-Page Layout**: A fast, client-side routed architecture with dedicated pages for Projects, Resume, and Contact.
- **Hero & About Sections**: An engaging animated hero header and detailed about me section.
- **Interactive UI Components**: Includes smooth scroll navigation, a 3D Coverflow carousel, and a Gateway Flow canvas background.
- **Technical Skills & Experience**: Clean, categorized displays of languages, frameworks, and professional history.
- **Education & Certifications**: Dedicated sections for academic achievements and verified certificates.
- **Integrated Resume Viewer**: A customized, full-screen PDF viewer embedded directly in the browser (without native UI clutter).
- **Working Contact Form**: Fully functional email contact form powered by EmailJS.
- **Social Connectivity**: Quick links to my GitHub, LinkedIn, Instagram, and direct Email.

## Tech Stack

This project is built using modern web technologies:

- **React 18** - Core UI framework
- **Vite** - Lightning-fast build tool and development server
- **TypeScript** - Static typing for robust code
- **Tailwind CSS** - Utility-first styling and custom design system
- **React Router DOM** - Client-side routing
- **Framer Motion** - Fluid animations and transitions
- **EmailJS** - Client-side email sending infrastructure
- **Lucide React & React Icons** - Iconography

## Project Structure

```
umesh-portfolio/
├── public/                 # Static assets (images, PDF resume, SVG icons)
├── src/
│   ├── assets/             # Bundled assets
│   ├── components/         # Reusable UI components (NavBar, Footer, Reveal, etc.)
│   │   ├── icons/          # Brand-specific icons
│   │   └── ui/             # Complex interactive components (Gateway Flow, 3D Carousel)
│   ├── data/               # Centralized data store (portfolio.ts)
│   ├── hooks/              # Custom React hooks (useInView, etc.)
│   ├── lib/                # Utility functions and shared data
│   ├── pages/              # Page components (Home, Projects, Resume, Contact)
│   ├── App.tsx             # Main application orchestrator and routing
│   ├── index.css           # Global Tailwind and custom CSS
│   └── main.tsx            # Application entry point
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## Getting Started

To run this project locally, follow these steps:

1. **Clone the repository**
   ```bash
   git clone https://github.com/Umesh-Temburwar/umesh-portfolio.git
   cd umesh-portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root directory based on `.env.example`. This is required for the contact form to work.
   ```env
   VITE_EMAILJS_SERVICE_ID=your_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ```
   *(Note: Obtain these keys by creating a free account at [EmailJS](https://www.emailjs.com/).)*

4. **Start the development server**
   ```bash
   npm run dev
   ```
   Open your browser to the local server address (usually `http://localhost:5173`).

5. **Create a production build**
   ```bash
   npm run build
   ```

## Configuration

All portfolio content is centralized in a single file to make updating easy.

1. **Profile Data**: Open `src/data/portfolio.ts` to update your name, title, bio, education, experience, and projects.
2. **Social Links**: Update your GitHub, LinkedIn, and Instagram URLs in `src/data/portfolio.ts` and `src/App.tsx`.
3. **Resume File**: Place your PDF resume in the `public/` folder (e.g., `UMESH-TEMBURWAR_resume.pdf`) and ensure the filename matches the `pdfUrl` path defined in `src/data/portfolio.ts`.
4. **Profile Image**: Replace `public/umesh.jpg` with your own profile photo.

## Resume Viewer

The `/resume` route features a custom-built, full-screen PDF viewer. It uses a borderless HTML `<object>` tag with URL parameters (`#toolbar=0&navpanes=0`) to hide native browser UI controls, providing a clean, distraction-free reading experience that matches the portfolio's aesthetic. A fallback download button is provided below the viewer.

## Deployment

This Vite project is optimized for deployment on [Vercel](https://vercel.com).

1. Push your code to your GitHub repository.
2. Go to Vercel and create a "New Project".
3. Import your GitHub repository.
4. **Important**: Add your EmailJS environment variables (`VITE_EMAILJS_SERVICE_ID`, etc.) in the Vercel project settings before deploying.
5. Deploy. Vercel will automatically detect Vite and run `npm run build`, serving the `dist/` directory.

*(Live deployment URL: Coming Soon)*

## Security Notes

- **Credentials**: Real environment variables (such as EmailJS keys) should never be hardcoded into the source files or committed to Git. They are securely handled via the `.env.local` file, which is excluded from version control via `.gitignore`.
- **Public Keys**: Note that Vite requires client-side variables to be prefixed with `VITE_`. The EmailJS Public Key is technically exposed to the browser to send emails, which is expected behavior for EmailJS.

## Contact

- **Email**: [umeshtemburwar2002@gmail.com](mailto:umeshtemburwar2002@gmail.com)
- **LinkedIn**: [Connect with me professionally](https://www.linkedin.com/in/umesh-temburwar-673555373/)
- **GitHub**: [Check out my code and projects](https://github.com/Umesh-Temburwar)