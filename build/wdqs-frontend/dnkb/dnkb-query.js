"use strict";
(() => {
  // src/lib/queryGuide.ts
  var QUERY_SERVICE = {
    site: "https://dnkb.cdn.uib.no",
    editor: "https://query.wbs.cdn.uib.no/",
    endpoint: "https://query.wbs.cdn.uib.no/sparql",
    wikibase: "https://wbs.cdn.uib.no",
    api: "https://wbs.cdn.uib.no/w/api.php",
    guide: "https://dnkb.cdn.uib.no/docs/querying",
    verifiedOn: "2026-10-27"
  };
  var wikibasePrefixes = (base) => ({
    wd: `${base}/entity/`,
    wdt: `${base}/prop/direct/`,
    p: `${base}/prop/`,
    ps: `${base}/prop/statement/`,
    pq: `${base}/prop/qualifier/`
  });
  var PREFIXES = {
    ...wikibasePrefixes(QUERY_SERVICE.wikibase),
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    xsd: "http://www.w3.org/2001/XMLSchema#",
    wikibase: "http://wikiba.se/ontology#",
    bd: "http://www.bigdata.com/rdf#"
  };
  var PREFIX_BLOCK = Object.entries(PREFIXES).map(([prefix, uri]) => `PREFIX ${prefix}: <${uri}>`).join("\n");
  var queryPrefixes = ["wd", "wdt", "rdfs"];
  var examplePrefixes = queryPrefixes.map((prefix) => `PREFIX ${prefix}: <${PREFIXES[prefix]}>`).join("\n");
  var frenchPeoplePattern = `  ?person wdt:P1/wdt:P108* wd:Q91 ;
          wdt:P55 wd:Q371 .`;
  var EXAMPLES = [
    {
      id: "french-citizens",
      title: "Humans with recorded French citizenship",
      category: "People",
      description: "Lists people recorded as French citizens, including instances of subclasses of Human. This does not restrict the list to authors.",
      query: `${examplePrefixes}

SELECT DISTINCT ?person ?name WHERE {
${frenchPeoplePattern}
  OPTIONAL { ?person rdfs:label ?name . FILTER(LANG(?name) = "en") }
}
ORDER BY ?name`
    },
    {
      id: "count-french-citizens",
      title: "Count humans with recorded French citizenship",
      category: "People",
      description: "Counts distinct person items, not author credits, language, or birthplace. Missing citizenship statements are excluded.",
      query: `${examplePrefixes}

SELECT (COUNT(DISTINCT ?person) AS ?people) WHERE {
${frenchPeoplePattern}
}`
    },
    {
      id: "flash-by-year",
      title: "Works using Adobe Flash, grouped by publication year",
      category: "Works",
      description: "Counts distinct creative works per recorded publication year and keeps undated works in an Unknown group. A work with dates in multiple years can appear in multiple groups.",
      query: `${examplePrefixes}

SELECT ?year (COUNT(DISTINCT ?work) AS ?works) WHERE {
  ?work wdt:P1/wdt:P108* wd:Q7007 ;
        wdt:P86 wd:Q97 .
  OPTIONAL {
    ?work wdt:P29 ?date .
    BIND(YEAR(?date) AS ?publicationYear)
  }
  BIND(COALESCE(STR(?publicationYear), "Unknown") AS ?year)
}
GROUP BY ?year
ORDER BY ?year`
    }
  ];

  // scripts/query-frontend.ts
  function installQueryFrontend(frontend) {
    const ns = frontend.RdfNamespaces;
    const localPrefixes = {
      ...PREFIXES,
      wds: `${QUERY_SERVICE.wikibase}/entity/statement/`,
      wdref: `${QUERY_SERVICE.wikibase}/reference/`,
      wdv: `${QUERY_SERVICE.wikibase}/value/`,
      wdno: `${QUERY_SERVICE.wikibase}/prop/novalue/`,
      wdtn: `${QUERY_SERVICE.wikibase}/prop/direct-normalized/`,
      psv: `${QUERY_SERVICE.wikibase}/prop/statement/value/`,
      psn: `${QUERY_SERVICE.wikibase}/prop/statement/value-normalized/`,
      pqv: `${QUERY_SERVICE.wikibase}/prop/qualifier/value/`,
      pqn: `${QUERY_SERVICE.wikibase}/prop/qualifier/value-normalized/`,
      pr: `${QUERY_SERVICE.wikibase}/prop/reference/`,
      prv: `${QUERY_SERVICE.wikibase}/prop/reference/value/`,
      prn: `${QUERY_SERVICE.wikibase}/prop/reference/value-normalized/`
    };
    Object.assign(ns.ALL_PREFIXES, localPrefixes);
    for (const prefix of Object.keys(ns.STANDARD_PREFIXES)) {
      if (prefix in localPrefixes) ns.STANDARD_PREFIXES[prefix] = `PREFIX ${prefix}: <${localPrefixes[prefix]}>`;
    }
    delete ns.NAMESPACE_SHORTCUTS.Wikidata;
    ns.NAMESPACE_SHORTCUTS.DNKB = localPrefixes;
    for (const [prefix, uri] of Object.entries(localPrefixes)) {
      if (prefix === "wd" || prefix === "wdata") ns.ENTITY_TYPES[uri] = "item";
      else if (uri.startsWith(`${QUERY_SERVICE.wikibase}/prop/`)) ns.ENTITY_TYPES[uri] = "property";
    }
    frontend.api.QuerySamples.prototype.getExamples = () => Promise.resolve(EXAMPLES.map((example) => {
      var _a2;
      return {
        title: example.title,
        query: example.query,
        category: example.category,
        href: `${QUERY_SERVICE.guide}#${example.id}`,
        tags: [...new Set((_a2 = example.query.match(/\b[QP]\d+\b/g)) != null ? _a2 : [])]
      };
    }));
    frontend.api.QuerySamples.prototype.getExamplesPageUrl = () => `${QUERY_SERVICE.guide}#examples`;
  }
  var _a;
  if (typeof window !== "undefined") {
    const frontend = window.wikibase.queryService;
    installQueryFrontend(frontend);
    const jquery = window.jQuery;
    jquery.i18n().load({ en: { "dnkb-query-guide": `Query DNKB with local prefixes and examples. <a href="${QUERY_SERVICE.guide}">Explore DNKB with AI and SPARQL</a>.` } });
    for (const selector of ["#help-label", "#query-helper-help"]) {
      const anchor = (_a = document.querySelector(selector)) == null ? void 0 : _a.closest("a");
      if (anchor) anchor.href = QUERY_SERVICE.guide;
    }
  }
})();
