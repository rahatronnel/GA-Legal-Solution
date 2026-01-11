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
  Receipt,
} from 'lucide-react';

export type Module = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const coreModules: Module[] = [
  { name: 'Vehicle Mgt.', href: '/vehicle-management', icon: Car },
  { name: 'BillFlow', href: '/billflow', icon: Receipt },
  { name: 'Security Mgt.', href: '/security-management', icon: Shield },
  { name: 'Overseas Visa', href: '/overseas-visa-management', icon: Globe },
  { name: 'BGD Visa', href: '/bgd-visa-management', icon: FileText },
  { name: 'IL,BRL, Hotel', href: '/il-brl-hotel-management', icon: Building },
  { name: 'Air Ticket', href: '/air-ticket-management', icon: Plane },
  { name: 'Expats Apartment', href: '/expats-apartment-management', icon: Home },
  { name: 'Legal Mgt.', href: '/legal-management', icon: Gavel },
  { name: 'Event Mgt.', href: '/event-management', icon: CalendarDays },
  { name: 'Audit Mgt.', href: '/audit-management', icon: ClipboardCheck },
  { name: 'Office Admin', href: '/office-administrative-management', icon: Briefcase },
  { name: 'Others', href: '/others', icon: Archive },
];

export const utilityModules: Module[] = [
  { name: 'User Management', href: '/user-management', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];
