// Shared CORS headers for Crivo edge functions.
//
// Set the ALLOWED_ORIGIN function secret in production to pin the app origin
// (e.g. `supabase secrets set ALLOWED_ORIGIN=https://app.crivo.pt`).
// Defaults to '*' so local development and previews keep working without
// extra configuration.
export const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};
