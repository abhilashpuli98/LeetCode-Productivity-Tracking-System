export default class LeetCodeService {
  constructor({
    concurrency = 3,
    baseDelay = 500,
    cacheTTL = 24 * 60 * 60 * 1000 // 24 hours
  } = {}) {
    this.concurrency = concurrency;
    this.baseDelay = baseDelay;
    this.cacheTTL = cacheTTL;

    this.activeRequests = 0;
    this.queue = [];
  }

  /* -------------------- RATE LIMITED GRAPHQL -------------------- */

async graphqlFetch(query, variables = {}) {
  return this.enqueue(async () => {
    let delay = this.baseDelay;
    let attempts = 0;
    const MAX_RETRIES = 5;

    while (attempts < MAX_RETRIES) {
      attempts++;

      const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });

      if (res.status === 429 || res.status >= 500) {
        delay = Math.min(delay * 2, 8000);
        await this.sleep(delay);
        continue;
      }

      if (!res.ok) {
        throw new Error(`GraphQL failed: ${res.status}`);
      }

      const json = await res.json();
      if (json.errors) {
        throw new Error(json.errors.map(e => e.message).join(", "));
      }

      return json.data;
    }

    throw new Error("GraphQL retry limit exceeded");
  });
}


  /* -------------------- CONCURRENCY QUEUE -------------------- */

  enqueue(task) {
    return new Promise((resolve, reject) => {
      const run = async () => {
        this.activeRequests++;
        try {
          resolve(await task());
        } catch (e) {
          reject(e);
        } finally {
          this.activeRequests--;
          const next = this.queue.shift();
          if (next) Promise.resolve().then(next);
        }
      };

      if (this.activeRequests < this.concurrency) run();
      else this.queue.push(run);
    });
  }

  /* -------------------- PUBLIC API -------------------- */

  async fetchAllQuestionsDifficulty() {
    try {
      const data = await this.graphqlFetch(`
        query {
          allQuestions {
            questionId
            difficulty
          }
        }
      `);
      return data?.allQuestions || [];
    } catch {
      return [];
    }
  }

  async getSolvedProblems() {
    try {
      console.log("[LeetCodeService.getSolvedProblems] Fetching solved problems...");
      
      if (this.cachedProblems) {
        const solved = this.cachedProblems.filter((problem) => problem.status === "ac");
        console.log("[LeetCodeService.getSolvedProblems] Found " + solved.length + " solved problems from cache");
        return solved;
      }

      const response = await fetch("https://leetcode.com/api/problems/all/", {
        method: "GET",
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Verify user authentication by checking username presence
      if (!data.user_name || data.user_name.trim() === "") {
        throw new Error(
          "You have not logged in to LeetCode. Please log in for syncing problems."
        );
      }

      this.cachedProblems = data.stat_status_pairs;
      const solved = this.cachedProblems.filter((problem) => problem.status === "ac");
      console.log("[LeetCodeService.getSolvedProblems] Found " + solved.length + " solved problems from LeetCode API");

      return solved;
    } catch (error) {
      console.error("[LeetCodeService.getSolvedProblems] Error:", error);
      throw error;
    }
  }

  async getSubmissionsByLanguage(titleSlug, forceRefresh = false) {
    const cacheKey = `leetcode_submissions_${titleSlug}`;
    const cache = await this.loadCache(cacheKey);

    if (!forceRefresh && this.isCacheValid(cache)) {
      return cache.data;
    }

    const list = await this.graphqlFetch(
      `
      query($slug:String!) {
        questionSubmissionList(
          offset:0,
          limit:50,
          questionSlug:$slug,
          status:10
        ) {
          submissions {
            id
            lang
            timestamp
          }
        }
      }`,
      { slug: titleSlug }
    );

    try {
      const submissions = list?.questionSubmissionList?.submissions || [];
      if (!submissions.length) return {};

      const latest = {};
      for (const s of submissions) {
        if (!latest[s.lang] || s.timestamp > latest[s.lang].timestamp) {
          latest[s.lang] = s;
        }
      }

      const details = await Promise.all(
        Object.values(latest).map(s => this.fetchSubmissionDetails(s.id))
      );

      const result = {};
      details.forEach(d => {
        if (d) result[d.lang] = d;
      });

      await this.saveCache(cacheKey, {
        timestamp: Date.now(),
        data: result
      });

      return result;
    } catch (error) {
      console.error(`Error fetching submissions for ${titleSlug}:`, error);
      return {};
    }
  }

  async fetchSubmissionDetails(id) {
    const data = await this.graphqlFetch(
      `
      query($id:Int!) {
        submissionDetails(submissionId:$id) {
          code
          timestamp
          lang { name }
          question {
            questionId
            titleSlug
          }
        }
      }`,
      { id }
    );

    const d = data?.submissionDetails;
    if (!d?.code) return null;

    return {
      questionId: d.question.questionId,
      titleSlug: d.question.titleSlug,
      title: this.kebabToPascalCase(d.question.titleSlug),
      code: d.code,
      timestamp: d.timestamp,
      lang: d.lang.name,
      status_display: "Accepted"
    };
  }

  /* -------------------- CACHE (MV3 SAFE) -------------------- */

  async saveCache(key, value) {
    await chrome.storage.local.set({ [key]: value });
  }

  async loadCache(key) {
    const res = await chrome.storage.local.get(key);
    return res[key] || null;
  }

  isCacheValid(entry) {
    return entry && Date.now() - entry.timestamp < this.cacheTTL;
  }

  /* -------------------- UTILS -------------------- */

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  kebabToPascalCase(str) {
    return str
      .split("-")
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join("");
  }
}
