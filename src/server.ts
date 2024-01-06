import { bot } from './bot';

export default async function handleRequest(request: Request) {
  try {
      bot.processUpdate(await request.json());
      return new Response("", { status: 200 });
  } catch (e) {
      console.error(e);
      return new Response("Something went wrong", { status: 500 });
  }
}
