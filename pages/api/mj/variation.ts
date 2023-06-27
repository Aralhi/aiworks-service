import { Midjourney } from 'midjourney';
import { ResponseError, completeCallback } from '../../../lib/MJ';
import { UAndVPayload } from './typing';

const client = new Midjourney({
  ServerId: <string>process.env.SERVER_ID,
  ChannelId: <string>process.env.CHANNEL_ID,
  SalaiToken: <string>process.env.SALAI_TOKEN,
  Debug: true,
  MaxWait: 600,
});

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    const { content, index, msgId, msgHash, flags, unionId } = (await req.json()) as UAndVPayload;
    console.log('variation.handler', content);
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        console.log('variation.start', content);
        client
          .Variation({
            content,
            index,
            msgId,
            flags,
            hash: msgHash,
            loading: (uri: string, progress: string) => {
              console.log('variation.loading', uri);
              controller.enqueue(encoder.encode(JSON.stringify({ uri, progress })));
            },
          })
          .then((res) => {
            console.log('variation.done', res);
            controller.enqueue(encoder.encode(JSON.stringify(res)));
            res && completeCallback(req.headers, { ...res, unionId });
            controller.close();
          })
          .catch((err: ResponseError) => {
            console.log('variation.error', err);
            controller.close();
          });
      },
    });
    return new Response(readable, {});
  } catch (e) {
    return new Response(JSON.stringify({ status: 'failed' }), { status: 500 });
  }
}
