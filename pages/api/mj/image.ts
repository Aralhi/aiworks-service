import { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.body;
  if (!url) {
    res.status(400).send({ status: 'failed', message: '图片不能为空' });
  }
  const headers = req.headers;
  const ossRes = await fetch('http://8.218.156.105:3000/api/mj/upload', {
    headers: {
      ...(headers as { [key: string]: string }),
    },
    method: 'POST',
    body: JSON.stringify(req.body),
  });
  const data = await ossRes.json();
  res.status(200).send(data);
}

export default handler;
