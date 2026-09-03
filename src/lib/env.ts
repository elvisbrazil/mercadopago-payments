export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function webhookUrl(): string | undefined {
  const url = appUrl();
  return url.startsWith("https://") ? `${url}/api/webhooks/mercadopago` : undefined;
}
