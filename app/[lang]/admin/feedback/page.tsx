import { redirect } from 'next/navigation'

/**
 * Alte Lehrer-Ansicht mit reinem Text-Feedback.
 *
 * Die aktive Korrektur-Oberfläche ist `/admin/submissions`: nur dort können
 * Lehrkräfte auch Sprachnachrichten aufnehmen und den zweiten Versuch eines
 * Schülers im Zusammenhang sehen. Zwei parallele Oberflächen haben zu
 * widersprüchlichen Ständen geführt, deshalb leitet diese Route dauerhaft um.
 * Alte Lesezeichen bleiben dadurch funktionsfähig.
 */
export default async function LegacyFeedbackRedirect({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  redirect(`/${lang}/admin/submissions`)
}
