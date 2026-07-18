export default function LeadNotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center bg-[#f4f5f1] px-5 py-12 text-[#18201d] sm:px-8">
      <section className="mx-auto w-full max-w-xl border-l-4 border-[#d7a45b] pl-5 sm:pl-7">
        <p className="text-sm font-semibold text-[#8a5b1f]">
          Conversation not found
        </p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-[#102e25] sm:text-3xl">
          This inquiry link is not available.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#59665f]">
          Check that you opened the complete link provided after submitting
          the inquiry.
        </p>
      </section>
    </main>
  );
}
