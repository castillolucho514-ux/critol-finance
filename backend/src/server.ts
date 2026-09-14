import "dotenv/config";
import http from "node:http";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { Server } from "socket.io";
import { app } from "./app.js";
import { findQuote, quotes } from "./quotes.js";

const server = http.createServer(app);
const allowedOrigins = process.env.WEB_ORIGIN?.split(",") ?? ["http://localhost:3000"];
const io = new Server(server, { cors: { origin: allowedOrigins } });
const graphql = new ApolloServer({
  typeDefs: `type Quote { symbol: String!, price: Float!, change: Float! } type Query { quotes: [Quote!]!, quote(symbol: String!): Quote }`,
  resolvers: { Query: { quotes: () => quotes, quote: (_: unknown, { symbol }: { symbol: string }) => findQuote(symbol) } }
});

await graphql.start();
app.use("/graphql", expressMiddleware(graphql));
io.on("connection", (socket) => socket.emit("quotes", quotes));

const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => console.log(`Critol API listening on :${port}`));
