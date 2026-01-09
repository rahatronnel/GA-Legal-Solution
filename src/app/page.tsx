
import { AppWrapper } from './app-wrapper';

export default function Home() {
  return (
    <AppWrapper>
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Welcome to GA & Legal Solution</h1>
        <p className="text-muted-foreground">
          This is your internal documentation software. Select a module from the sidebar to get started.
        </p>
      </div>
    </AppWrapper>
  );
}
