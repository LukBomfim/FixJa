export interface Provider {
  id: string;
  name: string;
  email: string;
  service: string;
  phone: string;
  bio?: string;
  rating?: number;
  avatarUrl?: string;
}