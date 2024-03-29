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

const handler = async (req: Request) => {
  const { unionId, prompt, isStream = true } = await req.json();
  console.log('imagine.handler', prompt);
  if (!isStream) {
    try {
      const res = await client.Imagine(prompt);
      return new Response(JSON.stringify(res), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      console.error('imagine.error', e);
      return new Response(JSON.stringify({ status: 'failed', message: (e as Error)?.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } else {
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        console.log('imagine.start', prompt);
        client
          .Imagine(prompt, (uri: string, progress: string, ...args) => {
            console.log('imagine.loading', uri, progress, ...args);
            controller.enqueue(encoder.encode(JSON.stringify({ uri, progress })));
          })
          .then((res) => {
            console.log('imagine.done', res);
            controller.enqueue(encoder.encode(JSON.stringify(res)));
            res && completeCallback(req.headers, { ...res, unionId });
            controller.close();
          })
          .catch((err: ResponseError) => {
            console.log('imagine.error', err);
            controller.close();
          });
      },
    });
    return new Response(readable, {});
  }
};
export default handler;
