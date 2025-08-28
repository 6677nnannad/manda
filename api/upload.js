
// /api/upload.js
export default async function handler(req, res) {
  // 设置CORS头，允许前端访问
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允许POST请求' });
  }

  try {
    const { type, content, filename } = req.body;

    if (!type || !content || !filename) {
      return res.status(400).json({ error: '缺少必要参数: type, content 或 filename' });
    }

    // 确定目标文件夹
    const folder = type === 'image' ? 'img' : 'txa';
    const apiUrl = `https://api.github.com/repos/6677nnannad/manda/contents/${folder}/${filename}`;
    
    const authToken = process.env.GITHUB_TOKEN;

    if (!authToken) {
      return res.status(500).json({ error: '服务器配置错误: 缺少GitHub Token' });
    }

    // 准备GitHub API请求
    const githubResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${authToken}`,
        'User-Agent': 'Manda-App',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `添加${type === 'image' ? '图片' : '文本'}: ${filename}`,
        content: Buffer.from(content).toString('base64')
      })
    });

    const githubData = await githubResponse.json();

    if (!githubResponse.ok) {
      console.error('GitHub API错误:', githubData);
      return res.status(githubResponse.status).json({ 
        error: '上传到GitHub失败',
        details: githubData 
      });
    }

    // 返回成功响应
    res.status(200).json({ 
      success: true, 
      message: '上传成功!',
      url: githubData.content.html_url
    });

  } catch (error) {
    console.error('服务器错误:', error);
    res.status(500).json({ error: '内部服务器错误', details: error.message });
  }
}
