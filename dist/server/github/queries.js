export const DASHBOARD_QUERY = `
  query DashboardData($reviewQuery: String!, $myPRsQuery: String!) {
    reviewRequests: search(query: $reviewQuery, type: ISSUE, first: 30) {
      nodes {
        ... on PullRequest {
          id
          number
          title
          url
          isDraft
          author { login }
          createdAt
          repository { nameWithOwner }
          commits(last: 1) {
            nodes {
              commit {
                oid
                committedDate
                statusCheckRollup { state }
              }
            }
          }
          reviewDecision
          reviews(first: 50) {
            nodes {
              author { login }
              submittedAt
            }
          }
        }
      }
    }
    myPRs: search(query: $myPRsQuery, type: ISSUE, first: 20) {
      nodes {
        ... on PullRequest {
          id
          number
          title
          url
          isDraft
          author { login }
          createdAt
          repository { nameWithOwner }
          commits(last: 1) {
            nodes {
              commit {
                oid
                committedDate
                statusCheckRollup { state }
              }
            }
          }
          reviewDecision
          reviewThreads(first: 100) {
            nodes {
              isResolved
            }
          }
        }
      }
    }
  }
`;
