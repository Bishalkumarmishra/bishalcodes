import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '../auth';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = validateApiKey(request);
    if (!authResult.isValid) return authResult.errorResponse!;

    const body = await request.json();
    const { source, target } = body;

    if (source === undefined || target === undefined) {
      return NextResponse.json({ error: 'Both source and target strings are required.' }, { status: 400 });
    }

    const sourceLines = source.split(/\r?\n/);
    const targetLines = target.split(/\r?\n/);

    const diff = computeLcsDiff(sourceLines, targetLines);

    return NextResponse.json({
      success: true,
      diff,
      summary: {
        totalLines: diff.length,
        added: diff.filter(line => line.type === 'added').length,
        removed: diff.filter(line => line.type === 'removed').length,
        unchanged: diff.filter(line => line.type === 'unchanged').length,
      }
    });

  } catch (error: any) {
    console.error('Diff API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}

// Computes the Longest Common Subsequence line-by-line diff
function computeLcsDiff(source: string[], target: string[]): DiffLine[] {
  const m = source.length;
  const n = target.length;

  // DP table for LCS lengths
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (source[i - 1] === target[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to assemble the diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && source[i - 1] === target[j - 1]) {
      result.unshift({ type: 'unchanged', value: source[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', value: target[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: 'removed', value: source[i - 1] });
      i--;
    }
  }

  return result;
}
