import type { CarouselItem } from "@/components/ui/3-d-coverflow-carousel";
import { portfolioData } from "@/data/portfolio";

const PROJECT_COVER_IMAGES: Record<string, string> = {
  edtech: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
  inventory: "https://images.unsplash.com/photo-1556745755-5d3b4e4597b4?w=800&q=80",
  bytefest: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  "ai-forensics": "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80",
};

export type ProjectCarouselMeta = { projectId: string };

export type CertificationCarouselMeta = { certIndex: number };

export function getProjectCarouselItems(): (CarouselItem & ProjectCarouselMeta)[] {
  return portfolioData.projects.map((project) => ({
    projectId: project.id,
    tag: project.status === "Completed" ? "#Featured" : `#${project.status.replace(/\s+/g, "")}`,
    titleLine1: project.title.split("–")[0]?.trim() ?? project.title,
    titleLine2: project.tech.slice(0, 3).join(" · ").toUpperCase(),
    desc: project.shortDescription,
    img:
      ("coverImage" in project && project.coverImage) ||
      PROJECT_COVER_IMAGES[project.id] ||
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    ctaText: "View Project",
    ctaUrl: project.liveUrl || project.githubUrl || "#",
  }));
}

export function getCertificationCarouselItems(): (CarouselItem & CertificationCarouselMeta)[] {
  return portfolioData.certifications.map((cert, certIndex) => ({
    certIndex,
    tag: cert.date ? `#${cert.date.replace(/\s+/g, "")}` : "#Certified",
    titleLine1: cert.title,
    titleLine2: cert.issuer.toUpperCase(),
    desc: `Issued by ${cert.issuer}`,
    img: cert.image,
    ctaText: cert.link ? "Verify Credential" : "View Details",
    ctaUrl: cert.link || "#",
  }));
}
