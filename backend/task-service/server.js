const mongoose = require("mongoose");
const app      = require("./app");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Task DB connected"))
  .catch(err => console.log("DB Error:", err));

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Task service running on port ${PORT}`));