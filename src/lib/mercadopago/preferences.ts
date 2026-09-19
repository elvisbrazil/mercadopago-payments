import { centsToAmount } from "@/lib/money";
import { mpRequest } from "./client";

export type PreferenceItem = {
  id: string;
  title: string;
  quantity: number;
  unitPriceCents: number;
};

export type PreferenceInput = {
  items: PreferenceItem[];
  externalReference: string;
  baseUrl: string;
  notificationUrl?: string;
};

type Preference = {
  id: string;
  init_point: string;
};

export async function createPreference(input: PreferenceInput) {
  const preference = await mpRequest<Preference>("/checkout/preferences", {
    method: "POST",
    body: {
      items: input.items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: centsToAmount(item.unitPriceCents),
        currency_id: "BRL",
      })),
      back_urls: {
        success: `${input.baseUrl}/checkout/success`,
        pending: `${input.baseUrl}/checkout/pending`,
        failure: `${input.baseUrl}/checkout/failure`,
      },
      auto_return: "approved",
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
    },
  });

  return { id: preference.id, initPoint: preference.init_point };
}
