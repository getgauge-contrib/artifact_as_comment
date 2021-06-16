const core = require("@actions/core"),
  github = require("@actions/github"),
  Adm = require("adm-zip"),
  commentHeader =
    "<!-- Autogenerated Comment. Do not edit. This comment was generated by post-benchmarks action -->";

var inputs = {
  secret: core.getInput("token"),
  workFlowFileName: core.getInput("workflow_file_name"),
  artifactName: core.getInput("artifact_name"),
  fileName: core.getInput("file_name"),
};

(async (opts) => {
  try {
    let octokit = github.getOctokit(opts.secret);
    var openPRs = await octokit.pulls.list({ ...github.context.repo, state: "open" });
    if (openPRs.data.length === 0) {
      core.info(`No open PRs found in ${github.context.repo.owner}/${github.context.repo.repo}`);
      return;
    }
    let workflows = await octokit.actions.listRepoWorkflows(github.context.repo);
    let workflowId = workflows.data.workflows.find(
      (x) => x.path === opts.workFlowFileName
    ).id;
    let runs = await octokit.actions.listWorkflowRuns({
      ...github.context.repo,
      workflow_id: workflowId,
    });
    openPRs.data.forEach(async (p) => {
      try {
        var match = runs.data.workflow_runs.find(
          (w) => w.head_sha === p.head.sha
        );
        if (match) {
          let artifacts = await octokit.actions.listWorkflowRunArtifacts({
            ...github.context.repo,
            run_id: match.id,
          });
          var benchmarkArtifact = artifacts.data.artifacts.find(
            (a) => a.name === opts.artifactName
          );
          if (benchmarkArtifact) {
            const zip = await octokit.actions.downloadArtifact({
              ...github.context.repo,
              artifact_id: benchmarkArtifact.id,
              archive_format: "zip",
            });
            var adm = new Adm(Buffer.from(zip.data));
            var comment = `${commentHeader}
${adm.readAsText(adm.getEntry(opts.fileName))}

---
See [Workflow log](${match.html_url}) for more details.`;
            var prComments = (
              await octokit.issues.listComments({
                ...github.context.repo,
                issue_number: p.number,
              })
            ).data;
            var existingBenchmarkComment = prComments.find(
              (c) => c.body.split("\n")[0] === commentHeader
            );
            if (existingBenchmarkComment) {
              core.info(
                `updating comment ${existingBenchmarkComment.html_url}`
              );
              await octokit.issues.updateComment({
                ...github.context.repo,
                comment_id: existingBenchmarkComment.id,
                body: comment,
              });
            } else {
              core.info(`adding comment to ${p.html_url}`);
              await octokit.issues.createComment({
                ...github.context.repo,
                issue_number: p.number,
                body: comment,
              });
            }
          } else {
            core.info(
              `no benchmark result found for run ${match.url} (PR #${p.id})`
            );
          }
        }
      } catch (error) {
        core.error(error);
      }
    });
  } catch (error) {
    core.error(error.message);
    core.setFailed(error.message);
  }
})(inputs);
