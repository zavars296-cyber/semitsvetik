export type BrandColor = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'violet';

export interface WorkingHoursRow { days: string; hours: string }

export interface SiteSettings {
  name: string;
  fullName: string;
  tagline: string;
  heroTitle: string;
  heroText: string;
  address: string;
  city: string;
  phones: string[];
  email: string;
  hours: WorkingHoursRow[];
  hoursNote: string;
  instagram: string;
  facebook: string;
  telegram: string;
  viber: string;
  whatsapp: string;
  mapsUrl: string;
  mapsQuery: string;
  directions: string;
  aboutIntro: string;
  aboutHistory: string;
  aboutPhilosophy: string;
  values: { title: string; text: string }[];
  whyUs: { title: string; text: string }[];
  teamText: string;
  birthdayIntro: string;
  birthdayItems: { title: string; text: string }[];
  birthdayConfirmed: boolean;
  seoTitle: string;
  seoDescription: string;
  announcement: string;
}

export interface Program {
  id: string; slug: string; title: string; short: string; description: string;
  age_group: string; schedule_text: string; price_text: string; color: BrandColor;
  image_url: string | null; photos: string[]; is_active: boolean; is_published: boolean; sort_order: number;
}

export interface Teacher {
  id: string; full_name: string; position: string; qualifications: string; bio: string;
  photo_url: string | null; is_published: boolean; sort_order: number;
}

export interface ScheduleItem {
  id: string; program_id: string | null; teacher_id: string | null; weekday: number;
  start_time: string; end_time: string | null; group_name: string; note: string; is_published: boolean;
}

export type PostKind = 'news' | 'event' | 'workshop' | 'announcement';
export interface Post {
  id: string; slug: string; kind: PostKind; title: string; excerpt: string; body: string;
  cover_url: string | null; event_date: string | null; is_published: boolean; published_at: string | null; created_at?: string;
}

export interface GalleryAlbum {
  id: string; slug: string; title: string; category: string; description: string;
  cover_url: string | null; is_published: boolean; sort_order: number;
}
export interface GalleryPhoto {
  id: string; album_id: string | null; url: string; storage_path?: string | null; caption: string;
  children_visible: boolean; consent_confirmed: boolean; is_published: boolean; sort_order: number; created_at?: string;
}

export interface Testimonial { id: string; author: string; text: string; source: string; is_verified: boolean; is_published: boolean }

export interface Content {
  settings: SiteSettings;
  programs: Program[];
  teachers: Teacher[];
  schedule: ScheduleItem[];
  posts: Post[];
  albums: GalleryAlbum[];
  photos: GalleryPhoto[];
  testimonials: Testimonial[];
}

export type StaffRole = 'pending' | 'employee' | 'admin' | 'owner';
export interface Profile {
  id: string; email: string | null; full_name: string; role: StaffRole;
  permissions: Record<string, boolean>; is_active: boolean; created_at: string;
}
