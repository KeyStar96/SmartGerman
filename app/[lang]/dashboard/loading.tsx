export default function DashboardLoading() {
  // Wir erzeugen 6 Platzhalter-Karten für A1.1 bis B1.2
  const skeletonCards = Array.from({ length: 6 })

  return (
    <div className="space-y-8 animate-pulse">
      {/* Skeleton für den Titel und Untertitel */}
      <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col items-center">
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-3/4 mb-6"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-xl w-full max-w-md"></div>
      </div>

      {/* Skeleton für das Karten-Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skeletonCards.map((_, i) => (
          <div 
            key={i} 
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 h-[280px] flex flex-col justify-between"
          >
            {/* Oberer Bereich mit Icon-Platzhalter und Titel */}
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800"></div>
              <div className="flex flex-col items-end gap-2">
                <div className="w-16 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                <div className="w-24 h-4 bg-slate-100 dark:bg-slate-800 rounded-md"></div>
              </div>
            </div>

            {/* Mittlerer Text-Bereich */}
            <div className="space-y-3 mb-6">
              <div className="w-3/4 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
              <div className="w-full h-4 bg-slate-50 dark:bg-slate-800/50 rounded-md"></div>
              <div className="w-5/6 h-4 bg-slate-50 dark:bg-slate-800/50 rounded-md"></div>
            </div>

            {/* Unterer Button-Platzhalter */}
            <div className="flex items-center gap-2">
              <div className="w-24 h-5 bg-slate-100 dark:bg-slate-800 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
