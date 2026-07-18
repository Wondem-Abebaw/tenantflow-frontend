export default function BookingLoading() {
  return (
    <main className="min-h-[100dvh] bg-[#f4f5f1] text-[#18201d]">
      <header className="border-b border-[#cbd1c9] bg-[#fbfcf9] px-5 py-4 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#174c3b]">TenantFlow</p>
            <p className="text-xs text-[#68756f]">Viewing booking</p>
          </div>
          <span className="h-8 w-36 animate-pulse rounded-[6px] bg-[#dfe5e0]" />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="h-40 animate-pulse bg-[#274c43] lg:min-h-[calc(100dvh-69px)]" />
        <section className="bg-[#fbfcf9] px-5 py-8 sm:px-8 sm:py-10 lg:min-h-[calc(100dvh-69px)] lg:px-12 lg:py-12">
          <div className="mx-auto w-full max-w-3xl">
            <div className="h-5 w-32 animate-pulse rounded-[4px] bg-[#ead8d0]" />
            <div className="mt-4 h-10 w-full max-w-md animate-pulse rounded-[6px] bg-[#dfe5e0]" />
            <div className="mt-7 h-20 animate-pulse border-y border-[#cbd1c9] bg-[#f1f3f0]" />
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <span
                  className="h-12 animate-pulse rounded-[6px] bg-[#e2e7e2]"
                  key={index}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
