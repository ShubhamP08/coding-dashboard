import { BarChart3, CheckCircle, Clock3, Flame, Link as LinkIcon, Loader2, RefreshCw, Target, Trophy, Trash2 } from "lucide-react";

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value || 0);

const LeetcodeCard = ({ profile, refreshProfile, refreshingId, removeProfile, removingId }) => {
  const raw = profile?.rawData || {};
  const rank = raw.rank || profile?.rank || "Unranked";
  const contestRating = raw.contestRating ?? raw.rating ?? profile?.rating ?? 0;
  const streak = raw.streak ?? raw.streakCount ?? 0;
  const acceptanceRate = raw.acceptanceRate ?? raw.acceptance_rate ?? 0;
  const easySolved = raw.easySolved ?? raw.easy ?? profile?.stats?.easySolved ?? 0;
  const mediumSolved = raw.mediumSolved ?? raw.medium ?? profile?.stats?.mediumSolved ?? 0;
  const hardSolved = raw.hardSolved ?? raw.hard ?? profile?.stats?.hardSolved ?? 0;
  const totalSolved = profile?.solvedCount || raw.totalSolved || raw.solvedCount || 0;
  const totalQuestions = raw.totalQuestions ?? raw.total ?? profile?.stats?.totalQuestions ?? null;

  return (
    <article className="connected-card">
      <img src={profile.avatar || profile.titlePhoto} alt={`${profile.handle} avatar`} />

      <div className="connected-main">
        <span className="profile-platform">
          <BarChart3 size={16} />
          LeetCode
        </span>

        <h3>{profile.firstName || profile.handle}</h3>

        <p>
          {rank !== "Unranked"
            ? `${rank} • Contest Rating ${contestRating || "N/A"}`
            : "LeetCode profile connected"}
        </p>

        <div className="mini-stats">
          <span>
            <CheckCircle size={15} />
            {formatNumber(totalSolved)} solved
          </span>

          <span>
            <Trophy size={15} />
            {formatNumber(contestRating)} rating
          </span>

          <span>
            <Flame size={15} />
            {formatNumber(streak)} streak
          </span>

          <span>
            <Target size={15} />
            {acceptanceRate || 0}% accepted
          </span>
        </div>

        <div className="mini-stats">
          <span>
            <BarChart3 size={15} />
            {formatNumber(easySolved)} easy
          </span>
          <span>
            <BarChart3 size={15} />
            {formatNumber(mediumSolved)} medium
          </span>
          <span>
            <BarChart3 size={15} />
            {formatNumber(hardSolved)} hard
          </span>
          <span>
            <Clock3 size={15} />
            {totalQuestions ? `${formatNumber(totalQuestions)} total` : "Live stats"}
          </span>
        </div>
      </div>

      <div className="connected-actions">
        <a className="ghost-compact" href={profile.profileUrl} target="_blank" rel="noreferrer">
          <LinkIcon size={16} />
          Open
        </a>

        <button
          className="ghost-compact"
          type="button"
          onClick={() => refreshProfile(profile._id)}
          disabled={refreshingId === profile._id}
        >
          {refreshingId === profile._id ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
          Refresh
        </button>

        <button
          className="danger-button"
          type="button"
          onClick={() => removeProfile(profile._id)}
          disabled={removingId === profile._id}
        >
          {removingId === profile._id ? <Loader2 className="spin" size={16} /> : <Trash2 size={16} />}
          Remove
        </button>
      </div>
    </article>
  );
};

export default LeetcodeCard;
