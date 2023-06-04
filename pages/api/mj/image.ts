import { NextApiRequest, NextApiResponse } from 'next';
import OSS from 'ali-oss';
import { Duplex } from 'stream';
import urllib from 'urllib';

const EXPIRES_TIME = 3600;
const client = new OSS({
  endpoint: process.env.OSS_ENDPOINT,
  bucket: process.env.OSS_BUCKET,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.OSS_ACCESS_SECRET!,
  timeout: 600000,
});

export const config = {
  api: {
    responseLimit: '20mb',
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).send({ status: 'failed', message: '图片不能为空' });
    }
    const stream = new Duplex();
    console.time('请求图片资源');
    const response = await urllib.request(url, { timeout: 600000 });

    console.log(response);
    if (response.status >= 400) {
      res.status(500).send({ status: 'failed' });
    }
    console.timeEnd('请求图片资源');

    const { headers } = response;

    console.log('Content-Length', headers['content-length']);
    console.log('Content-Type', headers['content-type']);

    const ext = headers['content-type']?.split('/')[1];

    console.time('流写入');
    stream.push(response.data);
    stream.push(null);
    console.timeEnd('流写入');

    const fileName = `${req.headers['x-salai-plaintext']}/${Date.now()}.${ext}`;

    console.time('oss上传');
    const ossRes = await client.putStream(fileName, stream);
    const ossUrl = await client.signatureUrl(ossRes.name, { expires: EXPIRES_TIME });
    console.timeEnd('oss上传');

    res.status(200).send({ status: 'ok', data: { url: ossUrl } });
  } catch (e) {
    console.error('图片上传失败', e);
    res.status(500).send({ status: 'failed' });
  }
};
export default handler;
