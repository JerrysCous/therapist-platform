const bcrypt = require("bcrypt");

bcrypt
  .compare(
    "Jacklowe#171",
    "$2b$10$.GCnPGDISx96kaOStAuK3uk16aB1nEuv3h4gWZ7goI/Wg/3GSj8I2"
  )
  .then(result => {
    console.log("Match?", result);
  })
  .catch(err => console.error(err));
