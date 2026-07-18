import Link from "next/link";

export default function BookingNotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center bg-[#f4f5f1] px-5 py-12 text-[#18201d] sm:px-8">
      <section className="mx-auto w-full max-w-xl border-l-4 border-[#d7a45b] pl-5 sm:pl-7">
        <p className="text-sm font-semibold text-[#8a5b1f]">
          Booking link unavailable
        </p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight break-words text-[#102e25] sm:text-3xl">
          This viewing link could not be found.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#59665f]">
          Check that you opened the complete link provided during screening.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 max-w-full items-center text-sm font-semibold break-words text-[#315e4e] underline decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d97a54]"
          href="/inquiry"
        >
          Return to inquiry
        </Link>
      </section>
    </main>
  );
}
