export interface ParsedTrackCandidate {
  title: string;
  startTime: number;
  endTime: number;
  rawLine: string;
}

export function timeStringToSeconds(timeStr: string): number {
  const cleaned = timeStr.replace(/[^0-9:]/g, '').trim();
  const parts = cleaned.split(':').map(Number);
  if (parts.some(isNaN) || parts.length === 0) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

export const TIMESTAMP_REGEX = /(?:\[|\()?(?:(?:(\d{1,2}):)?([0-5]?\d):([0-5]\d))(?:\]|\))?/;
export const GLOBAL_TIMESTAMP_REGEX = /(?:\[|\()?(?:(?:(\d{1,2}):)?([0-5]?\d):([0-5]\d))(?:\]|\))?/g;

export function cleanTrackTitle(rawLine: string, timestampMatch: string): string {
  let title = rawLine.replace(timestampMatch, '').trim();

  title = title
    .replace(/^#?\d{1,3}[\.\:\-\)\s]+\s*/, '')
    .replace(/^(?:track|pista|song)\s*\d{1,3}[\.\:\-\s]*/i, '')
    .replace(/^\[\d{1,3}\]\s*/, '')
    .trim();

  title = title
    .replace(/^[\-–—\|\•\:\~\/\.\,\s]+/, '')
    .replace(/[\-–—\|\•\:\~\/\.\,\s]+$/, '')
    .trim();

  title = title
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .trim();

  return title;
}

export function parseTracklistText(rawText: string, videoDuration: number = 0): ParsedTrackCandidate[] {
  if (!rawText) return [];

  const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const candidates: { title: string; startTime: number; rawLine: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(TIMESTAMP_REGEX);
    if (!match) continue;

    const timestampStr = match[0];
    const startTime = timeStringToSeconds(timestampStr);

    let title = cleanTrackTitle(trimmed, timestampStr);

    if (!title || title.length < 2) {
      title = `Track @ ${timestampStr.replace(/[^0-9:]/g, '')}`;
    }

    candidates.push({
      title,
      startTime,
      rawLine: trimmed
    });
  }

  const uniqueCandidates: { title: string; startTime: number; rawLine: string }[] = [];
  const seenTimes = new Set<number>();

  for (const item of candidates) {
    if (!seenTimes.has(item.startTime)) {
      seenTimes.add(item.startTime);
      uniqueCandidates.push(item);
    }
  }

  uniqueCandidates.sort((a, b) => a.startTime - b.startTime);

  const result: ParsedTrackCandidate[] = [];
  for (let i = 0; i < uniqueCandidates.length; i++) {
    const curr = uniqueCandidates[i];
    const next = uniqueCandidates[i + 1];

    let endTime: number;
    if (next) {
      endTime = next.startTime;
    } else {
      if (videoDuration > curr.startTime) {
        endTime = videoDuration;
      } else {
        endTime = curr.startTime + 180;
      }
    }

    result.push({
      title: curr.title,
      startTime: curr.startTime,
      endTime,
      rawLine: curr.rawLine
    });
  }

  return result;
}
