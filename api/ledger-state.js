const SUPABASE_URL = process.env.SUPABASE_URL || "https://ezybifdvihklonpntabw.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Imvi3sQHNYxFDeJkhLc9OQ_xArkCUmg";

export default async function handler(req, res){
  if(!["GET", "POST"].includes(req.method)){
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authorization = req.headers.authorization;
  if(!authorization) return res.status(401).json({ error: "Authentication required" });

  const query = new URL(req.url, "https://ledger-proxy.local").search;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: authorization,
    Accept: "application/json",
  };
  const options = { method: req.method, headers };

  if(req.method === "POST"){
    headers["Content-Type"] = "application/json";
    headers.Prefer = "resolution=merge-duplicates,return=minimal";
    options.body = JSON.stringify(req.body);
  }

  try{
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ledger_state${query}`, options);
    const body = await response.text();
    res.status(response.status);
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/json");
    return res.send(body);
  }catch(error){
    console.error("Supabase proxy request failed.", error);
    return res.status(502).json({ error: "Could not reach Supabase" });
  }
}
