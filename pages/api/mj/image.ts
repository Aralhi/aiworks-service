import { NextApiRequest, NextApiResponse } from 'next';
import OSS from 'ali-oss';
import { Duplex } from 'stream';
import urllib from 'urllib';

/** 图片过期时间1年 */
const EXPIRES_TIME = 31536000;
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

    if (response.status >= 400) {
      res.status(500).send({ status: 'failed' });
      return;
    }
    console.timeEnd('请求图片资源');

    console.log('Content-Length', response.headers['content-length']);
    console.log('Content-Type', response.headers['content-type']);

    console.time('流写入');
    stream.push(response.data);
    stream.push(null);
    console.timeEnd('流写入');

    const fileName = `${req.headers['x-salai-plaintext']}-${Date.now()}`;

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