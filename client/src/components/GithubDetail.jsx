import { Code2, ExternalLink, GitFork, Star, Users } from "lucide-react";

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value || 0);

const EmptyInline = ({ message }) => (
  <div className="empty-inline">
    <p>{message}</p>
  </div>
);

const DetailSection = ({ icon, title, description, children, full = true }) => {
  const SectionIcon = icon;

  return (
    <section className={`detail-section${full ? " detail-section-full" : ""}`}>
      <div className="section-title">
        <h2>
          <SectionIcon size={24} />
          {title}
        </h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
};

const GithubDetail = ({ profile }) => {
  const githubRepos = profile?.stats?.topRepos || profile?.rawData?.topRepos || [];
  const languageBreakdown = profile?.stats?.languageBreakdown || profile?.rawData?.languageBreakdown || [];

  return (
    <>
      <DetailSection
        icon={Code2}
        title="Top repositories"
        description="Most starred and active repositories."
      >
        {githubRepos.length > 0 ? (
          <div className="detail-repos-grid">
            {githubRepos.map((repo) => (
              <article className="detail-repo-card" key={repo.id}>
                <div className="detail-repo-head">
                  <div>
                    <strong>{repo.name}</strong>
                    <span className="detail-repo-language">{repo.language || "Unknown"}</span>
                  </div>
                  <a href={repo.url} target="_blank" rel="noreferrer" aria-label="Open repository">
                    <ExternalLink size={16} />
                  </a>
                </div>
                <p>{repo.description || "No repository description provided."}</p>
                <div className="detail-repo-stats">
                  <span>
                    <Star size={14} />
                    {formatNumber(repo.stars)} stars
                  </span>
                  <span>
                    <GitFork size={14} />
                    {formatNumber(repo.forks)} forks
                  </span>
                  <span>
                    <Users size={14} />
                    {formatNumber(repo.watchers)} watchers
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyInline message="No repository data available." />
        )}
      </DetailSection>

      <DetailSection
        icon={Star}
        title="Language breakdown"
        description="Repository language spread from the fetched repos."
      >
        {languageBreakdown.length > 0 ? (
          <div className="detail-language-grid">
            {languageBreakdown.map((item) => {
              const maxCount = Math.max(...languageBreakdown.map((i) => i.count));
              const percentage = (item.count / maxCount) * 100;

              return (
                <article className="detail-language-item" key={item.language}>
                  <div className="detail-language-head">
                    <strong>{item.language}</strong>
                    <span>{item.count}</span>
                  </div>
                  <div className="detail-language-bar">
                    <div style={{ width: `${percentage}%` }}></div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyInline message="No language data available." />
        )}
      </DetailSection>
    </>
  );
};

export default GithubDetail;
