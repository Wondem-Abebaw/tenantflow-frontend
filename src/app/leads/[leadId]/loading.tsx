export default function LeadLoading() {
  return (
    <main className="min-h-[100dvh] bg-[#f4f5f1] text-[#18201d]">
      <header className="border-b border-[#cbd1c9] bg-[#fbfcf9] px-5 py-4 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#174c3b]">TenantFlow</p>
            <p className="text-xs text-[#68756f]">Rental screening</p>
          </div>
          <span className="h-8 w-36 animate-pulse rounded-[6px] bg-[#dfe5e0]" />
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-7xl lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="h-36 animate-pulse bg-[#274c43] lg:min-h-[calc(100dvh-69px)]" />
        <section className="flex min-h-[calc(100dvh-69px)] flex-col bg-[#fbfcf9]">
          <div className="border-b border-[#d9ddd7] px-5 py-5 sm:px-8">
            <div className="h-6 w-52 animate-pulse rounded-[4px] bg-[#dfe5e0]" />
          </div>
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:px-8 sm:py-8">
            <div className="h-20 w-4/5 animate-pulse rounded-[8px] bg-[#e5e9e5]" />
            <div className="ml-auto h-16 w-3/5 animate-pulse rounded-[8px] bg-[#c8d8d0]" />
          </div>
          <div className="border-t border-[#cbd1c9] px-4 py-5 sm:px-8">
            <div className="mx-auto h-24 w-full max-w-3xl animate-pulse rounded-[6px] bg-[#e5e9e5]" />
          </div>
        </section>
      </div>
    </main>
  );
}
