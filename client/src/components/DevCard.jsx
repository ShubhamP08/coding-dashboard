import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Share2, X, Code2, Trophy, Flame, Star, BookOpen, Zap } from "lucide-react";

const formatNum = (v) => {
  if (!v && v !== 0) return "—";
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
};

const getRankColor = (rank) => {
  if (!rank) return "#94a3b8";
  const r = rank.toLowerCase();
  if (r.includes("grandmaster") || r.includes("international")) return "#ef4444";
  if (r.includes("master")) return "#f97316";
  if (r.includes("candidate")) return "#a855f7";
  if (r.includes("expert")) return "#3b82f6";
  if (r.includes("specialist")) return "#14b8a6";
  return "#94a3b8";
};

const PlatformBadge = ({ label, color }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "800",
      background: `${color}22`,
      border: `1px solid ${color}55`,
      color,
    }}
  >
    {label}
  </span>
);

const Stat = ({ icon: Icon, label, value, color = "#60a5fa" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center", minWidth: 72 }}>
    <div style={{ display: "flex", alignItems: "center", gap: "5px", color }}>
      <Icon size={14} />
    </div>
    <strong style={{ color: "#f8fafc", fontSize: "20px", lineHeight: 1 }}>{value}</strong>
    <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 700, textAlign: "center" }}>{label}</span>
  </div>
);

const DevCardInner = ({ profiles, cardRef }) => {
  const cfProfile = profiles.find((p) => p.platform === "codeforces");
  const lcProfile = profiles.find((p) => p.platform === "leetcode");
  const ghProfile = profiles.find((p) => p.platform === "github");

  const primaryAvatar = cfProfile?.avatar || cfProfile?.titlePhoto || lcProfile?.avatar || ghProfile?.avatar || "";
  const primaryHandle = cfProfile?.handle || lcProfile?.handle || ghProfile?.handle || "Coder";
  const primaryName = cfProfile?.firstName || lcProfile?.firstName || ghProfile?.firstName || primaryHandle;

  const cfRating = cfProfile?.rating || 0;
  const cfMaxRating = cfProfile?.maxRating || 0;
  const cfRank = cfProfile?.rank || "";
  const lcRating = lcProfile?.rating || lcProfile?.rawData?.contestRating || 0;
  const totalSolved =
    (cfProfile?.solvedCount || 0) + (lcProfile?.solvedCount || 0);
  const ghStars = ghProfile?.rawData?.totalStars || 0;

  const lcStreak = lcProfile?.rawData?.streak || 0;

  const rankColor = getRankColor(cfRank);

  // Collect platform badges
  const badges = [];
  if (cfProfile) badges.push({ label: `CF ${cfRank || "unrated"}`, color: rankColor });
  if (lcProfile) badges.push({ label: `LC Rating ${lcRating || "—"}`, color: "#fb923c" });
  if (ghProfile) badges.push({ label: `GitHub`, color: "#a78bfa" });

  return (
    <div
      ref={cardRef}
      style={{
        width: 520,
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        border: "1px solid #263957",
        borderRadius: 20,
        padding: 32,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow blobs */}
      <div style={{
        position: "absolute", top: -60, left: -60, width: 200, height: 200,
        background: "radial-gradient(circle, rgba(37,99,235,0.18), transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -40, right: -40, width: 200, height: 200,
        background: "radial-gradient(circle, rgba(20,184,166,0.14), transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        {primaryAvatar && (
          <img
            src={primaryAvatar}
            alt={primaryHandle}
            crossOrigin="anonymous"
            style={{ width: 64, height: 64, borderRadius: "50%", border: "2.5px solid #2563eb", objectFit: "cover" }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
            {badges.map((b) => <PlatformBadge key={b.label} {...b} />)}
          </div>
          <div style={{ color: "#f8fafc", fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>
            {primaryName !== primaryHandle ? `${primaryName}` : primaryHandle}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 700, marginTop: 2 }}>
            @{primaryHandle}
          </div>
        </div>

        {/* Branding */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, color: "#f8fafc", fontWeight: 900, fontSize: 13,
          }}>
            <div style={{
              width: 24, height: 24, background: "#2563eb", borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Code2 size={14} color="white" />
            </div>
            CodeTrack
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #263957, transparent)", marginBottom: 24 }} />

      {/* Stats row */}
      <div style={{ display: "flex", justifyContent: "space-around", gap: 8, marginBottom: 24 }}>
        {cfRating > 0 && (
          <Stat icon={Trophy} label="CF Rating" value={cfRating} color="#60a5fa" />
        )}
        {cfMaxRating > 0 && (
          <Stat icon={Zap} label="Peak CF" value={cfMaxRating} color="#facc15" />
        )}
        {lcRating > 0 && (
          <Stat icon={Trophy} label="LC Rating" value={lcRating} color="#fb923c" />
        )}
        {totalSolved > 0 && (
          <Stat icon={BookOpen} label="Solved" value={formatNum(totalSolved)} color="#34d399" />
        )}
        {ghStars > 0 && (
          <Stat icon={Star} label="GitHub ⭐" value={formatNum(ghStars)} color="#facc15" />
        )}
        {lcStreak > 0 && (
          <Stat icon={Flame} label="Streak" value={`${lcStreak}d`} color="#f97316" />
        )}
      </div>

      {/* CF rank bar */}
      {cfRank && (
        <div style={{
          padding: "10px 16px",
          background: `${rankColor}18`,
          border: `1px solid ${rankColor}44`,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 0,
        }}>
          <Trophy size={15} color={rankColor} />
          <span style={{ color: rankColor, fontWeight: 800, fontSize: 14 }}>
            Codeforces {cfRank.charAt(0).toUpperCase() + cfRank.slice(1)}
          </span>
        </div>
      )}
    </div>
  );
};

export default function DevCard({ profiles, onClose }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        style: { fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" },
      });
      const link = document.createElement("a");
      link.download = "dev-card.png";
      link.href = dataUrl;
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch (err) {
      console.error("Failed to export card:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="dev-card-overlay" onClick={onClose}>
      <div className="dev-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dev-card-modal-header">
          <div>
            <h2>
              <Share2 size={22} />
              Your Dev Card
            </h2>
            <p>Download and share on LinkedIn, Twitter, or anywhere you want to flex 🚀</p>
          </div>
          <button type="button" className="dev-card-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="dev-card-preview">
          <DevCardInner profiles={profiles} cardRef={cardRef} />
        </div>

        <div className="dev-card-actions">
          <button
            type="button"
            id="download-dev-card"
            className="primary-button dev-card-download-btn"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download size={18} />
            {downloading ? "Generating…" : downloaded ? "Downloaded!" : "Download PNG"}
          </button>
          <button type="button" className="ghost-compact" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
