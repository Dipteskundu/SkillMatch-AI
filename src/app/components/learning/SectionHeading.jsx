"use client";

/**
 * Section eyebrow + heading used across Learning Hub pages.
 * Theme-safe: slate classes flip via the html.dark overrides in globals.css.
 */
export default function SectionHeading({ eyebrow, title, description, align = "left" }) {
  const centered = align === "center";

  return (
    <div className={`max-w-2xl ${centered ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 mb-4">
          <span className="h-px w-6 bg-indigo-600/50" aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-[1.1]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
