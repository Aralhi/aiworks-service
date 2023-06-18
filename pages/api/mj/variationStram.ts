import { Midjourney } from 'mj-api-fork';
import { NextApiRequest, NextApiResponse } from 'next';
import { ResponseError } from '../../../lib/MJ';

const client = new Midjourney({
  ServerId: <string>process.env.SERVER_ID,
  ChannelId: <string>process.env.CHANNEL_ID,
  SalaiToken: <string>process.env.SALAI_TOKEN,
  Debug: true,
  MaxWait: 600,
});

export interface MJStreamPayload {
  content: string;
  index: number;
  msgId: string;
  msgHash: string;
  isStream: boolean;
}

function MJStream({ content, index, msgId, msgHash, isStream }: MJStreamPayload) {
  const encoder = new TextEncoder();

  /** 流式响应 */
  if (isStream) {
    const stream = new ReadableStream({
      async start(controller) {
        client
          .Variation(content, index, msgId, msgHash, (uri: string, progress: string) => {
            console.log('variation.loading', uri);
            controller.enqueue(encoder.encode(JSON.stringify({ uri, progress })));
          })
          .then((msg) => {
            console.log('variation.done', msg);
            controller.enqueue(encoder.encode(JSON.stringify(msg)));
            controller.close();
          })
          .catch((err: ResponseError) => {
            console.log('variation.error', err);
            controller.close();
          });
      },
    });
    return stream;
  } else {
    /** 非流式响应 */
    return new Promise((resolve, reject) => {
      client
        .Variation(content, index, msgId, msgHash)
        .then((res) => {
          resolve(res);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { content, index, msgId, msgHash, unionId, isStream = true } = req.body || {};
  if (isStream) {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Transfer-Encoding', 'chunked');
  }
  const stream = await MJStream({
    content,
    index,
    msgHash,
    msgId,
    isStream,
  });

  return stream;
}

export default handler;
