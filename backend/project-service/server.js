const mongoose = require("mongoose");
const app      = require("./app");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Project Service DB connected"))
  .catch(err => console.log("DB Error:", err));

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`Project Service running on port ${PORT}`));