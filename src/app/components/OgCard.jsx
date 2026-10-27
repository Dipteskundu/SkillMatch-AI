// Shared artwork for file-based social images (opengraph-image / twitter-image).
// No stock photos or invented logos — just the product name, tagline and the
// platform's core promise, rendered on the brand gradient.

export const OG_ALT = "SkillMatch AI — explainable skill matching for candidates and recruiters";
export const OG_SIZE = { width: 1200, height: 630 };

export function OgCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 45%, #6d28d9 100%)",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "rgba(255,255,255,0.18)",
            border: "3px solid rgba(255,255,255,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 34,
            fontWeight: 800,
          }}
        >
          S
        </div>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>
          SkillMatch AI
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* satori needs explicit display:flex on multi-child nodes — the old
            <br/>-based heading failed the check at build time */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 76,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          <span>Hire on evidence,</span>
          <span>not keywords.</span>
        </div>
        <div style={{ fontSize: 34, opacity: 0.92, lineHeight: 1.3 }}>
          Explainable Hiring Fit Scores · skill gap insights · Learning Hub
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, fontSize: 26, opacity: 0.85 }}>
        <div
          style={{
            padding: "10px 22px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.16)",
            border: "2px solid rgba(255,255,255,0.35)",
          }}
        >
          jobmatchai.app
        </div>
      </div>
    </div>
  );
}
