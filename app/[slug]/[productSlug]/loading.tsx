export default function ProductLoading() {
  return (
    <main>
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="h-4 w-40 bg-border rounded animate-skeleton" />
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-square bg-border rounded-2xl animate-skeleton" />
          <div className="space-y-4">
            <div className="h-3 w-20 bg-border rounded animate-skeleton" />
            <div className="h-8 w-3/4 bg-border rounded animate-skeleton" />
            <div className="h-6 w-32 bg-border rounded animate-skeleton" />
            <div className="h-20 w-full bg-border rounded animate-skeleton" />
            <div className="h-12 w-full bg-border rounded animate-skeleton" />
          </div>
        </div>
      </div>
    </main>
  )
}