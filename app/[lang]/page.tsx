import { type Metadata } from "next";
import dynamic from "next/dynamic";
import Hero from "@/components/sections/Hero";
import ScienceSection from "@/components/sections/ScienceSection";
import { getDictionary } from "@/lib/dictionary";
import Header from "@/components/layout/Header";
import { getCourses } from "@/app/actions/get-courses"; // Use Server Action

const WhyUsBento = dynamic(() => import("@/components/sections/WhyUsBento"));
const AboutContainer = dynamic(() => import("@/components/sections/About/AboutContainer"));
const Courses = dynamic(() => import("@/components/sections/Courses"));
const TimetableSection = dynamic(() => import("@/components/sections/Timetable/TimetableSection"));
const LocationSection = dynamic(() => import("@/components/sections/Location/LocationSection").then(mod => mod.LocationSection));
import FooterLayout from "@/components/footer/FooterLayout";

export async function generateMetadata({
  params
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  const baseUrl = "https://smartgerman.com";

  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description,
    openGraph: {
      title: dictionary.meta.title,
      description: dictionary.meta.description,
      url: `${baseUrl}/${lang}`,
      siteName: "SmartGerman",
      type: "website",
      locale: lang,
    },
    alternates: {
      canonical: `${baseUrl}/${lang}`,
      languages: {
        de: `${baseUrl}/de`,
        en: `${baseUrl}/en`,
        uk: `${baseUrl}/uk`,
        ru: `${baseUrl}/ru`,
        tr: `${baseUrl}/tu`, // Mapping standard 'tr' code to our '/tu' route
      },
    }
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  const courses = await getCourses();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LanguageSchool",
    "name": "SmartGerman",
    "description": dictionary.meta.description,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Vahrenwalder Str.",
      "addressLocality": "Hannover",
      "addressCountry": "DE"
    },
    "openingHours": "Mo-Fr 09:00-18:00",
    "priceRange": "FROM 2.50€",
    "offers": courses.map(course => ({
      "@type": "Offer",
      "name": course.id,
      "price": course.price,
      "priceCurrency": "EUR",
      "category": course.type
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header lang={lang} dictionary={dictionary} />

      <main className="w-full bg-transparent">
        <div className="relative w-full pt-28">
          <Hero dictionary={dictionary} lang={lang} />
          <ScienceSection dictionary={dictionary} />
          <AboutContainer dictionary={dictionary} />
          <WhyUsBento dictionary={dictionary} />
          <Courses dictionary={dictionary} courses={courses} />
          <TimetableSection dictionary={dictionary} courses={courses} />
          <LocationSection dictionary={dictionary} />
        </div>
      </main>

      <FooterLayout dictionary={dictionary} lang={lang} />
    </>
  );
}