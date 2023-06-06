import { Midjourney } from 'midjourney';
import { ResponseError, completeCallback } from '../../../lib/MJ';

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
  const { content, index, msgId, msgHash, unionId } = await req.json();
  console.log('variation.handler', content);
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      console.log('variation.start', content);
      client
        .Variation(content, index, msgId, msgHash, (uri: string, progress: string) => {
          console.log('variation.loading', uri);
          controller.enqueue(encoder.encode(JSON.stringify({ uri, progress })));
        })
        .then((msg) => {
          console.log('variation.done', msg);
          controller.enqueue(encoder.encode(JSON.stringify(msg)));
          completeCallback(req.headers, { ...msg, unionId });
          controller.close();
        })
        .catch((err: ResponseError) => {
          console.log('variation.error', err);
          controller.close();
        });
    },
  });
  return new Response(readable, {});
}
