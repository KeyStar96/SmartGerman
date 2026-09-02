import { redirect } from 'next/navigation'

/** Alte Lektionsliste mit kaputten Pfaden – der Einstieg läuft über die Niveau-Kacheln. */
export default async function LessonsOverviewPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  redirect(`/${lang}/dashboard`)
}
