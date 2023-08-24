const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
app.use(express.json());
const path = require("path");

const dbPath = path.join(__dirname, "userData.db");
let db = null;
//Connecting sqlite3 database
const intializeAndConnectDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server is Running at http://localhost:3000`);
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(-1);
  }
};
//calling db to connect with database
intializeAndConnectDb();

//API - 1 to add new user in db
app.post("/register", async (request, response) => {
  const newUserDetails = request.body;
  const { username, name, password, gender, location } = newUserDetails;

  const checkUserName = `
    select * from user where username='${username}';`;

  const checkUser = await db.get(checkUserName);
  if (checkUser === undefined) {
    const checkPasswordLength = password.length;
    if (checkPasswordLength < 5) {
      response.status(400);
      response.send(`Password is too short`);
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const registerNewUer = `
            insert into user(username,name,password,gender, location)
            values(
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            )`;
      await db.run(registerNewUer);
      response.status(200);
      response.send(`User created successfully`);
    }
  } else {
    response.status(400);
    response.send(`User already exists`);
  }
});

//API-2 login valid user
app.post("/login", async (request, response) => {
  const loginDetails = request.body;
  const { username, password } = loginDetails;
  const userNameCheck = `
    select * from user where username = '${username}';`;
  const checkUser = await db.get(userNameCheck);
  if (checkUser !== undefined) {
    const checkPassword = await bcrypt.compare(password, checkUser.password);
    if (checkPassword === true) {
      response.status(200);
      response.send(`Login success!`);
    } else {
      response.status(400);
      response.send(`Invalid password`);
    }
  } else {
    response.status(400);
    response.send(`Invalid user`);
  }
});

//changing old password with new password for valid user
app.put("/change-password", async (request, response) => {
  const userDetails = request.body;
  const { username, oldPassword, newPassword } = userDetails;
  const userCheck = `select * from user where username='${username}';`;
  const validUser = await db.get(userCheck);

  if (validUser !== undefined) {
    const checkOldPassword = await bcrypt.compare(
      oldPassword,
      validUser.password
    );
    console.log(checkOldPassword);

    if (checkOldPassword === true) {
      if (newPassword.length >= 5) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updateUserPassword = `
             update user 
             set password = '${hashedPassword}'
             where username = '${username}';`;
        await db.run(updateUserPassword);
        response.status(200);
        response.send(`Password updated`);
      } else {
        response.status(400);
        response.send(`Password is too short`);
      }
    } else {
      response.status(400);
      response.send(`Invalid current password`);
    }
  }
});

module.exports = app;
