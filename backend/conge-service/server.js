const mongoose = require("mongoose");
const app      = require("./app");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Conge DB connected"))
  .catch(err => console.log("DB Error:", err));

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Conge service running on port ${PORT}`));