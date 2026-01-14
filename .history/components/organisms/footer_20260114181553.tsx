import { Mail, MapPin, Phone } from "lucide-react";
import { App_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="w-full bg-[#0F131D] text-white py-12">
      <div className="max-w-[1440px] container mx-auto px-6 md:px-8">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">{App_NAME}</h3>
            <p className="text-sm text-gray-400">
              Excellence in Healthcare, Committed to Your Well-being
            </p>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Contact Us</h3>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0" />
                <span>(555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@highland.med</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>123 Medical Center Dr, Highland, CA 92346</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-16 pt-8  text-center text-sm text-gray-500">
          &copy; 2025 {App_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
