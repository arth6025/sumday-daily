import { createApp } from './app.js';
import { loadCatalogue } from './store.js';

const port = Number(process.env.PORT ?? 8787);
const app = createApp(loadCatalogue());

app.listen(port, () => {
  console.log(`sumday daily API on http://localhost:${port}`);
});
