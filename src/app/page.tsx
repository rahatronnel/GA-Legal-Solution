import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center">
       <Card className="w-full">
        <CardHeader>
          <CardTitle>Welcome to GA & Legal Solution</CardTitle>
          <CardDescription>
            This is your internal documentation software. Select a module from the sidebar to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
