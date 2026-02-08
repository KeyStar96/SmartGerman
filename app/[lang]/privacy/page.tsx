import { getDictionary } from "@/lib/dictionary";
import FooterLayout from "@/components/footer/FooterLayout";
import Header from "@/components/layout/Header";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    const dictionary: any = await getDictionary(lang);
    return {
        title: dictionary.privacy?.title || "Privacy Policy",
        description: dictionary.privacy?.title || "Privacy Policy",
    };
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dictionary: any = await getDictionary(lang);

    return (
        <div className="min-h-screen bg-transparent text-foreground font-sans selection:bg-primary-orange/30">
            <Header dictionary={dictionary} lang={lang} />

            <main className="container mx-auto px-4 pt-32 pb-16 max-w-4xl relative">
                <div className="mb-8">
                    <a href={`/${lang}`} className="inline-flex items-center text-foreground/60 hover:text-primary-orange transition-colors gap-2 group">
                        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                        <span className="text-sm font-medium tracking-wide uppercase">{dictionary.registration?.back_home || "Back"}</span>
                    </a>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
                    {dictionary.privacy?.title || "Datenschutzerklärung"}
                </h1>

                <div className="text-lg text-foreground/60 mb-12">
                    <p>{dictionary.privacy?.status}</p>
                    <p className="mt-4">{dictionary.privacy?.intro}</p>
                </div>

                <div className="space-y-12">
                    {dictionary.privacy?.sections?.map((section: any, index: number) => (
                        <section
                            key={index}
                            className={`space-y-4`}
                        >
                            <h2 className={`text-xl font-semibold tracking-tight text-foreground`}>
                                {section.title}
                            </h2>
                            <div className={`space-y-1 text-foreground/70 leading-relaxed`}>
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
