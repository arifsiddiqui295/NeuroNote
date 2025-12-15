const { Liveblocks } = require("@liveblocks/node");
const Lesson = require("../models/Lesson");
const Workspace = require("../models/Workspace");

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

const authLiveblocks = async (req, res) => {
  const { room } = req.body;
  const user = req.user;

  try {
    // 1. Find the lesson
    const lesson = await Lesson.findById(room);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // 2. Check Workspace Membership
    const workspace = await Workspace.findById(lesson.workspace);
    const member = workspace.members.find(
      (m) => m.user.toString() === user._id.toString()
    );

    if (!member) {
      return res.status(403).json({ message: "Not a member" });
    }

    // 3. Determine Permissions based on Role
    const canWrite = member.role === "admin" || member.role === "editor";

    // 4. Prepare the session
    const session = liveblocks.prepareSession(
      user.username,
      {
        userInfo: {
          name: user.username,
          color: "#3b82f6",
        },
      }
    );

    // 5. Grant Access
    // FIX: Use "room:read" for viewers instead of an empty array
    const permissions = canWrite ? ["room:write"] : ["room:read"];
    
    session.allow(room, permissions);

    // 6. Authorize
    const { status, body } = await session.authorize();
    res.status(status).send(body);

  } catch (error) {
    console.error("Liveblocks auth error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { authLiveblocks };