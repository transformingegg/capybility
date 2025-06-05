import { useState } from "react";

export default function FieldHelp({ helpText }: { helpText: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative align-super ml-1">
      <button
        type="button"
        className="text-[#009bb3] bg-[#e6f7fb] border border-[#009bb3] rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center hover:bg-[#d0f0fa] transition"
        style={{ verticalAlign: "super" }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Show field explanation"
      >
        ?
      </button>
      {open && (
        <div
          className="absolute z-10 left-1/2 -translate-x-1/2 mt-2 min-w-[180px] max-w-xs bg-white border-2 border-[#009bb3] rounded-lg shadow-lg p-3 text-sm text-gray-700"
          style={{ top: "1.5em" }}
        >
          {helpText}
        </div>
      )}
    </span>
  );
}