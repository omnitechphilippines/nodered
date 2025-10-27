import http from "http";
import RED from "node-red";
import express from "express";
import pgStorage from "node-red-contrib-storagemodule-postgres";

const app = express();

// Render provides the port via environment variable
const port = process.env.PORT || 1880;

// Create a server
const server = http.createServer(app);

// ✅ Node-RED settings
const settings = {
  httpAdminRoot: "/",
  httpNodeRoot: "/",
  userDir: "./.nodered/",
  functionGlobalContext: {},

  // ✅ PostgreSQL storage for persistence
  storageModule: pgStorage,
  postgresURI: process.env.POSTGRES_URI,
  storageModuleOptions: {
    user: process.env.DB_POSTGRESDB_USER,
    password: process.env.DB_POSTGRESDB_PASSWORD,
    host: process.env.DB_POSTGRESDB_HOST,
    port: process.env.DB_POSTGRESDB_PORT,
    database: process.env.DB_POSTGRESDB_DATABASE,
    schema: process.env.DB_POSTGRESDB_SCHEMA || "public",
    ssl: true, // important for Render or Supabase
  },

  // ✅ Optional admin UI credentials
  adminAuth: {
    type: "credentials",
    users: [
      {
        username: "admin",
        password: "$2y$08$SMI8G0QUmsJO.SB3OFPaPOvjDnkhw9aJ0EH75gFcJrkUnQK/n.Fd.", // bcrypt hash
        permissions: "*",
      },
    ],
  },

  // ✅ Protect node endpoints (optional)
  httpNodeAuth: {
    user: "admin",
    pass: "$2y$08$SMI8G0QUmsJO.SB3OFPaPOvjDnkhw9aJ0EH75gFcJrkUnQK/n.Fd.",
  },
};

// Initialize Node-RED
RED.init(server, settings);

// Serve the editor UI from /
app.use(settings.httpAdminRoot, RED.httpAdmin);

// Serve the HTTP nodes UI from /api
app.use(settings.httpNodeRoot, RED.httpNode);

// Start the server
server.listen(port, () => {
  console.log(`Node-RED running on port ${port}`);
});

// Start Node-RED runtime
RED.start();
