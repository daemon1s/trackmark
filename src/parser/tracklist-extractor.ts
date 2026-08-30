import { ParsedTrackCandidate, parseTracklistText } from './timestamp-regex';

export interface ExtractionResult {
  source: 'description' | 'comments' | 'chapters' | 'none';
  sourceLabel: string;
  tracks: ParsedTrackCandidate[];
}

export class TracklistExtractor {
  public static extractFromDOM(videoDuration: number = 0): ExtractionResult {
    const chaptersResult = this.extractFromChapters(videoDuration);
    if (chaptersResult.tracks.length >= 2) {
      return chaptersResult;
    }

    const descResult = this.extractFromDescription(videoDuration);
    if (descResult.tracks.length >= 2) {
      return descResult;
    }

    const commentsResult = this.extractFromComments(videoDuration);
    if (commentsResult.tracks.length >= 2) {
      return commentsResult;
    }

    if (descResult.tracks.length > 0) return descResult;
    if (chaptersResult.tracks.length > 0) return chaptersResult;
    if (commentsResult.tracks.length > 0) return commentsResult;

    return {
      source: 'none',
      sourceLabel: 'No automatic timestamps found',
      tracks: []
    };
  }

  public static extractFromChapters(videoDuration: number = 0): ExtractionResult {
    const chapterItems = document.querySelectorAll('ytd-macro-markers-list-item-renderer, ytd-chapter-renderer');
    if (chapterItems.length >= 2) {
      const textLines: string[] = [];
      chapterItems.forEach(item => {
        const timeEl = item.querySelector('#time, .ytd-macro-markers-list-item-renderer#time');
        const titleEl = item.querySelector('#title, .ytd-macro-markers-list-item-renderer#title, h4');
        const timeText = timeEl?.textContent?.trim() || '';
        const titleText = titleEl?.textContent?.trim() || '';
        if (timeText && titleText) {
          textLines.push(`${timeText} ${titleText}`);
        }
      });

      if (textLines.length >= 2) {
        const parsed = parseTracklistText(textLines.join('\n'), videoDuration);
        if (parsed.length >= 2) {
          return {
            source: 'chapters',
            sourceLabel: `Official Chapters (${parsed.length} tracks)`,
            tracks: parsed
          };
        }
      }
    }

    return { source: 'none', sourceLabel: '', tracks: [] };
  }

  public static extractFromDescription(videoDuration: number = 0): ExtractionResult {
    const descSelectors = [
      '#description-inner',
      'ytd-text-inline-expander#description-inline-expander',
      '#description.ytd-watch-metadata',
      'ytd-expandable-video-description-body-renderer',
      '#description yt-formatted-string'
    ];

    for (const sel of descSelectors) {
      const el = document.querySelector(sel) as HTMLElement;
      if (el) {
        const text = el.innerText || el.textContent || '';
        if (text) {
          const parsed = parseTracklistText(text, videoDuration);
          if (parsed.length >= 2) {
            return {
              source: 'description',
              sourceLabel: `Description (${parsed.length} tracks)`,
              tracks: parsed
            };
          }
        }
      }
    }

    return { source: 'none', sourceLabel: '', tracks: [] };
  }

  public static extractFromComments(videoDuration: number = 0): ExtractionResult {
    const commentEls = document.querySelectorAll('#comments ytd-comment-thread-renderer #content-text');

    for (let i = 0; i < commentEls.length; i++) {
      const el = commentEls[i] as HTMLElement;
      const text = el?.innerText || el?.textContent || '';
      if (text) {
        const parsed = parseTracklistText(text, videoDuration);
        if (parsed.length >= 2) {
          return {
            source: 'comments',
            sourceLabel: `Comments (${parsed.length} tracks)`,
            tracks: parsed
          };
        }
      }
    }

    return { source: 'none', sourceLabel: '', tracks: [] };
  }
}
