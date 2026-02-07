export default class LeetCodeService {
    constructor() {
        this.cachedProblems = null;
    }

    async fetchAllQuestionsDifficulty() {
        const graphqlQuery = {
            query: `
                query allQuestions {
                    allQuestions {
                        questionId
                        difficulty
                    }
                }
            `,
        };
        try {
            const response = await fetch("https://leetcode.com/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(graphqlQuery),
            });
            const data = await response.json();
            return data.data?.allQuestions || [];
        } catch {
            return [];
        }
    }

    async getSolvedProblems() {
        try {
            if (this.cachedProblems) {
                return this.cachedProblems.filter(problem => problem.status === "ac");
            }
            const response = await fetch("https://leetcode.com/api/problems/all", {
                method: "GET",
                credentials: "include"
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            const data = await response.json();
            if (!data.user_name || data.user_name.trim() === "") {
                throw new Error(
                    "You haven't logged into your LeetCode Account. Please login to sync problems."
                );
            }
            this.cachedProblems = data.stat_status_pairs;
            return this.cachedProblems.filter(problem => problem.status === "ac");
        } catch (errorLog) {
            throw errorLog;
        }
    }

    async getSubmissionByLanguage(titleSlug) {
        try {
            await this.getSolvedProblems();
            const submissionsResponse = await fetch("https://leetcode.com/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    query: `
                        query submissionList(
                            $offset: Int!, 
                            $limit: Int!, 
                            $lastKey: String, 
                            $questionSlug: String!, 
                            $lang: Int, 
                            $status: Int
                        ) {
                            questionSubmissionList(
                                offset: $offset
                                limit: $limit
                                lastKey: $lastKey
                                questionSlug: $questionSlug
                                lang: $lang
                                status: $status
                            ) {
                                submissions {
                                    id
                                    title
                                    titleSlug
                                    status
                                    lang
                                    timestamp
                                }
                            }
                        }
                    `,
                    variables: {
                        questionSlug: titleSlug,
                        offset: 0,
                        limit: 20,
                        lastKey: null,
                        status: 10,
                    },
                }),
            });

            if (!submissionsResponse.ok) {
                const errorLog = new Error(`HTTP error: ${submissionsResponse.status}`);
                errorLog.needsPause = submissionsResponse.status === 429 || submissionsResponse.status >= 500;
                throw errorLog;
            }

            const submissionsData = await submissionsResponse.json();
            if (submissionsData.errors) {
                const error = new Error(
                    `GraphQL errors: ${submissionsData.errors.map(e => e.message).join(", ")}`
                );
                error.needsPause = true;
                throw error;
            }

            const submissions = submissionsData.data?.questionSubmissionList?.submissions || [];
            const acceptedSubmissions = submissions.filter(sub => sub.status === 10);
            if (acceptedSubmissions.length === 0) {
                return {};
            }

            const submissionsByLang = {};
            for (const submission of acceptedSubmissions) {
                const lang = submission.lang;
                const timestamp = parseInt(submission.timestamp);
                if (!submissionsByLang[lang] || timestamp > submissionsByLang[lang].timestamp) {
                    submissionsByLang[lang] = {
                        id: submission.id,
                        title: submission.title,
                        timestamp: timestamp,
                        lang: lang
                    };
                }
            }

            const result = {};
            for (const lang in submissionsByLang) {
                await this.getSolvedProblems();
                const submissionId = submissionsByLang[lang].id;

                const detailsResponse = await fetch("https://leetcode.com/graphql", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        query: `
                            query submissionDetails($submissionId: Int!) {
                                submissionDetails(submissionId: $submissionId) {
                                    code
                                    timestamp
                                    question {
                                        titleSlug
                                    }
                                }
                            }
                        `,
                        variables: { submissionId },
                    }),
                });

                if (!detailsResponse.ok) {
                    const error = new Error(`HTTP error: ${detailsResponse.status}`);
                    error.needsPause = detailsResponse.status === 429 || detailsResponse.status >= 500;
                    throw error;
                }

                const detailsData = await detailsResponse.json();
                if (detailsData.errors) {
                    const error = new Error(
                        `GraphQL errors: ${detailsData.errors.map(e => e.message).join(", ")}`
                    );
                    error.needsPause = true;
                    throw error;
                }

                const details = detailsData.data?.submissionDetails;
                if (!details?.code) {
                    continue;
                }

                result[lang] = {
                    questionId: details.question.titleSlug,
                    title: this.kebabToPascalCase(details.question.titleSlug),
                    titleSlug: details.question.titleSlug,
                    status_display: "Accepted",
                    code: details.code,
                    timestamp: details.timestamp,
                    lang: lang,
                };
            }

            return result;
        } catch (error) {
            throw error;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    kebabToPascalCase(str) {
        return str
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join("");
    }
}
