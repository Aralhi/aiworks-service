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
  const { content, index, msgId, msgHash, flags, unionId } = (await req.json()) as UAndVPayload;
  console.log('upscale.handler', content);
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      console.log('upscale.start', content);
      client
        .Upscale({
          content,
          index,
          msgId,
          flags,
          hash: msgHash,
          loading: (uri: string, progress: string) => {
            console.log('upscale.loading', uri);
            controller.enqueue(encoder.encode(JSON.stringify({ uri, progress })));
          },
        })
        .then((res) => {
          console.log('upscale.done', res);
          controller.enqueue(encoder.encode(JSON.stringify(res)));
          res && completeCallback(req.headers, { ...res, unionId });
          controller.close();
        })
        .catch((err: ResponseError) => {
          console.log('upscale.error', err);
          controller.close();
        });
    },
  });
  return new Response(readable, {});
}
