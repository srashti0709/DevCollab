import app from "./app.js";

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`DevCollab server running at http://localhost:${PORT}`);
});