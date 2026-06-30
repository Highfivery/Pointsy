import { ImageResponse } from "next/og";

export const alt = "Pointsy — points that make chores fun";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded social-share card, generated at build/request time. */
export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background:
          "radial-gradient(120% 90% at 50% -10%, #0a3325 0%, #04130e 60%)",
        color: "#ecfdf5",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "22px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            width: "92px",
            height: "92px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, #34d399, #22d3ee)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#03251b",
            fontSize: "62px",
            fontWeight: 800,
          }}
        >
          P
        </div>
        <div style={{ fontSize: "44px", fontWeight: 800 }}>Pointsy</div>
      </div>

      <div
        style={{
          fontSize: "72px",
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-2px",
          maxWidth: "920px",
        }}
      >
        Points that make chores fun.
      </div>
      <div
        style={{
          fontSize: "30px",
          color: "#9fcdbb",
          marginTop: "26px",
          maxWidth: "860px",
        }}
      >
        Free &amp; open-source. Parents reward good habits; kids redeem points
        for rewards.
      </div>

      <div style={{ display: "flex", gap: "16px", marginTop: "44px" }}>
        {["100% free", "No ads", "Open-source"].map((t) => (
          <div
            key={t}
            style={{
              fontSize: "24px",
              color: "#34d399",
              background: "rgba(52, 211, 153, 0.16)",
              padding: "10px 24px",
              borderRadius: "999px",
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
