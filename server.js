const app = require("./app");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"));

app.listen(5000, ()=>console.log("Server running"));