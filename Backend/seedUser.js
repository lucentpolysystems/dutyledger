import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "auth.env") });
dotenv.config();

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/Attendance";
const dbName = "Attendance";

const dummyUsers = [
  {
    username: "Admin User",
    user_id: "ADMIN001",
    gender: "Male",
    joigningDate: new Date().toISOString().split("T")[0],
    designation: "HR Manager",
    address: "Lucent PolySystems Pvt. Ltd., Corporate Office",
    bankAccount: "123456789012",
    mobile: "9876543210",
    email: "admin@example.com",
    role: "HR",
    salary: 100000,
    employmentType: "Full-time",
    attendanceType: "Office",
    emergencyContact: "9876543211",
    emergencyContactname: "Emergency Contact",
    IFSC: "SBIN0001234",
    plainPassword: "admin123",
  },
  {
    username: "John Doe",
    user_id: "EMP001",
    gender: "Male",
    joigningDate: new Date().toISOString().split("T")[0],
    designation: "Polymer Production Engineer",
    address: "Lucent PolySystems Pvt. Ltd., Plant Staff Quarters",
    bankAccount: "987654321098",
    mobile: "9123456780",
    email: "employee@example.com",
    role: "Employee",
    salary: 75000,
    employmentType: "Full-time",
    attendanceType: "Office",
    emergencyContact: "9123456781",
    emergencyContactname: "Jane Doe",
    IFSC: "HDFC0001234",
    plainPassword: "employee123",
  },
];

const seedUsers = async () => {
  console.log(`Connecting to MongoDB at: ${mongoURI.replace(/:([^:@]+)@/, ":****@")} ...`);
  const client = new MongoClient(mongoURI, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    const db = client.db(dbName);
    console.log(" Connected to MongoDB database:", dbName);

    for (const userData of dummyUsers) {
      const { plainPassword, ...userDoc } = userData;
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const updateData = {
        ...userDoc,
        password: hashedPassword,
        passwordSetToken: null,
        tokenExpiry: null,
      };

      await db.collection("users").updateOne(
        { user_id: userData.user_id },
        { $set: updateData },
        { upsert: true }
      );
      console.log(` Successfully seeded/updated user: [${userData.role}] ${userData.user_id} (${userData.username})`);
    }

    console.log("\n=======================================================");
    console.log(" DUMMY LOGIN CREDENTIALS");
    console.log("=======================================================");
    dummyUsers.forEach((u, i) => {
      console.log(`\n[Account ${i + 1}: ${u.role.toUpperCase()}]`);
      console.log(`  User ID  : ${u.user_id}`);
      console.log(`  Username : ${u.username}`);
      console.log(`  Password : ${u.plainPassword}`);
      console.log(`  Email    : ${u.email}`);
      console.log(`  Role     : ${u.role}`);
    });
    console.log("=======================================================\n");

  } catch (error) {
    console.error(" Error seeding users:", error.message);
    if (error.message.includes("SSL alert number 80") || error.message.includes("tlsv1 alert internal error")) {
      console.error("\n Notice: MongoDB Atlas dropped the connection (SSL Alert 80).");
      console.error("  This typically occurs when your current IP is not whitelisted in MongoDB Atlas.");
      console.error("  Go to Atlas -> Network Access -> Add IP Address (e.g. Add Current IP or 0.0.0.0/0).");
    }
  } finally {
    await client.close();
  }
};

seedUsers();
