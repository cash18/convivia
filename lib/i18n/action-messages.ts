import { translate } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/server";

/** Messaggi i18n dentro Server Actions (locale richiesta corrente). */
export async function ta(key: string): Promise<string> {
  const m = await getMessages();
  return translate(m, key);
}
