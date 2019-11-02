const {
  __impl: { isNbcBusinessArticleLink },
  isNbcBetterHref,
  isNbcFeatureNbcOutHref
} = require("./nbc-utils");

describe("nbc utils", () => {
  it('should not collect certain "busines" hrefs', () => {
    const badHrefs = ["https://www.nbcnews.com/business/consumer"];
    expect(isNbcBusinessArticleLink({ href: badHrefs[0] })).toBeFalsy();
  });

  it('should know about "better" hrefs', () => {
    const exampleHref =
      "https://www.nbcnews.com/better/lifestyle/travel-website-you-re-using-says-there-s-only-1-ncna1073066";
    expect(isNbcBetterHref(exampleHref)).toBeTruthy();
  });

  it('should know about "feature/nbc-out" hrefs', () => {
    const exampleHref =
      "https://www.nbcnews.com/feature/nbc-out/almost-30-percent-bisexual-women-trans-people-live-poverty-report-n1073501";
    expect(isNbcFeatureNbcOutHref(exampleHref)).toBeTruthy();
  });
});
