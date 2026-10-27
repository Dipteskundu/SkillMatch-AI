// Route shim: the Learning dashboard component lives in the (dashboard)
// route group (which does NOT add a URL segment — it serves /learning), but
// the app wires it at /dashboard/learning (sidebar link + middleware
// candidate-only table). Re-export the component so that URL resolves.
export { default } from "../../(dashboard)/learning/page";
