// /api/receive.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '只允许GET请求' });
  }

  try {
    const { type } = req.query;
    
    if (!type || (type !== 'image' && type !== 'text')) {
      return res.status(400).json({ error: '需要指定类型参数: image 或 text' });
    }

    const folder = type === 'image' ? 'img' : 'txa';
    const apiUrl = `https://api.github.com/repos/6677nnannad/manda/contents/${folder}`;
    
    const authToken = process.env.GITHUB_TOKEN;

    if (!authToken) {
      return res.status(500).json({ error: '服务器配置错误: 缺少GitHub Token' });
    }

    const githubResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${authToken}`,
        'User-Agent': 'Manda-App',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const githubData = await githubResponse.json();

    if (!githubResponse.ok) {
      console.error('GitHub API错误:', githubData);
      return res.status(githubResponse.status).json({ 
        error: '从GitHub获取数据失败',
        details: githubData 
      });
    }

    const files = githubData.map(item => ({
      name: item.name,
      path: item.path,
      url: item.download_url,
      sha: item.sha, // 重要：删除时需要这个值
      size: item.size,
      type: item.type
    }));

    res.status(200).json({ 
      success: true,
      files: files
    });

  } catch (error) {
    console.error('服务器错误:', error);
    res.status(500).json({ error: '内部服务器错误', details: error.message });
  }
}
