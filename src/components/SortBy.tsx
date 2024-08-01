"use client";

import { useQueryParams } from "@/hooks/useQueryParams";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";

const sortingOptions = [
  { value: "price-asc", label: "Sort by price(asc)" },
  { value: "price-desc", label: "Sort by price(desc)" },
  { value: "created_at-asc", label: "Sort by created at(asc)" },
  { value: "created_at-desc", label: "Sort by created at(desc)" },
  { value: "rating-asc", label: "Sort by rating (asc)" },
  { value: "rating-desc", label: "Sort by rating (desc)" },
];

function SortBy() {
  const router = useRouter();
  const searchParams = useQueryParams();
  const [selectedOption, setSelectedOption] = useState(
    () => searchParams.get("sortBy") || ""
  );

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    // console.log(e.target.value);
    const selectedVal = e.target.value;
    if (!selectedVal) {
      searchParams.delete("sortBy");
      setSelectedOption("");
      router.push(`/products?${searchParams.toString()}`);
      return;
    }

    setSelectedOption(e.target.value);
    searchParams.delete("page");
    searchParams.delete("pageSize");
    searchParams.set("sortBy", selectedVal);
    router.push(`/products?${searchParams.toString()}`);
  };

  return (
    <div className="text-black flex gap-2">
      <p className="text-white text-lg">Sort By</p>
      <select
        name="sorting"
        id="sorting"
        value={selectedOption}
        onChange={handleChange}
      >
        <option value="">None</option>
        {sortingOptions.map((option, i) => {
          return (
            <option key={i} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default SortBy;
