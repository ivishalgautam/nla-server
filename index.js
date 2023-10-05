require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT;

app.use(morgan("tiny"));
app.use(express.json());
app.use(cors());

// admin
app.use("/api/admin", require("./router/admin"));

// user
app.use("/api/students", require("./router/student"));
app.use("/api/questions", require("./router/question"));
app.use("/api/tests", require("./router/test"));
app.use("/api/results", require("./router/result"));
app.use("/api/dashboard", require("./router/dashboard"));
app.use("/api/leads", require("./router/leads"));
app.use("/api/grades", require("./router/grade"));
app.use("/api/query", require("./router/query"));

// auth
app.use("/api/auth", require("./router/auth"));

app.listen(PORT, () => {
  console.log(`Server up at http://locathost:${PORT}`);
});
