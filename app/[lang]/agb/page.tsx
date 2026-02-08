import { getDictionary } from "@/lib/dictionary";
import FooterLayout from "@/components/footer/FooterLayout";
import Header from "@/components/layout/Header";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    const dictionary: any = await getDictionary(lang);
    return {
        title: dictionary.agb?.title || "AGB",
        description: dictionary.agb?.title || "AGB",
    };
}

export default async function AGBPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dictionary: any = await getDictionary(lang);

    return (
        <div className="min-h-screen bg-[#050505] text-[#E2D7CE] font-sans selection:bg-[#FF5C00]/30">
            <Header dictionary={dictionary} lang={lang} />

            <main className="container mx-auto px-4 pt-32 pb-16 max-w-4xl relative">
                <div className="mb-8">
                    <a href={`/${lang}`} className="inline-flex items-center text-white/60 hover:text-[#FF5C00] transition-colors gap-2 group">
                        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                        <span className="text-sm font-medium tracking-wide uppercase">{dictionary.registration?.back_home || "Zurück zur Startseite"}</span>
                    </a>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                    {dictionary.agb?.title || "Allgemeine Geschäftsbedingungen"}
                </h1>

                <div className="text-lg text-white/60 mb-12">
                    <p className="font-medium text-white">{dictionary.agb?.school_name}</p>
                    <p>{dictionary.agb?.status_date}</p>
                </div>

                <div className="space-y-12">
                    {dictionary.agb?.sections?.map((section: any, index: number) => (
                        <section key={index} className="space-y-4">
                            <h2 className="text-2xl font-semibold tracking-tight text-white">
                                {section.title}
                            </h2>
                            <div className="space-y-2 text-white/70 leading-relaxed">
                                {section.content.map((paragraph: string, pIndex: number) => (
                                    <p key={pIndex}>{paragraph}</p>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </main>

            <FooterLayout dictionary={dictionary} lang={lang} />
        </div>
    );
}
