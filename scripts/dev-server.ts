// Local preview: serves the Growth page and API on PUBLIC_BASE_URL's port (default 3102).
import { createServer } from "node:http";
import { startGrowthEngine } from "../src/growth/index.ts";

const growth = startGrowthEngine({ pagePath: new URL("../public/growth.html", import.meta.url).pathname });
const port = Number(process.env.PORT ?? 3102);
createServer(async (req, res) => {
  if (req.url === "/" ) { res.writeHead(302, { location: "/growth" }); return res.end(); }
  if (await growth.handle(req, res)) return;
  res.writeHead(404).end("not found");
}).listen(port, () => console.log(`Growth Engine on http://localhost:${port}/growth`));
