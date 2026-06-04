import TopNav from "./TopNav";

export default function BuildInfo() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  const date = new Date().toISOString().slice(0, 10);

  const label = sha ? `${sha} · ${date}` : "dev";

  return <TopNav buildLabel={label} />;
}
