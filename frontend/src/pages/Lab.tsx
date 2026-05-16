import { useState } from 'react';
import { useSimPoller } from '../hooks/useSimPoller';
import { SeedUploader } from '../components/Sidebar/SeedUploader';
import { CampaignBuilder } from '../components/Sidebar/CampaignBuilder';
import { SimControls } from '../components/Sidebar/SimControls';
import { DriftTimeline } from '../components/Canvas/DriftTimeline';
import { AgentFeed } from '../components/Canvas/AgentFeed';
import { FidelityHeatmap } from '../components/Canvas/FidelityHeatmap';
import { RobustnessReport } from '../components/Canvas/RobustnessReport';

export function Lab() {
  const [strategies, setStrategies] = useState<string[]>(['SC-01']);
  const [maxRounds, setMaxRounds] = useState(10);

  useSimPoller();

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col gap-5 p-4 overflow-y-auto">
        <SeedUploader />
        <hr className="border-gray-700" />
        <CampaignBuilder
          onChange={(s, r) => {
            setStrategies(s);
            setMaxRounds(r);
          }}
        />
        <hr className="border-gray-700" />
        <SimControls strategies={strategies} maxRounds={maxRounds} />
      </aside>

      {/* Canvas */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 space-y-4">
        <DriftTimeline />
        <div className="grid grid-cols-2 gap-4">
          <AgentFeed />
          <div className="space-y-4">
            <FidelityHeatmap />
            <RobustnessReport />
          </div>
        </div>
      </main>
    </div>
  );
}
