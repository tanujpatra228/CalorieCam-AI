import { CameraCapture } from "@/components/camera/camera-capture";
import Hero from "@/components/hero";

export default async function Home() {
  return (
    <>
      <Hero />
      <main className="flex-1 flex flex-col gap-6 px-4">
        <h2 className="font-medium text-xl mb-2">Start Tracking</h2>
        <CameraCapture />
      </main>
    </>
  );
}
