import Image from "next/image";
import { bannerImageData } from "@/db/door";

interface DynamicBannerProps {
  className?: string;
}

export function DynamicBanner({ className }: DynamicBannerProps) {
  const banner = bannerImageData[0];

  return (
    <section className={className}>
      <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px]">
        {/* Banner Image */}
        <Image
          src={banner.imageUrl}
          alt={banner.name}
          fill
          priority
          className="object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
            Welcome to Highland Medical Center
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-center max-w-2xl">
            Excellence in Healthcare, Committed to Your Well-being
          </p>
        </div>
      </div>
    </section>
  );
}
