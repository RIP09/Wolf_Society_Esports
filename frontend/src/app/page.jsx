import HomeHero from '@/components/public/HomeHero';
import TeamsList from '@/components/public/TeamsList';
import ScheduleList from '@/components/public/ScheduleList';
import ContentFeed from '@/components/public/ContentFeed';

export default function Home() {
  return (
    <div className="space-y-12">
      <HomeHero />
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TeamsList />
        <ScheduleList />
        <ContentFeed />
      </section>
    </div>
  );
}
