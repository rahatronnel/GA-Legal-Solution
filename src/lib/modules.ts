import {
  Users,
  Settings,
  Car,
  Shield,
  Globe,
  FileText,
  Building,
  Plane,
  Home,
  Gavel,
  CalendarDays,
  ClipboardCheck,
  Briefcase,
  Archive,
} from 'lucide-react';

export type Module = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const coreModules: Module[] = [
  { name: 'Vehicle Management', href: '/vehicle-management', icon: Car },
  { name: 'Security Management', href: '/security-management', icon: Shield },
  { name: 'Overseas Visa Management', href: '/overseas-visa-management', icon: Globe },
  { name: 'BGD Visa Management', href: '/bgd-visa-management', icon: FileText },
  { name: 'IL,BRL, Hotel Management', href: '/il-brl-hotel-management', icon: Building },
  { name: 'Air Ticket Management', href: '/air-ticket-management', icon: Plane },
  { name: 'Expats Apartment Management', href: '/expats-apartment-management', icon: Home },
  { name: 'Legal Management', href: '/legal-management', icon: Gavel },
  { name: 'Event Management', href: '/event-management', icon: CalendarDays },
  { name: 'Audit Management', href: '/audit-management', icon: ClipboardCheck },
  { name: 'Office Administrative Management', href: '/office-administrative-management', icon: Briefcase },
  { name: 'Others', href: '/others', icon: Archive },
];

export const utilityModules: Module[] = [
  { name: 'User Management', href: '/user-management', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];
