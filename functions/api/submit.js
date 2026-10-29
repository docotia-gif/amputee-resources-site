// Cloudflare Pages Function — handles the "submit resource" form and appends the
// row to the Google Sheet. Secrets come from Cloudflare env (SPREADSHEET_ID,
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN), NOT from code.
//
// Deploy this to the amputeeresources site's Cloudflare Pages project, then set
// the four env vars in the Cloudflare dashboard (or via wrangler secret put).

export async function onRequestPost(context) {
  try {
    // --- parse the form body ---
    const body = await context.request.json().catch(() => ({}));
    const {
      name = "",
      email = "",
      category = "",
      resname = "",
      url = "",
      description = "",
      notes = "",
    } = body;

    // --- load the Google OAuth / Sheet credentials from env ---
    const { SPREADSHEET_ID, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } =
      context.env;

    if (!SPREADSHEET_ID || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      return new Response(
        JSON.stringify({ error: "missing Google credentials (check Cloudflare env)" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- 1. refresh a Google access token (Sheets scope) ---
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: GOOGLE_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
    });
    const { access_token } = await tokenRes.json();
    if (!access_token) {
      return new Response(JSON.stringify({ error: "could not refresh Google token" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- 2. append the row to the Google Sheet ---
    // values:append adds a new row after the last used row. (batchUpdate to a
    // fixed range like A2:G2 would overwrite the previous submission each time.)
    const payload = {
      values: [
        [new Date().toISOString(), name, category, resname, description, url, email, notes],
      ],
    };
    const sheetRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent("Submissions!A:H")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!sheetRes.ok) {
      const err = await sheetRes.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: "Google sheet write failed", details: err }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Submitted — thanks. We'll review and add it when approved." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
