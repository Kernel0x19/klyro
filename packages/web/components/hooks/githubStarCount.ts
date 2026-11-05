export default async function getGitHubStars(): Promise<number> {
  try {
    const res = await fetch('https://api.github.com/repos/Kernel0x19/klyro', {
      next: { revalidate: 0 },
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    })
    if (!res.ok) return 0
    const data = await res.json()
    return data.stargazers_count ?? 0
  } catch {
    return 0
  }
}
