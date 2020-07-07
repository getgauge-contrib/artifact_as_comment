# artifact_as_comment

## What?

Fetches an artifact file and adds it inline as a comment to a Pull request.

## Why?

Certain jobs' output are useful to have in the PR without navigating away. For example, a code coverage report, or a benchmark run.

Github Actions' scope is limited to `read` access when running against a Pull Request created from a fork. While this is understandable, it limits the ability
of Github Action to publish results mentioned above.

## How?

The roundabout (hacky?) way:

- Use this action to schedule a workflow to run periodically, to scan open pull requests, 
  and it's latest workflow runs to determine if there is an output worth publishing.

- if there's a match, fetch the artifact and post it's content as a comment.

- get the pull request actions to run the jobs and store the output in a certain file.

> *Note:* The filename and artifact name configured in the generating job and the publishing job must match.

## Credits

This [repository](https://github.com/nyurik/auto_pr_comments_from_forks) validated our theory that an event based mechanism is not currently possible. Thank you @nyurik.

> *Note:* @nyurik's repository uses bash/jq/curl. This approach uses javascript, and thus avoids the Docker overhead.

## License

[MIT](LICENSE)
