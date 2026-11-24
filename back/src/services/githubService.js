const GITHUB_API = "https://api.github.com";

function getConfig() {
  const {
    GITHUB_TOKEN,
    GITHUB_OWNER,
    GITHUB_REPO,
    GITHUB_BRANCH = "main",
  } = process.env;

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error(
      "Faltan variables de entorno de GitHub (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)",
    );
  }

  return {
    token: GITHUB_TOKEN,
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    branch: GITHUB_BRANCH,
  };
}

function getHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function readJsonFile(filePath, fallbackValue) {
  const { token, owner, repo, branch } = getConfig();
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}?ref=${encodeURIComponent(branch)}`;

  const response = await fetch(url, {
    headers: getHeaders(token),
  });

  if (response.status === 404) {
    return { data: fallbackValue, sha: null };
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Error leyendo ${filePath} desde GitHub (${response.status}): ${errorText}`,
    );
  }

  const fileInfo = await response.json();
  const decodedContent = Buffer.from(fileInfo.content, "base64").toString(
    "utf8",
  );
  const parsedData = decodedContent.trim()
    ? JSON.parse(decodedContent)
    : fallbackValue;

  return {
    data: parsedData,
    sha: fileInfo.sha,
  };
}

async function writeJsonFile(filePath, data, commitMessage, currentSha = null) {
  const { token, owner, repo, branch } = getConfig();
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`;

  const jsonString = JSON.stringify(data, null, 2) + "\n";
  const encodedContent = Buffer.from(jsonString, "utf8").toString("base64");

  const body = {
    message: commitMessage,
    content: encodedContent,
    branch,
  };

  if (currentSha) {
    body.sha = currentSha;
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Error guardando ${filePath} en GitHub (${response.status}): ${errorText}`,
    );
  }

  const result = await response.json();
  return result.content?.sha || null;
}

module.exports = {
  readJsonFile,
  writeJsonFile,
};
