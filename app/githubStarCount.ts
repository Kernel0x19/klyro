import { unstable_cache } from "next/cache";

export default async function getGitHubStars(): Promise<number> {
  return unstable_cache(
    async () => {
      try {
        const res = await fetch(
          "https://api.github.com/repos/Kernel0x19/klyro",
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
              ...(process.env.GITHUB_TOKEN && {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              }),
            },
          },
        );
        if (!res.ok) return 0;
        const data = await res.json();
        return data.stargazers_count ?? 0;
      } catch {
        return 0;
      }
    },
    ["github-star-count"],
    { revalidate: 60 },
  )();
}
