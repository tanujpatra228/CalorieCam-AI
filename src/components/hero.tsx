export default function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <h1 className="sr-only">CalorieCam AI - Instant Macro Tracking</h1>
      <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
        Instantly know your{" "}
        <span className="font-bold hover:underline">
          macros
        </span>{" "}
        the moment you{" "}
        <span className="font-bold hover:underline">
          capture
        </span>{" "}
        your meal.
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-4 md:my-8" />
    </div>
  );
}
