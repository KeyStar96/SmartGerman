"use client";

import { useRef } from "react";
import { Instrument_Serif } from "next/font/google";
import { gsap, useGSAP } from "@/lib/gsap";
import CourseCard from "@/components/ui/CourseCard";

const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
});

interface CoursesProps {
  dictionary: any;
  lang: string;
}

export default function Courses({ dictionary, lang }: CoursesProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    // Header Animation - subtile Fade-in Animation
    if (headerRef.current) {
      gsap.set(headerRef.current, {
        opacity: 0,
        y: 20,
        force3D: true,
      });

      gsap.to(headerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 90%",
          end: "top 60%",
          toggleActions: "play none none none",
          markers: false,
        },
        force3D: true,
      });
    }
  }, { scope: sectionRef });

  const courses = dictionary.sections.courses?.items || [];

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full min-h-[120vh] py-24 pt-40 flex flex-col items-center justify-start overflow-visible bg-transparent"
      style={{ zIndex: 2 }}
    >
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header der Sektion */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-6xl font-medium mb-6 leading-tight text-foreground dark:text-dm-text-main">
            {dictionary.sections.courses?.title_part1}{" "}
            <span className={`${instrumentSerif.className} text-primary-orange`}>
              {dictionary.sections.courses?.title_part2}
            </span>
          </h2>
          <p className="text-lg text-foreground/60 dark:text-dm-text-muted leading-relaxed">
            {dictionary.sections.courses?.intro}
          </p>
        </div>

        {/* Courses Grid */}
        <div 
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch"
        >
          {courses.map((course: any, index: number) => (
            <CourseCard
              key={index}
              level={course.level}
              title={course.title}
              description={course.description}
              price={course.price}
              duration={course.duration}
              color={course.color}
              lang={lang}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

