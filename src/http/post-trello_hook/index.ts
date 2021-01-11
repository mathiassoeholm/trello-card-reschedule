export async function handler(req: any) {
  // Verify Trello signature, return unauthorized if not match
  // Get all cards in the done column
  // Change due data based on some sort of `days_between` field
  // Move the card back to the todo column
  // Sort todo column based on due date
  console.log("api key", Deno.env.get("TRELLO_API_KEY"));
  console.log(JSON.stringify(req.body));

  return {
    statusCode: 200,
  };
}
