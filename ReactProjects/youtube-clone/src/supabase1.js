import { useEffect, useState } from "react";
import { supabase } from "./supabase.ts";

export default function TestSupabase() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("channels").select("*");
      if (error) console.error(error);
      else setRows(data);
    }
    load();
  }, []);

  return (
    <div>
      <h2>Supabase Test</h2>
      <pre>{JSON.stringify(rows, null, 2)}</pre>
    </div>
  );
}
