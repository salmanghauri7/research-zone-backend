import { XMLParser } from "fast-xml-parser";

const SEMANTIC_SCHOLAR_ENDPOINT =
  "https://api.semanticscholar.org/graph/v1/paper/search";
const ARXIV_ENDPOINT = "http://export.arxiv.org/api/query";
const DEFAULT_FIELDS = [
  "paperId",
  "title",
  "abstract",
  "year",
  "authors",
  "fieldsOfStudy",
  "openAccessPdf",
  "citationCount",
  "publicationDate",
  "venue",
].join(",");

const ARXIV_TO_S2_FIELD_OF_STUDY = {
  "cs.AI": "Computer Science",
  "cs.AR": "Computer Science",
  "cs.CC": "Computer Science",
  "cs.CE": "Computer Science",
  "cs.CG": "Computer Science",
  "cs.CL": "Computer Science",
  "cs.CR": "Computer Science",
  "cs.CV": "Computer Science",
  "cs.CY": "Computer Science",
  "cs.DB": "Computer Science",
  "cs.DC": "Computer Science",
  "cs.DL": "Computer Science",
  "cs.DM": "Computer Science",
  "cs.DS": "Computer Science",
  "cs.ET": "Computer Science",
  "cs.FL": "Computer Science",
  "cs.GL": "Computer Science",
  "cs.GR": "Computer Science",
  "cs.GT": "Computer Science",
  "cs.HC": "Computer Science",
  "cs.IR": "Computer Science",
  "cs.IT": "Computer Science",
  "cs.LG": "Computer Science",
  "cs.LO": "Computer Science",
  "cs.MA": "Computer Science",
  "cs.MM": "Computer Science",
  "cs.MS": "Computer Science",
  "cs.NA": "Computer Science",
  "cs.NE": "Computer Science",
  "cs.NI": "Computer Science",
  "cs.OH": "Computer Science",
  "cs.OS": "Computer Science",
  "cs.PF": "Computer Science",
  "cs.PL": "Computer Science",
  "cs.RO": "Computer Science",
  "cs.SC": "Computer Science",
  "cs.SD": "Computer Science",
  "cs.SE": "Computer Science",
  "cs.SI": "Computer Science",
  "cs.SY": "Computer Science",
  "math.AC": "Mathematics",
  "math.AG": "Mathematics",
  "math.AP": "Mathematics",
  "math.AT": "Mathematics",
  "math.CA": "Mathematics",
  "math.CO": "Mathematics",
  "math.CT": "Mathematics",
  "math.CV": "Mathematics",
  "math.DG": "Mathematics",
  "math.DS": "Mathematics",
  "math.FA": "Mathematics",
  "math.GM": "Mathematics",
  "math.GN": "Mathematics",
  "math.GR": "Mathematics",
  "math.GT": "Mathematics",
  "math.HO": "Mathematics",
  "math.IT": "Mathematics",
  "math.KT": "Mathematics",
  "math.LO": "Mathematics",
  "math.MG": "Mathematics",
  "math.MP": "Mathematics",
  "math.NA": "Mathematics",
  "math.NT": "Mathematics",
  "math.OA": "Mathematics",
  "math.OC": "Mathematics",
  "math.PR": "Mathematics",
  "math.QA": "Mathematics",
  "math.RA": "Mathematics",
  "math.RT": "Mathematics",
  "math.SG": "Mathematics",
  "math.SP": "Mathematics",
  "math.ST": "Mathematics",
  "physics.acc-ph": "Physics",
  "physics.ao-ph": "Physics",
  "physics.app-ph": "Physics",
  "physics.atm-clus": "Physics",
  "physics.atom-ph": "Physics",
  "physics.bio-ph": "Physics",
  "physics.chem-ph": "Physics",
  "physics.class-ph": "Physics",
  "physics.comp-ph": "Physics",
  "physics.data-an": "Physics",
  "physics.ed-ph": "Physics",
  "physics.flu-dyn": "Physics",
  "physics.gen-ph": "Physics",
  "physics.geo-ph": "Physics",
  "physics.hist-ph": "Physics",
  "physics.ins-det": "Physics",
  "physics.med-ph": "Physics",
  "physics.optics": "Physics",
  "physics.plasm-ph": "Physics",
  "physics.pop-ph": "Physics",
  "physics.soc-ph": "Physics",
  "physics.space-ph": "Physics",
  "cond-mat.dis-nn": "Physics",
  "cond-mat.mes-hall": "Physics",
  "cond-mat.mtrl-sci": "Materials Science",
  "cond-mat.other": "Physics",
  "cond-mat.quant-gas": "Physics",
  "cond-mat.soft": "Physics",
  "cond-mat.stat-mech": "Physics",
  "cond-mat.str-el": "Physics",
  "cond-mat.supr-con": "Physics",
  grp_physics: "Physics",
  "hep-ex": "Physics",
  "hep-lat": "Physics",
  "hep-ph": "Physics",
  "hep-th": "Physics",
  "nlin.AO": "Physics",
  "nlin.CD": "Physics",
  "nlin.CG": "Physics",
  "nlin.PS": "Physics",
  "nlin.SI": "Physics",
  "nucl-ex": "Physics",
  "nucl-th": "Physics",
  "quant-ph": "Physics",
  "gr-qc": "Physics",
  "astro-ph.CO": "Physics",
  "astro-ph.EP": "Physics",
  "astro-ph.GA": "Physics",
  "astro-ph.HE": "Physics",
  "astro-ph.IM": "Physics",
  "astro-ph.SR": "Physics",
  "stat.AP": "Mathematics",
  "stat.CO": "Mathematics",
  "stat.ME": "Mathematics",
  "stat.ML": "Computer Science",
  "stat.OT": "Mathematics",
  "stat.TH": "Mathematics",
  "q-bio.BM": "Biology",
  "q-bio.CB": "Biology",
  "q-bio.GN": "Biology",
  "q-bio.MN": "Biology",
  "q-bio.NC": "Biology",
  "q-bio.OT": "Biology",
  "q-bio.PE": "Biology",
  "q-bio.QM": "Biology",
  "q-bio.SC": "Biology",
  "q-bio.TO": "Biology",
  "econ.EM": "Economics",
  "econ.GN": "Economics",
  "econ.TH": "Economics",
  "eess.AS": "Engineering",
  "eess.IV": "Engineering",
  "eess.SP": "Engineering",
  "eess.SY": "Engineering",
  "chem.ph": "Chemistry",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parsePublishedDate = (paper) => {
  if (paper?.publicationDate) {
    const parsed = new Date(paper.publicationDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (paper?.year) {
    const parsed = new Date(`${paper.year}-01-01`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

export default async function fetchPapersFromSemanticScholar({
  query,
  fieldsOfStudy,
  limit = 100,
  offset = 0,
  publishedAfter,
  publishedBefore,
  requireOpenAccessPdf = true,
} = {}) {
  if (!query || String(query).trim() === "") {
    throw new Error("Search query is required");
  }

  const params = new URLSearchParams({
    query: String(query).trim(),
    fields: DEFAULT_FIELDS,
    limit: String(limit),
    offset: String(offset),
    openAccessPdf: "true",
  });

  if (Array.isArray(fieldsOfStudy) && fieldsOfStudy.length > 0) {
    params.set("fieldsOfStudy", fieldsOfStudy.join(","));
  }

  const url = `${SEMANTIC_SCHOLAR_ENDPOINT}?${params.toString()}`;

  let response;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(url);

    if (response.status !== 429) {
      break;
    }

    if (attempt < 2) {
      await sleep(300);
    }
  }

  if (response.status === 429) {
    return fetchPapersFromArxiv({
      query,
      fieldsOfStudy,
      limit,
      offset,
      publishedAfter,
      publishedBefore,
      requireOpenAccessPdf,
    });
  }

  if (!response.ok) {
    const error = new Error("Failed to fetch from Semantic Scholar");
    error.statusCode = response.status;
    throw error;
  }

  const responseData = await response.json();
  const rawPapers = Array.isArray(responseData?.data) ? responseData.data : [];

  const normalized = rawPapers.map((paper, index) => {
    const authors = Array.isArray(paper?.authors)
      ? paper.authors
          .map((author) => author.name)
          .filter(Boolean)
          .join(", ")
      : "";
    const fields = Array.isArray(paper?.fieldsOfStudy)
      ? paper.fieldsOfStudy
      : [];
    const publishedDate = paper?.publicationDate
      ? paper.publicationDate
      : paper?.year
        ? String(paper.year)
        : "";

    const pdfUrl = paper?.openAccessPdf?.url || "";

    return {
      id: paper?.paperId || String(index),
      title: paper?.title || "",
      summary: paper?.abstract || "",
      abstract: paper?.abstract || "",
      authors,
      published: publishedDate,
      category: fields[0] || "",
      categories: fields,
      link: pdfUrl,
    };
  });

  const filtered = normalized.filter((paper) => {
    if (requireOpenAccessPdf && !paper.link) {
      return false;
    }

    const publishedDate = parsePublishedDate(paper);
    if (!publishedDate) {
      return true;
    }

    if (publishedAfter && publishedDate < publishedAfter) {
      return false;
    }

    if (publishedBefore && publishedDate > publishedBefore) {
      return false;
    }

    return true;
  });

  return {
    papers: filtered,
    total: Number.isFinite(responseData?.total)
      ? responseData.total
      : filtered.length,
  };
}

function mapArxivCategoryToFieldOfStudy(category) {
  if (!category || typeof category !== "string") {
    return "";
  }

  return ARXIV_TO_S2_FIELD_OF_STUDY[category.trim()] || "";
}

function isArxivCategoryQuery(query) {
  if (!query || typeof query !== "string") {
    return false;
  }

  return Boolean(ARXIV_TO_S2_FIELD_OF_STUDY[query.trim()]);
}

async function fetchPapersFromArxiv({
  query,
  limit,
  offset,
  publishedAfter,
  publishedBefore,
  requireOpenAccessPdf,
}) {
  const isCategoryQuery = isArxivCategoryQuery(query);
  const searchQuery = isCategoryQuery
    ? `cat:${encodeURIComponent(query)}`
    : `all:${encodeURIComponent(query)}`;
  const arxivUrl = `${ARXIV_ENDPOINT}?search_query=${searchQuery}&start=${offset}&max_results=${limit}`;

  const response = await fetch(arxivUrl);
  if (!response.ok) {
    const error = new Error("Failed to fetch from arXiv");
    error.statusCode = response.status;
    throw error;
  }

  const xmlData = await response.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const jsonData = parser.parse(xmlData);

  const totalResults = Number(
    jsonData?.feed?.["opensearch:totalResults"] || 0,
  );

  let entries = jsonData?.feed?.entry || [];
  if (!Array.isArray(entries)) {
    entries = [entries];
  }

  const normalized = entries.map((entry, index) => {
    let authorsList = entry.author || [];
    if (!Array.isArray(authorsList)) {
      authorsList = [authorsList];
    }
    const authors = authorsList.map((author) => author.name).join(", ");

    let pdfLink = "";
    if (Array.isArray(entry.link)) {
      const pdfNode = entry.link.find((link) => link["@_title"] === "pdf");
      if (pdfNode) {
        pdfLink = pdfNode["@_href"] || "";
      }
    }

    const rawPrimaryCategory = entry["arxiv:primary_category"]?.["@_term"];
    const mappedCategory = mapArxivCategoryToFieldOfStudy(rawPrimaryCategory);
    const categories = [];
    if (mappedCategory) {
      categories.push(mappedCategory);
    }

    return {
      id: entry.id || String(index),
      title: entry.title ? entry.title.replace(/[\n\r]/g, " ").trim() : "",
      summary: entry.summary ? entry.summary.trim() : "",
      abstract: entry.summary ? entry.summary.trim() : "",
      authors,
      published: entry.published
        ? new Date(entry.published).toISOString().split("T")[0]
        : "",
      category: mappedCategory || "",
      categories,
      link: pdfLink,
    };
  });

  const filtered = normalized.filter((paper) => {
    if (requireOpenAccessPdf && !paper.link) {
      return false;
    }

    const publishedDate = parsePublishedDate(paper);
    if (!publishedDate) {
      return true;
    }

    if (publishedAfter && publishedDate < publishedAfter) {
      return false;
    }

    if (publishedBefore && publishedDate > publishedBefore) {
      return false;
    }

    return true;
  });

  return {
    papers: filtered,
    total: Number.isFinite(totalResults) ? totalResults : filtered.length,
  };
}
