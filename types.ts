

export interface Project {
  id: string;
  title: string;
  description: string;
  seoDescription?: string;
  images: { url: string; type: 'image' | 'video' | 'pdf' | 'raw'; }[];
  techStack: string[];
  liveUrl: string;
  githubUrl?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ServiceTool {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  bgImageUrl?: string;
  linkUrl: string;
  badge?: string;
  order: number;
}

export interface Skill {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'tools' | 'other';
  icon: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
  order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  rating: number;
  text: string;
  avatarUrl?: string;
  createdAt?: number;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  imageUrl: string;
  author: string;
}

export interface LegalPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Report {
  id: string;
  name: string;
  email: string;
  problem: string;
  timestamp: number;
  status: 'new' | 'investigating' | 'resolved';
}

export interface SocialLink {
  id: string;
  name: 'Facebook' | 'Instagram' | 'TikTok' | 'LinkedIn' | 'GitHub';
  url: string;
  enabled: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  credits: number;
}

export interface PaymentRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  creditPackage: { name: string; credits: number; price: number; };
  paymentProofBase64: string;
  status: 'pending' | 'approved' | 'declined';
  timestamp: number;
}


export type PathPage = 'home' | 'about' | 'skills' | 'projects' | 'experience' | 'services' | 'blog' | 'blog-post' | 'contact' | 'login' | 'admin' | 'legal-page' | 'ai-studio' | 'docs' | 'transfer' | 'screenshot-studio' | 'vault' | 'widgets' | 'widget-date-converter' | 'widget-calendar' | 'not-found' | 'user-dashboard' | 'developers' | 'checkout';
