import { getAdminStats } from '@/app/actions/admin'
import Link from 'next/link'
import { Users, Unlock, Mic, ArrowRight, LayoutDashboard, PlusCircle } from 'lucide-react'

export default async function AdminDashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const stats = await getAdminStats()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Willkommen im Lehrer-Bereich</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Hier hast du den vollen Überblick über alle Schüler, deren Fortschritte und die Kursinhalte.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Registrierte Schüler</h3>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users size={24} />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 dark:text-white">{stats.studentCount}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Freigeschaltete Nutzer</h3>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Unlock size={24} />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 dark:text-white">{stats.activatedCount}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5C00] rounded-full blur-[60px] opacity-10 transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Offene Korrekturen</h3>
            <div className="h-12 w-12 rounded-2xl bg-[#FF5C00]/10 flex items-center justify-center text-[#FF5C00]">
              <Mic size={24} />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 dark:text-white relative z-10">{stats.pendingSubmissions}</div>
          {stats.pendingSubmissions > 0 && (
            <Link href={`/${lang}/admin/submissions`} className="mt-4 flex items-center gap-2 text-sm font-bold text-[#FF5C00] hover:text-[#e05200] relative z-10">
              Jetzt korrigieren <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Schnellzugriff & CMS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href={`/${lang}/admin/students`} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#FF5C00] dark:hover:border-[#FF5C00] transition-colors">
            <Users className="text-slate-400 group-hover:text-[#FF5C00] transition-colors mb-3" size={32} />
            <h3 className="font-bold text-slate-900 dark:text-white">Nutzerverwaltung</h3>
            <p className="text-sm text-slate-500 mt-1">Rollen & Sprachniveaus freigeben</p>
          </Link>
          <Link href={`/${lang}/admin/content/vocabulary`} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#FF5C00] dark:hover:border-[#FF5C00] transition-colors">
            <LayoutDashboard className="text-slate-400 group-hover:text-[#FF5C00] transition-colors mb-3" size={32} />
            <h3 className="font-bold text-slate-900 dark:text-white">Vokabeln</h3>
            <p className="text-sm text-slate-500 mt-1">Lektionen & Karten anlegen</p>
          </Link>
          <Link href={`/${lang}/admin/content/exercises`} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#FF5C00] dark:hover:border-[#FF5C00] transition-colors">
            <PlusCircle className="text-slate-400 group-hover:text-[#FF5C00] transition-colors mb-3" size={32} />
            <h3 className="font-bold text-slate-900 dark:text-white">Übungen</h3>
            <p className="text-sm text-slate-500 mt-1">Grammatik & Lückentexte</p>
          </Link>
          <Link href={`/${lang}/admin/content/videos`} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#FF5C00] dark:hover:border-[#FF5C00] transition-colors">
            <Mic className="text-slate-400 group-hover:text-[#FF5C00] transition-colors mb-3" size={32} />
            <h3 className="font-bold text-slate-900 dark:text-white">Videos</h3>
            <p className="text-sm text-slate-500 mt-1">Video-Lektionen verwalten</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
