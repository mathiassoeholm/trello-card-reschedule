import { hmac } from "https://denopkg.com/chiefbiiko/hmac/mod.ts";

export async function handler(req: any) {
  // Verify Trello signature, return unauthorized if not match
  // Get all cards in the done column
  // Change due data based on some sort of `days_between` field
  // Move the card back to the todo column
  // Sort todo column based on due date
  console.log(req);

  if (
    !verifyTrelloWebhookRequest(
      req,
      Deno.env.get("TRELLO_APP_SECRET")!,
      Deno.env.get("CALLBACK_URL")!
    )
  ) {
    console.log("403, not authorized");
    return {
      statusCode: 403,
    };
  }

  console.log("200, ok");
  return {
    statusCode: 200,
  };
}

function verifyTrelloWebhookRequest(
  req: any,
  secret: string,
  callbackURL: string
) {
  const content = JSON.stringify(req.body) + callbackURL;
  const hash = hmac("sha1", secret, content, "utf8", "base64");
  const headerHash = req.headers["x-trello-webhook"];

  console.log("hash", hash);
  console.log("headerHash", headerHash);

  return hash == headerHash;
}
