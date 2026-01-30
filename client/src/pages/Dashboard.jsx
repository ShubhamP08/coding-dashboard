import ProfileCard from "../components/ProfileCard";
import RecommendationCard from "../components/RecommendationCard";
import StatsCard from "../components/StatsCard";



const Dashboard = () => {
  return (
    <div className="dashboard">
      <ProfileCard/>
      <StatsCard/>
      <RecommendationCard/>
    </div>
  );
};

export default Dashboard;