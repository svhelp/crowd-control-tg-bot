import { bot } from '../src/bot';

export default async function handleRequest(request: Request) {
  if (!request.json) {
    console.error("Wrong request: " + JSON.stringify(request));
    return new Response("Something went wrong", { status: 500 });
  }

  try {
      bot.processUpdate(await request.json());
      return new Response("", { status: 200 });
  } catch (e) {
      console.error(e);
      return new Response("Something went wrong", { status: 500 });
  }
}
