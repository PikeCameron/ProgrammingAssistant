import { graphql } from '@octokit/graphql';
import { config } from '../config.js';

export const githubClient = graphql.defaults({
  headers: {
    authorization: `bearer ${config.githubToken}`,
  },
});
