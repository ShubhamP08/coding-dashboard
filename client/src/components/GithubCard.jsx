import React from "react";
import { BookOpen, Users, Star, GitFork, Link as LinkIcon, Trash2, Loader2 } from "lucide-react";

const GithubCard = ({ profile, removeProfile, removingId }) => {
  return (
    <article className="connected-card">
      <img src={profile.avatar || profile.titlePhoto} alt={`${profile.handle} avatar`} />
      <div className="connected-main">
        <span className="profile-platform">
          <BookOpen size={16} />
          GitHub
        </span>
        <h3>{profile.firstName || profile.handle}</h3>
        <p>{profile.rawData?.user?.bio || "No GitHub bio available."}</p>

        <div className="mini-stats">
          <span>
            <BookOpen size={15} />
            {profile.solvedCount || 0} repos
          </span>
          <span>
            <Users size={15} />
            {profile.contestsCount || 0} followers
          </span>
          <span>
            <Star size={15} />
            {profile.rawData?.totalStars || 0} stars
          </span>
          <span>
            <GitFork size={15} />
            {profile.rawData?.totalForks || 0} forks
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

export default GithubCard;
