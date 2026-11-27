export const calculateAttemptTiming = (
  startedAt,
  durationMinutes,
  contestEndAt,
  graceMinutes = 0,
  extensionSeconds = 0,
  isManual = false
) => {
  const startMs = new Date(startedAt).getTime();
  const safeDurationMins = Number(durationMinutes) > 0 ? Number(durationMinutes) : 60;
  const durationEndMs = startMs + safeDurationMins * 60 * 1000 + (extensionSeconds || 0) * 1000;

  let endsAtMs = durationEndMs;

  // Only clamp to contestEndAt in scheduled timer mode when contestEndAt is a valid future timestamp
  // AND the attempt has not been given an explicit administrative extension that goes beyond contestEndAt
  if (!isManual && contestEndAt) {
    const maxContestEndMs = new Date(contestEndAt).getTime() + (graceMinutes || 0) * 60 * 1000;
    if (maxContestEndMs > startMs) {
      if (extensionSeconds > 0) {
        // Administrative extension takes precedence
        endsAtMs = Math.max(durationEndMs, maxContestEndMs);
      } else {
        endsAtMs = Math.min(durationEndMs, maxContestEndMs);
      }
    }
  }

  const nowMs = Date.now();
  const remainingSeconds = Math.max(0, Math.floor((endsAtMs - nowMs) / 1000));
  const isExpired = remainingSeconds <= 0;

  return {
    endsAt: new Date(endsAtMs).toISOString(),
    remainingSeconds,
    isExpired,
  };
};

export const isAttemptActive = (attempt, contest) => {
  if (!attempt || (attempt.status !== 'in_progress' && attempt.status !== 'revoked_reopened')) return false;
  const isManual = contest?.activationMode === 'manual';
  const timing = calculateAttemptTiming(
    attempt.startedAt,
    contest.durationMinutes,
    contest.endTime,
    contest.gracePeriodMinutes || 0,
    attempt.extensionSeconds || 0,
    isManual
  );
  return !timing.isExpired;
};
