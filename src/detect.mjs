// Only engine-verified events under docs/DETECT_EVENTS.md belong here.
// Keep only the three documented fields; never retain payloads or tokens.
export function detect(events) {
  if (!Array.isArray(events)) throw new TypeError('invalid_detection_events');
  const reads = new Map();
  for (const event of events) {
    if (!event || event.method !== 'GET' || typeof event.at !== 'string'
      || typeof event.identity?.sub !== 'string' || !event.identity.sub.trim()) continue;
    const at = Date.parse(event.at);
    if (!Number.isFinite(at)) continue;
    const subject = event.identity.sub;
    if (!reads.has(subject)) reads.set(subject, []);
    reads.get(subject).push(at);
  }
  // Sort copies, leaving input intact. A sliding window finds any ten-minute burst.
  // Different subjects and non-GET operations never share a counter.
  let candidate = null;
  for (const [subject, times] of reads) {
    times.sort((a, b) => a - b);
    let left = 0;
    for (let right = 0; right < times.length; right++) {
      while (times[right] - times[left] > 600_000) left++;
      if (right - left + 1 > 120) {
        if (!candidate || times[right] < candidate.at
          || (times[right] === candidate.at && subject < candidate.subject)) {
          candidate = { subject, at: times[right] };
        }
        break;
      }
    }
  }
  return candidate
    ? { action: 'propose_revocation', reasonCode: 'burst_read', subject: candidate.subject }
    : { action: 'observe' };
}
