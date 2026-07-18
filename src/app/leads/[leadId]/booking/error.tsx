"use client";

interface BookingErrorProps {
  reset: () => void;
}

export default function BookingError({ reset }: BookingErrorProps) {
  return (
    <main className="flex min-h-[100dvh] items-center bg-[#f4f5f1] px-5 py-12 text-[#18201d] sm:px-8">
      <section className="mx-auto w-full max-w-xl border-l-4 border-[#b34f32] pl-5 sm:pl-7">
        <p className="text-sm font-semibold text-[#b34f32]">
          Viewing availability unavailable
        </p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight break-words text-[#102e25] sm:text-3xl">
          The booking page could not be loaded.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#59665f]">
          Check your connection and try loading the available times again.
        </p>
        <button
          className="mt-6 min-h-11 max-w-full rounded-[6px] bg-[#174c3b] px-5 py-2.5 text-sm font-semibold break-words text-white hover:bg-[#10382b] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54]"
          type="button"
          onClick={reset}
        >
          Try again
        </button>
      </section>
    </main>
  );
}
