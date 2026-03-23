import { internalMutation } from "./_generated/server";
export default internalMutation(async (ctx) => {
  const existingAdmin = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", "admin@shipmate.com")).first();
  if (existingAdmin) {
    // Correct hash uses btoa(password + "shipmate_salt_2025")
    await ctx.db.patch(existingAdmin._id, {
      passwordHash: btoa("18552219" + "shipmate_salt_2025")
    });
  }
});
