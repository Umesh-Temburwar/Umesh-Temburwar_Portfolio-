// TODO: Replace with your actual URLs, emails, and file paths. 
// Look for "TODO:" comments throughout this file.

export const profileLinks: { name: 'LinkedIn' | 'GitHub' | 'LeetCode' | 'HackerRank' | 'GeeksforGeeks' | 'Instagram' | 'Email'; url: string }[] = [
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/umesh-temburwar-673555373/' }, // TODO: add my real profile URL
  { name: 'GitHub', url: 'https://github.com/Umesh-Temburwar' },
  { name: 'Instagram', url: 'https://www.instagram.com/umesh_temburwar' },
  { name: 'Email', url: 'mailto:umeshtemburwar2002@gmail.com' },
  { name: 'LeetCode', url: '' }, // TODO: add my real profile URL
  { name: 'HackerRank', url: '' }, // TODO: add my real profile URL
  { name: 'GeeksforGeeks', url: '' }, // TODO: add my real profile URL
];

export const portfolioData = {
  header: {
    logo: "UMESH TEMBURWAR",
    navLinks: [
      { name: "Projects", href: "/projects" },
      { name: "Resume", href: "/resume" },
      { name: "Contact", href: "/contact" },
    ]
  },
  hero: {
    name: "Umesh Temburwar",
    title: "Computer Science Engineer | Full-Stack Developer | React · Node.js · TypeScript",
    role: "Computer Science Engineer | Full-Stack Developer",
    subtitle: "B.Tech CSE Student (2022-2026)",
    description: "I am a fresh, passionate developer seeking software engineering roles, with a strong interest in full-stack web development, Python, AI automation, and cybersecurity.",
    heroStack: ["React", "Node.js", "TypeScript", "MongoDB", "PostgreSQL"],
    idCard: {
      line1: "B.Tech CSE, 2022-2026",
      line2: "Ambajogai, Maharashtra"
    },
    // TODO: Insert your actual GitHub URL here
    githubUrl: "https://github.com/Umesh-Temburwar",
    // TODO: Insert your actual LinkedIn URL here
    linkedinUrl: "https://www.linkedin.com/in/umesh-temburwar-673555373/",
    // Profile photo (Used for BOTH the Hero section and the dynamic NavBar logo)
    // To update your photo and logo, simply replace the file in the public/ folder or change this path.
    profilePhoto: "/umesh.jpg",
  },
  about: {
    title: "About Me",
    content: "I am a Computer Science Engineering student with a solid foundation in building full-stack web applications. My development journey revolves around continuous learning in databases, modern web development, and emerging AI tools. I enjoy translating complex problems into clean, scalable code and am excited to bring my technical skills to professional software engineering roles."
  },
  projects: [
    {
      id: "edtech",
      title: "EdTech Learning Platform",
      shortDescription: "A full-stack learning platform with roles for students, instructors, and admins.",
      description: "A comprehensive e-learning solution featuring course browsing, quizzes, assignments, certificates, and progress tracking. Includes distinct role-based React dashboards for students, instructors, and administrators to seamlessly manage content and learning goals.",
      tech: ["React.js", "Node.js", "Express.js", "Supabase", "PostgreSQL", "REST APIs"],
      status: "Completed",
      // TODO: Add GitHub URL for EdTech platform
      githubUrl: "https://github.com/Umesh-Temburwar/Ed-tech-platform",
      // TODO: Add Live Demo URL if available
      liveUrl: "https://edtechacademy.vercel.app",
      // TODO: Add an array of screenshot paths here
      screenshots: [],
      coverImage: "/EdTech Learning Platform.png",
    },
    {
      id: "inventory",
      title: "Inventory Management System",
      shortDescription: "A full-stack web app for product records and stock tracking.",
      description: "A robust inventory management application allowing users to track stock levels and manage product records efficiently. Implemented robust form validation, dynamic routing, and a clean, responsive user interface.",
      tech: ["React", "TypeScript", "Vite", "Tailwind CSS", "Formik", "Yup", "Node.js", "Express", "MongoDB"],
      status: "Completed",
      // TODO: Add GitHub URL for Inventory system
      githubUrl: "",
      // TODO: Add Live Demo URL if available
      liveUrl: "",
      // TODO: Add an array of screenshot paths here
      screenshots: [],
      coverImage: "/inventory-mockup.jpg",
    },
    {
      id: "bytefest",
      title: "ByteFest 2K25 Event Website",
      shortDescription: "Official website built for a technical fest in Ambajogai.",
      description: "Developed and managed the official website for the ByteFest technical festival. Handled participant registrations, data management, and ensured smooth site performance and technical support throughout the event.",
      // TODO: Confirm the exact tech stack used for ByteFest
      tech: ["React.js", "Tailwind CSS"],
      status: "Completed",
      // TODO: Add GitHub URL for ByteFest
      githubUrl: "https://github.com/Umesh-Temburwar/ByteFest2K25-Official_Website",
      // TODO: Add Live Demo URL if available
      liveUrl: "https://bytefest2k25.vercel.app",
      // TODO: Add an array of screenshot paths here
      screenshots: [],
      coverImage: "/bytefest2k25.png",
    },
    {
      id: "ai-forensics",
      title: "AI-Powered Digital Forensics Automation",
      shortDescription: "Automated digital forensics tool powered by AI.",
      description: "An experimental initiative aimed at automating routine digital forensics tasks using AI, increasing efficiency and accuracy in data analysis.",
      tech: ["Python", "AI", "Cybersecurity"],
      status: "Experimental / Planned",
      githubUrl: "",
      liveUrl: "",
      screenshots: [],
      coverImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80",
    }
  ],
  skills: {
    core: [
      { category: "Languages", items: ["C", "C++", "Python", "JavaScript", "TypeScript"] },
      { category: "Frontend", items: ["React.js", "HTML", "CSS", "Tailwind CSS"] },
      { category: "Backend", items: ["Node.js", "Express.js", "REST APIs", "Authentication"] },
      { category: "Databases", items: ["SQL", "PostgreSQL","MongoDB", "Supabase", "Firebase"] },
      { category: "Tools", items: ["Git", "GitHub", "VS Code", "Postman","Linux","Docker"] },
      { category: "CS Fundamentals", items: ["Data Structures and Algorithms", "OOP", "DBMS", "Operating Systems", "Computer Networks"] }
    ],
    learning: [
      "AI automation", "Cybersecurity", "Linux", "Cloud Computing"
      // TODO: If you are comfortable explaining these in an interview, uncomment them:
      // "Next.js", "Flask", "MySQL"
    ]
  },
  experience: [
    {
      role: "Project Coordinator & Core Tech Member",
      company: "ByteFest",
      location: "Ambajogai, Maharashtra",
      duration: "May 2025 - June 2025",
      description: "Served as the primary website developer, data manager, and core organizer. Handled participant registrations, technical support, and site maintenance during the festival.",
      // TODO: If you have accurate attendee/visitor numbers, add them here
      highlights: [
        "Built and maintained the event website.",
        "Managed participant registration data.",
        "Provided live technical support during the fest."
      ]
    }
  ],
  education: [
    {
      degree: "B.Tech in Computer Science and Engineering",
      institution: "M.B.E. Society's College of Engineering",
      location: "Ambajogai, Maharashtra",
      duration: "2022 - 2026",
      // TODO: Add your CGPA/percentage if you want to display it
      cgpa: ""
    }
  ],
  certifications: [
    {
      title: "Data Engineering on AWS – Foundations",
      issuer: "AWS Training & Certification",
      date: "December 03, 2025",
      link: "/DATA Engineering ON AWS Foundations.pdf",
      image: "/DATA Engineering ON AWS Foundations.png",
      credentialType: "Training Completion Certificate",
      topics: ["Data pipelines", "ETL/ELT", "Data lakes", "Data warehousing", "Amazon S3", "AWS Glue", "AWS Lambda", "Amazon Redshift", "Amazon Athena"],
      hasPdf: true
    },
    {
      title: "Fundamentals of Machine Learning and Artificial Intelligence",
      issuer: "AWS Training & Certification",
      date: "November 17, 2025",
      link: "/Foundation of Macine Learning and Artificial Intelligence.pdf",
      image: "/Foundation of Macine Learning and Artificial Intelligence.png",
      credentialType: "Training Completion Certificate",
      topics: ["Fundamentals of Machine Learning", "Artificial Intelligence", "AWS-based AI/ML learning"],
      hasPdf: true
    },
    {
      title: "JavaScript Algorithms and Data Structures",
      issuer: "freeCodeCamp",
      date: "2024",
      link: "",
      image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80",
      hasPdf: false
    },
    {
      title: "Responsive Web Design",
      issuer: "freeCodeCamp",
      date: "2023",
      link: "",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
      hasPdf: false
    },
    {
      title: "Introduction to Cybersecurity",
      issuer: "Cisco Networking Academy",
      date: "2024",
      link: "",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80",
      hasPdf: false
    },
  ] as Array<{ title: string; issuer: string; date: string; link: string; image: string; credentialType?: string; topics?: string[]; hasPdf?: boolean }>,
  resume: {
    // TODO: Place your PDF file in the public/resume/ folder and update this path if different
    pdfUrl: "/Umesh-Temburwar-OCT.pdf",
    exists: true // TODO: Set this to true when the resume file is actually placed in the folder
  },
  contact: {
    email: "umeshtemburwar2002@gmail.com",
    phone: "+91 8856087984",
    message: "Have a project, collaboration, or opportunity in mind? Send me a message."
  }
};
