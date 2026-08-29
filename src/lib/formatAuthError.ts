export function formatAuthError(message: string): string {
  if (/invalid api key/i.test(message)) {
    return (
      "Invalid Supabase API key. Open your Supabase dashboard → Settings → API, " +
      "copy the Project URL and anon/public key into .env.local, then restart the dev server."
    );
  }
  return message;
}
