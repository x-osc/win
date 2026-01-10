import siteindexraw from "@generated/siteindex.json";

export interface SearchResult {
  url: string;
  webUrl: string;
  tags: string[];
  score: number; // Used for ranking
}

const siteindex = siteindexraw as {
  sites: Record<string, any>;
  tags: Record<string, string[]>;
};

export function generateGoggleNet(query: string): string {
  let results = getResults(query);
  let html = `<text>${JSON.stringify(results)}</text>`;
  return html;
}

export function getResults(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  const keywords = q.split(/\s+/);

  const resultsMap = new Map<string, { score: number; tags: string[] }>();

  for (const keyword of keywords) {
    const matches = siteindex.tags[keyword] || [];

    for (const match of matches) {
      const resultData = resultsMap.get(match);
      if (resultData) {
        resultData.score++;
        resultData.tags.push(keyword);
      } else {
        resultsMap.set(match, {
          score: 1,
          tags: [keyword],
        });
      }
    }
  }

  for (const [result, score] of resultsMap.entries()) {
    const resultData = resultsMap.get(result)!;
    const site = siteindex.sites[result];

    if (result.includes(q)) {
      resultData.score += 0.5;
    }
  }

  const results = Array.from(resultsMap).map(([result, resultData]) => {
    const site = siteindex.sites[result];

    return {
      url: result,
      webUrl: site.url,
      tags: resultData.tags,
      score: resultData.score,
    };
  });

  return results.sort((a, b) => a.score - b.score);
}
