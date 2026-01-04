import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { notFound } from 'next/navigation';
import { coreModules, utilityModules } from "@/lib/modules";

// A simple function to capitalize the first letter of a string
function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export default function ModulePage({ params }: { params: { module: string } }) {
    const allModules = [...coreModules, ...utilityModules];
    const currentModule = allModules.find(mod => mod.href === `/${params.module}`);

    if (!currentModule) {
        notFound();
    }

    const moduleName = currentModule.name;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{moduleName}</CardTitle>
        <CardDescription>
          This is the page for the {moduleName} module. You can start building its specific functionality here.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
