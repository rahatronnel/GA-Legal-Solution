import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// A simple function to capitalize the first letter of a string
function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export default function ModulePage({ params }: { params: { module: string } }) {
    const moduleName = params.module.split('-').map(capitalizeFirstLetter).join(' ');
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
