import type { Metadata } from "next";

import { InquiryForm } from "@/features/inquiry/inquiry-form";

export const metadata: Metadata = {
  title: "Property inquiry",
};

interface InquiryPageProps {
  searchParams: Promise<{
    propertyId?: string | string[];
  }>;
}

export default async function InquiryPage({
  searchParams,
}: InquiryPageProps) {
  const params = await searchParams;

  // A property picker is blocked until the backend exposes a public active-properties endpoint.
  const propertyId =
    typeof params.propertyId === "string" ? params.propertyId.trim() : "";

  return <InquiryForm propertyId={propertyId} />;
}
