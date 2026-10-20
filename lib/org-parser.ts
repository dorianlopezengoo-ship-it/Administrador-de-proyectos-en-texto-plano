import { OrgHeadline, OrgTaskStatus, OrgChecklistItem } from '@/types';

const STATUS_CYCLE: OrgTaskStatus[] = ['TODO', 'DOING', 'WAIT', 'DONE', 'CANCELLED'];

export function parseOrgContent(content: string, fileId: string, fileName: string): {
  headlines: OrgHeadline[];
  embeddedBeancountBlocks: Array<{ code: string; lineStart: number; lineEnd: number }>;
  wikiLinks: Array<{ target: string; label: string; line: number }>;
} {
  const lines = content.split('\n');
  const headlines: OrgHeadline[] = [];
  const embeddedBeancountBlocks: Array<{ code: string; lineStart: number; lineEnd: number }> = [];
  const wikiLinks: Array<{ target: string; label: string; line: number }> = [];

  let currentHeadline: Partial<OrgHeadline> | null = null;
  let bodyLines: string[] = [];
  let inProperties = false;
  let inSrcBlock = false;
  let currentSrcLang = '';
  let srcLines: string[] = [];
  let srcStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Wiki links extraction [[Target]] or [[Target][Label]]
    const wikiRegex = /\[\[([^\]]+)\](?:\[([^\]]+)\])?\]/g;
    let match;
    while ((match = wikiRegex.exec(line)) !== null) {
      wikiLinks.push({
        target: match[1],
        label: match[2] || match[1],
        line: i + 1,
      });
    }

    // Source blocks
    const srcBeginMatch = trimmed.match(/^#\+BEGIN_SRC\s+([a-zA-Z0-9_-]+)/i);
    if (srcBeginMatch) {
      inSrcBlock = true;
      currentSrcLang = srcBeginMatch[1].toLowerCase();
      srcLines = [];
      srcStart = i;
      continue;
    }

    if (inSrcBlock && trimmed.toUpperCase() === '#+END_SRC') {
      inSrcBlock = false;
      if (currentSrcLang === 'beancount' || currentSrcLang === 'bean') {
        embeddedBeancountBlocks.push({
          code: srcLines.join('\n'),
          lineStart: srcStart,
          lineEnd: i,
        });
      }
      continue;
    }

    if (inSrcBlock) {
      srcLines.push(line);
      continue;
    }

    // Headline detection
    const headlineMatch = line.match(/^(\*{1,8})\s+(.*)$/);
    if (headlineMatch) {
      // Save previous headline
      if (currentHeadline) {
        currentHeadline.lineEnd = i - 1;
        currentHeadline.body = bodyLines.join('\n');
        headlines.push(finalizeHeadline(currentHeadline, fileId, fileName));
      }

      const stars = headlineMatch[1];
      const rest = headlineMatch[2].trim();

      currentHeadline = {
        id: `${fileId}-${i}`,
        fileId,
        fileName,
        level: stars.length,
        tags: [],
        properties: {},
        checklists: [],
        lineStart: i,
      };
      bodyLines = [];
      inProperties = false;

      // Parse status, priority, title, and tags from rest
      let titleTokens = rest;

      // Extract tags at end :tag1:tag2:
      const tagMatch = titleTokens.match(/\s+:([a-zA-Z0-9_@#%:]+):$/);
      if (tagMatch) {
        currentHeadline.tags = tagMatch[1].split(':').filter(Boolean);
        titleTokens = titleTokens.slice(0, tagMatch.index).trim();
      }

      // Extract status keyword
      const words = titleTokens.split(/\s+/);
      if (words.length > 0 && STATUS_CYCLE.includes(words[0] as OrgTaskStatus)) {
        currentHeadline.status = words[0] as OrgTaskStatus;
        words.shift();
      }

      // Extract priority [#A]
      if (words.length > 0 && /^\[#[A-Z]\]$/.test(words[0])) {
        currentHeadline.priority = words[0].slice(2, 3) as 'A' | 'B' | 'C';
        words.shift();
      }

      currentHeadline.title = words.join(' ');
      continue;
    }

    // Inside a headline
    if (currentHeadline) {
      bodyLines.push(line);

      // Check properties drawer
      if (trimmed === ':PROPERTIES:') {
        inProperties = true;
        continue;
      }
      if (trimmed === ':END:' && inProperties) {
        inProperties = false;
        continue;
      }
      if (inProperties) {
        const propMatch = trimmed.match(/^:([A-Za-z0-9_-]+):\s*(.*)$/);
        if (propMatch && currentHeadline.properties) {
          const propName = propMatch[1].toUpperCase();
          const propVal = propMatch[2].trim();
          currentHeadline.properties[propName] = propVal;
          if (propName === 'STYLE' && propVal.toLowerCase() === 'habit') {
            currentHeadline.isHabit = true;
          }
        }
        continue;
      }

      // Scheduled & Deadline
      const schedMatch = line.match(/SCHEDULED:\s*<([^>]+)>/i);
      if (schedMatch) {
        currentHeadline.scheduled = schedMatch[1];
      }
      const deadMatch = line.match(/DEADLINE:\s*<([^>]+)>/i);
      if (deadMatch) {
        currentHeadline.deadline = deadMatch[1];
      }
      const closedMatch = line.match(/CLOSED:\s*\[([^\]]+)\]/i);
      if (closedMatch) {
        currentHeadline.closed = closedMatch[1];
      }

      // Checklists: - [ ] or - [X] or + [ ] etc
      const checkMatch = line.match(/^(\s*[-+*]\s+)\[([ xX])\]\s+(.*)$/);
      if (checkMatch) {
        currentHeadline.checklists?.push({
          text: checkMatch[3],
          completed: checkMatch[2].toLowerCase() === 'x',
          line: i,
        });
      }
    }
  }

  // Push the final headline
  if (currentHeadline) {
    currentHeadline.lineEnd = lines.length - 1;
    currentHeadline.body = bodyLines.join('\n');
    headlines.push(finalizeHeadline(currentHeadline, fileId, fileName));
  }

  return { headlines, embeddedBeancountBlocks, wikiLinks };
}

function finalizeHeadline(
  partial: Partial<OrgHeadline>,
  fileId: string,
  fileName: string
): OrgHeadline {
  const isHabit = partial.isHabit || partial.tags?.includes('habit') || partial.tags?.includes('HABIT');

  // Pseudo streak generator for habit representation (14 days)
  let habitStreak: boolean[] = [];
  if (isHabit) {
    habitStreak = [true, true, true, false, true, true, true, true, true, false, true, true, true, true];
  }

  return {
    id: partial.id || `${fileId}-0`,
    fileId,
    fileName,
    level: partial.level || 1,
    title: partial.title || 'Untitled Headline',
    status: partial.status,
    priority: partial.priority,
    tags: partial.tags || [],
    scheduled: partial.scheduled,
    deadline: partial.deadline,
    closed: partial.closed,
    properties: partial.properties || {},
    checklists: partial.checklists || [],
    body: partial.body || '',
    lineStart: partial.lineStart || 0,
    lineEnd: partial.lineEnd || 0,
    isHabit,
    habitStreak,
  };
}

export function getNextTaskStatus(current?: OrgTaskStatus): OrgTaskStatus | undefined {
  if (!current) return 'TODO';
  const idx = STATUS_CYCLE.indexOf(current);
  if (idx === -1 || idx === STATUS_CYCLE.length - 1) {
    return undefined; // Clears status
  }
  return STATUS_CYCLE[idx + 1];
}

export function toggleStatusInContent(
  content: string,
  lineStart: number,
  newStatus?: OrgTaskStatus
): string {
  const lines = content.split('\n');
  if (lineStart < 0 || lineStart >= lines.length) return content;

  const line = lines[lineStart];
  const match = line.match(/^(\*{1,8})\s+(.*)$/);
  if (!match) return content;

  const stars = match[1];
  let rest = match[2];

  // Remove existing status if any
  for (const s of STATUS_CYCLE) {
    if (rest.startsWith(s + ' ')) {
      rest = rest.slice(s.length + 1);
      break;
    } else if (rest === s) {
      rest = '';
      break;
    }
  }

  if (newStatus) {
    lines[lineStart] = `${stars} ${newStatus} ${rest}`.trimEnd();
  } else {
    lines[lineStart] = `${stars} ${rest}`.trimEnd();
  }

  return lines.join('\n');
}

export function toggleChecklistInContent(
  content: string,
  lineNumber: number
): string {
  const lines = content.split('\n');
  if (lineNumber < 0 || lineNumber >= lines.length) return content;

  const line = lines[lineNumber];
  const match = line.match(/^(\s*[-+*]\s+\[)([ xX])(\]\s+.*)$/);
  if (!match) return content;

  const nextState = match[2].trim() ? ' ' : 'X';
  lines[lineNumber] = `${match[1]}${nextState}${match[3]}`;
  return lines.join('\n');
}
