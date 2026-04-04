const mongoose = require("mongoose");
const app      = require("./app");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("User DB connected"))
  .catch(err => console.log("DB Error:", err));

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`User service running on port ${PORT}`));