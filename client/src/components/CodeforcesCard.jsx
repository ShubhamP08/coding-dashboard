import React from "react";
import { Trophy, BarChart3, BookOpen, Activity, Link as LinkIcon, Trash2, Loader2 } from "lucide-react";

const CodeforcesCard = ({ profile, removeProfile, removingId }) => {
  return (
    <article className="connected-card">
      <img src={profile.avatar || profile.titlePhoto} alt={`${profile.handle} avatar`} />
      <div className="connected-main">
        <span className="profile-platform">
          <Trophy size={16} />
          Codeforces
        </span>
        <h3>{profile.firstName || profile.handle}</h3>
        <p>
          {`${profile.rank || "unrated"} rating profile with ${profile.solvedCount || 0} solved problems in the latest fetched submissions.`}
        </p>

        <div className="mini-stats">
          <span>
            <Trophy size={15} />
            {profile.rating || 0} rating
          </span>
          <span>
            <BarChart3 size={15} />
            {profile.maxRating || 0} max
          </span>
          <span>
            <BookOpen size={15} />
            {profile.solvedCount || 0} recent solved
          </span>
          <span>
            <Activity size={15} />
            {profile.contestsCount || 0} contests
          </span>
        </div>
      </div>

      <div className="connected-actions">
        <a className="ghost-compact" href={profile.profileUrl} target="_blank">
          <LinkIcon size={16} />
          Open
        </a>
        <button
          className="danger-button"
          type="button"
          onClick={() => removeProfile(profile._id)}
          disabled={removingId === profile._id}
        >
          {removingId === profile._id ? (
            <Loader2 className="spin" size={16} />
          ) : (
            <Trash2 size={16} />
          )}
          Remove
        </button>
      </div>
    </article>
  );
};

export default CodeforcesCard;
