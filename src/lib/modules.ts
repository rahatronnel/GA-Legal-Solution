import {
    Users,
    Settings,
    Book,
    Briefcase,
    FileText,
    GanttChartSquare,
    Landmark,
    Laptop,
    Network,
    Package,
    Shield,
    File,
    Gavel,
    ClipboardList,
  } from 'lucide-react';
  
  export type Module = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  
  export const coreModules: Module[] = [
    { name: 'Module 1', href: '/module-1', icon: FileText },
    { name: 'Module 2', href: '/module-2', icon: Briefcase },
    { name: 'Module 3', href: '/module-3', icon: Landmark },
    { name: 'Module 4', href: '/module-4', icon: GanttChartSquare },
    { name: 'Module 5', href: '/module-5', icon: Shield },
    { name: 'Module 6', href: '/module-6', icon: Book },
    { name: 'Module 7', href: '/module-7', icon: Laptop },
    { name: 'Module 8', href: '/module-8', icon: Network },
    { name: 'Module 9', href: '/module-9', icon: Package },
    { name: 'Module 10', href: '/module-10', icon: File },
    { name: 'Module 11', href: '/module-11', icon: Gavel },
    { name: 'Module 12', href: '/module-12', icon: ClipboardList },
  ];
  
  export const utilityModules: Module[] = [
    { name: 'User Management', href: '/user-management', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];
  