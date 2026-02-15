'use client';

import { ModuleHeader } from '@/app/components/module-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home } from 'lucide-react';

export default function LocalPurchasePage() {
  return (
    <div className="space-y-6">
      <ModuleHeader />
      <Card>
        <CardHeader>
          <CardTitle>Local Purchase</CardTitle>
          <CardDescription>Manage domestic procurement and purchasing.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center h-96">
            <Home className="h-24 w-24 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">Coming Soon</h3>
            <p className="text-muted-foreground">The Local Purchase module is under construction.</p>
        </CardContent>
      </Card>
    </div>
  );
}
