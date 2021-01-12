import { hmac } from "https://denopkg.com/chiefbiiko/hmac/mod.ts";

export async function handler(req: any) {
  const development = Deno.env.get("DEVELOPMENT");
  const boardId = Deno.env.get("BOARD_ID")!;
  const doneListId = Deno.env.get("DONE_LIST_ID")!;
  const todoListId = Deno.env.get("TODO_LIST_ID")!;
  const trelloApiToken = Deno.env.get("TRELLO_API_TOKEN")!;
  const trelloApiKey = Deno.env.get("TRELLO_API_KEY")!;
  const trelloAppSecret = Deno.env.get("TRELLO_APP_SECRET")!;
  const callbackUrl = Deno.env.get("CALLBACK_URL")!;

  if (
    !development &&
    !verifyTrelloWebhookRequest(req, trelloAppSecret, callbackUrl)
  ) {
    return {
      statusCode: 403,
    };
  }

  const cardsResponse = await fetch(
    `https://api.trello.com/1/boards/${boardId}/cards?key=${trelloApiKey}&token=${trelloApiToken}`
  );

  const cards: any[] = await cardsResponse.json();

  const cardsInDone: any[] = cards.filter(
    (card: any) => card.idList === doneListId
  );

  const handleDoneCards = cardsInDone.map((card: any) =>
    (async () => {
      const daysBetween = parseInt(
        (card.desc as string | null)?.match(/\[days-between=(\d+)\]/)?.[1] ??
          "1"
      );

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysBetween);
      card.due = dueDate.toISOString();

      await fetch(
        `https://api.trello.com/1/cards/${card.id}?${queryParams({
          key: trelloApiKey,
          token: trelloApiToken,
          due: card.due,
          idList: todoListId,
        })}`,
        {
          method: "PUT",
        }
      );
    })()
  );

  await Promise.all(handleDoneCards);

  const sortedCards = cards.sort(
    (a, b) => new Date(a.due).getTime() - new Date(b.due).getTime()
  );
  const sortCards = cards.map((card) =>
    (async () => {
      const index = sortedCards.indexOf(card);
      await fetch(
        `https://api.trello.com/1/cards/${card.id}?${queryParams({
          key: trelloApiKey,
          token: trelloApiToken,
          pos: index.toString(),
        })}`,
        {
          method: "PUT",
        }
      );
    })()
  );

  await Promise.all(sortCards);

  return {
    statusCode: 200,
  };
}

function verifyTrelloWebhookRequest(
  req: any,
  secret: string,
  callbackURL: string
) {
  const content = req.body + callbackURL;
  const hash = hmac("sha1", secret, content, "utf8", "base64");
  const headerHash = req.headers["x-trello-webhook"];

  return hash == headerHash;
}

function queryParams(params: { [key: string]: string }) {
  return Object.keys(params)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");
}
