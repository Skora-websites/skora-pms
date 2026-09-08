// Run global-setup directly to see full error.
import globalSetup from "./global-setup";

globalSetup().then(
  () => console.log("GLOBAL SETUP OK"),
  (e) => console.log("GLOBAL SETUP FAIL:", e?.stack || e)
);
