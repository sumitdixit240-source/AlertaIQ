// ================= ALLOWED ORIGINS =================
const allowedOrigins = [
  "http://localhost:5000",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://alertai-q.vercel.app"
];

// ================= CORS =================
app.use(cors({
  origin: function (origin, callback) {
    // allow server-to-server or mobile apps
    if (!origin) return callback(null, true);

    // flexible match (fixes trailing slash + subroutes issues)
    const isAllowed = allowedOrigins.some((allowedOrigin) =>
      origin.startsWith(allowedOrigin)
    );

    if (isAllowed) {
      return callback(null, true);
    }

    console.log("❌ Blocked CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
