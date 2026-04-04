const mongoose = require("mongoose");
const app      = require("./app");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Auth DB connected"))
  .catch(err => console.log("DB Error:", err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Auth service running on port ${PORT}`));