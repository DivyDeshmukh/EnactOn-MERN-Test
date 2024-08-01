"use client";

import { useQueryParams } from "@/hooks/useQueryParams";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent } from "react";

function PaginationSection({
  lastPage,
  pageNo,
  pageSize,
}: // totalProducts,
{
  lastPage: number;
  pageNo: number;
  pageSize: number;
  // totalProducts: number;
}) {
  const router = useRouter();

  const searchParams = useQueryParams();

  function handlePrev() {
    searchParams.set("page", `${pageNo - 1}`);
    router.push(`/products?${searchParams.toString()}`);
  }

  function handleNext() {
    searchParams.set("page", `${pageNo + 1}`);
    router.push(`/products?${searchParams.toString()}`);
  }

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    // console.log(e.target.value);
    searchParams.delete("page");
    searchParams.set("pageSize", e.target.value);
    router.push(`/products?${searchParams.toString()}`);
  };

  return (
    <div className="mt-12 p-4 bg-gray-800 flex justify-center gap-4 items-center mb-8">
      <select
        value={pageSize}
        name="page-size"
        className="text-black"
        onChange={(e) => {
          handleChange(e);
        }}
      >
        {["10", "25", "50"].map((val) => {
          return (
            <option key={val} value={val}>
              {val}
            </option>
          );
        })}
      </select>
      <button
        className="p-3 bg-slate-300 text-black disabled:cursor-not-allowed"
        disabled={pageNo === 1}
        onClick={handlePrev}
      >
        &larr;Prev
      </button>
      <p>
        Page {pageNo} of {lastPage}{" "}
      </p>
      <button
        className="p-3 bg-slate-300 text-black disabled:cursor-not-allowed"
        disabled={pageNo === lastPage}
        onClick={handleNext}
      >
        Next&rarr;
      </button>
    </div>
  );
}

export default PaginationSection;
