import React from 'react';

/**
 * Tiny, safe markdown renderer for chat bubbles.
 *
 * Supports: **bold**, *italic* / _italic_, `inline code`, [links](url), and
 * line-based bullet lists (-, *, •). Everything is built from React elements —
 * no dangerouslySetInnerHTML, no HTML passthrough — so model output can never
 * inject markup. Unknown syntax is left as plain text.
 */

// Split a single line into inline spans (bold / italic / code / link).
function renderInline(text, keyPrefix) {
  // Order matters: match the longest/most-specific tokens first.
  // Token regex captures: code | bold | italic(*) | italic(_) | link
  const tokenRe =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)|(\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/g;

  const nodes = [];
  let last = 0;
  let m;
  let i = 0;

  while ((m = tokenRe.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    const token = m[0];
    const key = `${keyPrefix}-${i++}`;

    if (m[1]) {
      // `code`
      nodes.push(
        <code key={key} className="waaazek-md-code">{token.slice(1, -1)}</code>
      );
    } else if (m[2]) {
      // **bold**
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (m[3]) {
      // *italic*
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (m[4]) {
      // _italic_
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (m[5]) {
      // [label](url)
      const label = token.slice(1, token.indexOf(']'));
      const url = m[6];
      nodes.push(
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="waaazek-md-link"
        >
          {label}
        </a>
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function renderMarkdown(text) {
  if (!text) return null;
  const lines = String(text).split('\n');

  const blocks = [];
  let listItems = null; // accumulates consecutive bullet lines

  const flushList = (key) => {
    if (listItems && listItems.length) {
      blocks.push(
        <ul key={`ul-${key}`} className="waaazek-md-list">
          {listItems.map((li, idx) => (
            <li key={idx}>{renderInline(li, `li-${key}-${idx}`)}</li>
          ))}
        </ul>
      );
    }
    listItems = null;
  };

  lines.forEach((line, idx) => {
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      if (!listItems) listItems = [];
      listItems.push(bullet[1]);
      return;
    }
    flushList(idx);
    if (line.trim() === '') {
      // Preserve a blank line as a small spacer between paragraphs.
      blocks.push(<span key={`br-${idx}`} className="waaazek-md-break" />);
    } else {
      blocks.push(
        <p key={`p-${idx}`} className="waaazek-md-p">
          {renderInline(line, `p-${idx}`)}
        </p>
      );
    }
  });
  flushList('end');

  return blocks;
}
