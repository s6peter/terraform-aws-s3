export function githubClient(token = process.env.GH_TOKEN) {
  if (!token) throw new Error('GH_TOKEN is required');
  return async function api(path, options = {}) {
    const response = await fetch(`https://api.github.com/${path}`, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub API ${response.status} for ${path}: ${await response.text()}`);
    }
    return response.status === 204 ? undefined : response.json();
  };
}

export async function listAll(api, path) {
  const result = [];
  for (let page = 1; ; page++) {
    const items = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    result.push(...items);
    if (items.length < 100) return result;
  }
}
