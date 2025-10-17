const http = require("http");
const RED = require("node-red");

const express = require("express");
const app = express();

// Render provides the port via environment variable
const port = process.env.PORT || 1880;

// Create a server
const server = http.createServer(app);

// Node-RED settings
const settings = {
  httpAdminRoot: "/",
  httpNodeRoot: "/",
  userDir: "./.nodered/",
  functionGlobalContext: {},
  adminAuth: {
    type: "credentials",
    users: [{
        username: "admin",
        password: "$2y$08$SMI8G0QUmsJO.SB3OFPaPOvjDnkhw9aJ0EH75gFcJrkUnQK/n.Fd.",
        permissions: "*"
    }]
  },
  httpNodeAuth: {user:"$2y$08$SMI8G0QUmsJO.SB3OFPaPOvjDnkhw9aJ0EH75gFcJrkUnQK/n.Fd."},
};

// Initialize Node-RED
RED.init(server, settings);

// Serve the editor UI from /admin
app.use(settings.httpAdminRoot, RED.httpAdmin);
 
// Serve the HTTP nodes UI from /api
app.use(settings.httpNodeRoot, RED.httpNode);

// Start the server
server.listen(port);

// Start Node-RED runtime
RED.start();
