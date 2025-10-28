'use client';

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
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
          className="bg-white shadow-sm"
        >
          <button
            onClick={() => toggleItem(index)}
            className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
          >
            <h4 className="text-lg font-semibold text-slate-900">
              {item.question}
            </h4>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className={`h-6 w-6 text-[#D4A373] transition-transform duration-300 ${
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
              openIndex === index ? "max-h-96" : "max-h-0"
            }`}
          >
            <div className="border-t border-slate-200 p-4 text-slate-600">
              {item.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
