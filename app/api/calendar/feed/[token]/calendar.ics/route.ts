import { getCalendarFeedIcsResponse } from "@/lib/calendar-feed-response";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  return getCalendarFeedIcsResponse(token);
}
