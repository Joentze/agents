import type { JSONContent } from "@tiptap/react";
import type { DiffSegment } from "@/components/ai-elements/artifact/custom/ai-diff-node";
import { createHash } from "crypto";

// ============================================================================
// Hash-based node comparison for TipTap JSON nodes
// ============================================================================

interface HashedNode {
  hash: string;
  node: JSONContent;
  text: string;
}

/**
 * Generate a hash for a TipTap JSON node based on its content
 */
function hashNode(node: JSONContent): string {
  const content = JSON.stringify(node);
  return createHash("sha256").update(content).digest("hex").slice(0, 12);
}

/**
 * Extract text content from a TipTap JSON node recursively
 */
function extractNodeText(node: JSONContent): string {
  if (node.type === "text" && node.text) {
    return node.text;
  }

  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractNodeText).join("");
  }

  return "";
}

/**
 * Convert a TipTap node to a markdown-like text representation
 */
function nodeToMarkdownText(node: JSONContent): string {
  const text = extractNodeText(node);

  switch (node.type) {
    case "heading":
      const level = node.attrs?.level || 1;
      return "#".repeat(level) + " " + text + "\n\n";
    case "paragraph":
      return text + "\n\n";
    case "bulletList":
    case "orderedList":
      return (
        (node.content || [])
          .map((item) => "• " + extractNodeText(item))
          .join("\n") + "\n\n"
      );
    case "listItem":
      return "• " + text + "\n";
    case "codeBlock":
      const lang = node.attrs?.language || "";
      return "```" + lang + "\n" + text + "\n```\n\n";
    case "blockquote":
      return "> " + text + "\n\n";
    case "horizontalRule":
      return "---\n\n";
    case "image":
      return `![${node.attrs?.alt || ""}](${node.attrs?.src || ""})\n\n`;
    case "table":
      return "[Table]\n\n";
    default:
      return text ? text + "\n\n" : "";
  }
}

/**
 * Hash all top-level nodes from a TipTap JSON document
 */
function hashNodes(nodes: JSONContent[]): HashedNode[] {
  return nodes.map((node) => ({
    hash: hashNode(node),
    node,
    text: nodeToMarkdownText(node),
  }));
}

/**
 * Diff two arrays of TipTap JSON nodes using Longest Common Subsequence (LCS).
 * This provides proper ordering by finding the optimal alignment between old and new nodes.
 *
 * @param oldNodes - Array of JSONContent nodes from the old document (editor.getJSON().content)
 * @param newNodes - Array of JSONContent nodes from the new document (newEditor.getJSON().content)
 * @returns Array of DiffSegments in document order
 */
export function diffNodes(
  oldNodes: JSONContent[],
  newNodes: JSONContent[]
): DiffSegment[] {
  const oldHashed = hashNodes(oldNodes);
  const newHashed = hashNodes(newNodes);

  const m = oldHashed.length;
  const n = newHashed.length;

  // Build LCS table
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldHashed[i - 1].hash === newHashed[j - 1].hash) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find the diff
  let i = m;
  let j = n;
  const result: DiffSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldHashed[i - 1].hash === newHashed[j - 1].hash) {
      // Match - unchanged
      if (newHashed[j - 1].text.trim()) {
        result.unshift({ type: "unchanged", value: newHashed[j - 1].text });
      }
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Added in new
      if (newHashed[j - 1].text.trim()) {
        result.unshift({ type: "added", value: newHashed[j - 1].text });
      }
      j--;
    } else if (i > 0) {
      // Removed from old
      if (oldHashed[i - 1].text.trim()) {
        result.unshift({ type: "removed", value: oldHashed[i - 1].text });
      }
      i--;
    }
  }

  return result;
}

/**
 * Groups consecutive diff segments of the same type together.
 * Handles all three types: "added", "removed", and "unchanged".
 *
 * For example: [added, added, removed, unchanged, unchanged, added] becomes
 * [added (merged), removed, unchanged (merged), added]
 *
 * This preserves the document structure while reducing visual noise
 * by merging adjacent blocks of the same change type.
 */
export function groupChangeBlocks(diffSegments: DiffSegment[]): DiffSegment[] {
  if (diffSegments.length === 0) return [];

  const grouped: DiffSegment[] = [];
  let current: DiffSegment = { ...diffSegments[0] };

  for (let i = 1; i < diffSegments.length; i++) {
    const segment = diffSegments[i];

    if (segment.type === current.type) {
      // Same type - concatenate the text
      current.value += segment.value;
    } else {
      // Different type - push current and start new group
      grouped.push(current);
      current = { ...segment };
    }
  }

  // Don't forget the last group
  grouped.push(current);

  return grouped;
}
