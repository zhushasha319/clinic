import Review from "@/components/molecules/review";
import { testimonialData } from "@/prisma/seed-data/door";

interface PatientTestimonialsProps {
  className?: string;
}

export function PatientTestimonials({ className }: PatientTestimonialsProps) {
  return (
    <section className={className}>
      <div className="container mx-auto px-4 py-12">
        {/* Section Title */}
        <h2 className="text-2xl font-bold text-center mb-8">
          Patient Testimonials
        </h2>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {testimonialData.map((testimonial) => (
            <Review
              key={testimonial.id}
              id={testimonial.id}
              name={testimonial.patientName}
              date={testimonial.reviewDate}
              rating={testimonial.rating}
              testimonial={testimonial.testimonialText}
              imageSrc={testimonial.patientImage}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
