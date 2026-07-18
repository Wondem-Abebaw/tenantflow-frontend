import type { PetPolicy } from "@/lib/api/types";

const monthlyRentFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const PET_POLICY_LABELS: Readonly<Record<PetPolicy, string>> = {
  NO_PETS: "No pets",
  CATS_ONLY: "Cats only",
  DOGS_ONLY: "Dogs only",
  CATS_AND_DOGS: "Cats and dogs",
  CASE_BY_CASE: "Considered case by case",
};

export function formatMonthlyRent(monthlyRent: number): string {
  return `${monthlyRentFormatter.format(monthlyRent)} per month`;
}

export function formatBedrooms(bedrooms: number): string {
  if (bedrooms === 0) {
    return "Studio";
  }

  return `${bedrooms} ${bedrooms === 1 ? "bedroom" : "bedrooms"}`;
}

export function formatPetPolicy(petPolicy: PetPolicy): string {
  return PET_POLICY_LABELS[petPolicy];
}
