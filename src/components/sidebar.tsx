import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { coreModules, utilityModules } from '@/lib/modules';

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            GA
            <span className="sr-only">GA & Legal Solution</span>
          </Link>
          {coreModules.map((mod) => (
            <Tooltip key={mod.href}>
              <TooltipTrigger asChild>
                <Link
                  href={mod.href}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <mod.icon className="h-5 w-5" />
                  <span className="sr-only">{mod.name}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{mod.name}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          {utilityModules.map((mod) => (
             <Tooltip key={mod.href}>
             <TooltipTrigger asChild>
               <Link
                 href={mod.href}
                 className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
               >
                 <mod.icon className="h-5 w-5" />
                 <span className="sr-only">{mod.name}</span>
               </Link>
             </TooltipTrigger>
             <TooltipContent side="right">{mod.name}</TooltipContent>
           </Tooltip>
          ))}
        </nav>
      </TooltipProvider>
    </aside>
  );
}
