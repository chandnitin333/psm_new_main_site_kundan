// Curated icon set shared by CMS list items (login features, etc.).
// Stored value in DB = the icon NAME (key below). Keep this list in sync with
// the admin's src/utils/cmsIcons.tsx so the same names render identically.
import {
  Landmark, Building2, Home, FileText, FileBarChart, ClipboardList,
  ShieldCheck, Lock, Users, User, Phone, Mail, MapPin, Settings,
  BookOpen, Award, Heart, TrendingUp, Target, Lightbulb, Rocket,
  CheckCircle2, Database, Receipt, Banknote, Wallet, Calendar, Bell,
  Star, Globe, Droplet, Zap,
  Facebook, Twitter, Instagram, Linkedin, Youtube, Send, ExternalLink, Link2,
  type LucideIcon,
} from 'lucide-react';

export const CMS_ICONS: Record<string, LucideIcon> = {
  Landmark, Building2, Home, FileText, FileBarChart, ClipboardList,
  ShieldCheck, Lock, Users, User, Phone, Mail, MapPin, Settings,
  BookOpen, Award, Heart, TrendingUp, Target, Lightbulb, Rocket,
  CheckCircle2, Database, Receipt, Banknote, Wallet, Calendar, Bell,
  Star, Globe, Droplet, Zap,
  Facebook, Twitter, Instagram, Linkedin, Youtube, Send, ExternalLink, Link2,
};

export const CMS_ICON_NAMES = Object.keys(CMS_ICONS);

export const getCmsIcon = (name?: string | null): LucideIcon | null =>
  (name && CMS_ICONS[name]) || null;
