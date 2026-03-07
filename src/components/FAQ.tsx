
'use client';

import type { ReactNode } from "react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: ReactNode;
}

interface FAQProps {
  items: FAQItem[];
}

export default function FAQ({ items }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="overflow-hidden border border-slate-200 bg-white shadow-sm transition-colors duration-300 hover:border-[#D4A373]/45"
        >
          <button
            onClick={() => toggleItem(index)}
            className={`flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-5 text-left transition-colors duration-300 ${
              openIndex === index ? "bg-[#FCFAF7]" : "hover:bg-[#FCFAF7]"
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#D4A373]" aria-hidden="true" />
              <h4 className="text-lg font-semibold leading-7 text-slate-900">
              {item.question}
              </h4>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className={`h-5 w-5 shrink-0 text-[#D4A373] transition-transform duration-300 ${
                openIndex === index ? "rotate-180" : ""
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              openIndex === index ? "max-h-[40rem]" : "max-h-0"
            }`}
          >
            <div className="border-t border-slate-200 bg-white px-5 py-5 text-[15px] leading-7 text-slate-600">
              {item.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
