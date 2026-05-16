import { useEffect, useRef } from 'react';
import { getEvents, getStatus } from '../api/simulation';
import { getReport } from '../api/report';
import { useSimStore } from '../store/simStore';
import { useReportStore } from '../store/reportStore';
import { useGraphStore } from '../store/graphStore';

const POLL_MS = 2000;

export function useSimPoller() {
  const simId = useSimStore((s) => s.simId);
  const isRunning = useSimStore((s) => s.isRunning);
  const latestRound = useSimStore((s) => s.latestRound);
  const addRounds = useSimStore((s) => s.addRounds);
  const setTerminated = useSimStore((s) => s.setTerminated);
  const setReport = useReportStore((s) => s.setReport);
  const setNodes = useGraphStore((s) => s.setNodes);

  const latestRoundRef = useRef(latestRound);
  latestRoundRef.current = latestRound;

  useEffect(() => {
    if (!isRunning || !simId) return;

    const eventTimer = setInterval(async () => {
      try {
        const newRounds = await getEvents(simId, latestRoundRef.current);
        if (newRounds.length > 0) addRounds(newRounds);
      } catch { /* network hiccup */ }
    }, POLL_MS);

    const statusTimer = setInterval(async () => {
      try {
        const status = await getStatus(simId);
        if (status.status === 'terminated') {
          clearInterval(eventTimer);
          clearInterval(statusTimer);
          // Fetch any remaining events before marking done
          try {
            const finalRounds = await getEvents(simId, latestRoundRef.current);
            if (finalRounds.length > 0) addRounds(finalRounds);
          } catch { /* ignore */ }
          setTerminated(status.termination_reason ?? status.drift_stage ?? 'done');
          try {
            const report = await getReport(simId);
            setReport(report);
            setNodes(report.node_vulnerabilities ?? []);
          } catch { /* report may not be ready yet */ }
        }
      } catch { /* ignore */ }
    }, POLL_MS);

    return () => {
      clearInterval(eventTimer);
      clearInterval(statusTimer);
    };
  }, [isRunning, simId]);
}
