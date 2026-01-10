import siteindexraw from "@generated/siteindex.json";

export interface SearchResult {
  url: string;
  tags: string[];
  score: number; // Used for ranking
}

const siteindex = siteindexraw as {
  sites: Record<string, any>;
  tags: Record<string, string[]>;
};

export function generateGoggleNet(query: string): string {
  let results = getResults(query);
  let isResults = !(results.length === 0);

  console.log(results);

  let mlresults = "";
  for (const result of results) {
    mlresults += `
      <box>
        <text>
          <link to="${result.url}">${result.url}</link>
        </text>
      </box>
    `;
  }

  let resultsString = isResults
    ? mlresults
    : `<text>THERE ARE NO RESULTS FOR ${query} :(((((</text>`;

  let html = `
    <text><link to="goggle.net">BACK TO GOGGLE DOT NET HOMEPAGE</link></text>
    <heading>goggle dot net results for "${query}"</heading>
    <box height=20></box>
    ${resultsString}
  `;
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
      tags: resultData.tags,
      score: resultData.score,
    };
  });

  return results.sort((a, b) => b.score - a.score);
}
