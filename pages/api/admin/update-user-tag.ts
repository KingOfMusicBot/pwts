import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const token = req.cookies?.admin_token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "changeme");
    if (!decoded || typeof decoded !== "object" || !(decoded as any).admin) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { userId, tag } = req.body as { userId?: string; tag?: string };
    if (!userId || typeof tag !== "string") {
      return res.status(400).json({ message: "userId and tag are required" });
    }

    const allowedTags = ["owner", "developer", "manager", "premium", "user"];
    if (!allowedTags.includes(tag.toLowerCase())) {
      return res.status(400).json({ message: "Invalid tag value" });
    }

    await dbConnect();

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { tag } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Tag updated", user: updated });
  } catch (error) {
    console.error("[update-user-tag] Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


