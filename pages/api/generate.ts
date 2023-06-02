import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';

if (!process.env.OPEN_AI_KEYS) {
  throw new Error('Missing env var from OpenAI');
}

const OpenAIKeys: string[] = process.env.OPEN_AI_KEYS!.split(',');

export const config = {
  runtime: 'edge',
};

function request(openAIkeys: string[], payload: any, callback: (res?: Response) => void, retry?: (res: Response) => void) {
  if (openAIkeys.length === 0) {
    callback();
    return;
  }

  const randomIndex = Math.floor(Math.random() * openAIkeys.length);
  const openAIKey = openAIkeys[randomIndex];

  console.log('请求key', openAIKey);

  openAIkeys.splice(randomIndex, 1);

  fetchOpenAI(
    payload,
    openAIKey,
    (res) => {
      callback(res);
    },
    () => {
      request(openAIkeys, payload, callback, retry);
    },
  );
}

const fetchOpenAI = async (payload: any, openAIKey: string, successCb: (res?: Response) => void, errorCb: () => void) => {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAIKey ?? ''}`,
      },
      method: 'POST',
      body: JSON.stringify(payload),
    });
    successCb(res);
  } catch (e) {
    errorCb();
  }
};

function promise(openAIKeys: string[], payload: any) {
  return new Promise<Response | undefined>((resolve) => {
    request(openAIKeys, payload, (res) => {
      resolve(res);
    });
  });
}

const handler = async (req: Request) => {
  const { payload } = await req.json();
  if (!payload?.messages || !payload?.messages?.length) {
    return new Response('No prompt in the request', { status: 400 });
  }
  const { stream: isStream } = payload;
  const openAIKeys = [...OpenAIKeys];
  const res = await promise(openAIKeys, payload);
  console.log('响应结果', res);
  if (!res) {
    return new Response(JSON.stringify({ status: 'failed', message: '请求失败' }), {
      status: 500,
      headers: [['Content-Type', req.headers.get('Content-Type') as string]],
    });
  }
  if (!isStream) {
    const result = await res.json();
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } else {
    if (!res.ok) {
      const message = await res.json();
      throw new Error(`HTTP error! status: ${res.status}, ${message}`);
    }
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const stream = new ReadableStream({
      async start(controller) {
        // callback
        function onParse(event: ParsedEvent | ReconnectInterval) {
          if (event.type === 'event') {
            const data = event.data;
            // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
            if (data === '[DONE]') {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const text = json.choices[0].delta?.content || '';
              console.log('text', text);
              const queue = encoder.encode(text);
              controller.enqueue(queue);
            } catch (e) {
              // maybe parse error
              controller.error(e);
            }
          }
        }

        // stream response (SSE) from OpenAI may be fragmented into multiple chunks
        // this ensures we properly read chunks and invoke an event for each SSE event stream
        const parser = createParser(onParse);
        // https://web.dev/streams/#asynchronous-iteration
        for await (const chunk of res.body as any) {
          parser.feed(decoder.decode(chunk));
        }
      },
    });
    return new Response(stream);
  }
};

export default handler;
