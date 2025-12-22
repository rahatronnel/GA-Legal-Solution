import { Building, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center gap-2 font-bold mr-6">
          <Building className="h-6 w-6 text-primary" />
          <span className="text-lg">RealEstate Vision</span>
        </Link>
        <nav className="flex items-center space-x-4 lg:space-x-6">
            <Button asChild>
                <Link href="/add-property">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Property
                </Link>
            </Button>
        </nav>
      </div>
    </header>
  );
}
