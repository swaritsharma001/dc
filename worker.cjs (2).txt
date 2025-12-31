const { Client: SelfClient } = require("discord.js-selfbot-v13");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

process.on("message", async (msg) => {
  if (msg.type !== "START") return;

  const token = msg.token;
  const self = new SelfClient({ 
    checkUpdate: false,
    intents: ["Guilds", "GuildMessages", "DirectMessages", "MessageContent"]
  });

  await self.login(token);
  console.log("✅ Logged in as", self.user.tag);

  const baseDir = "./data";
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir)

  const configPath = path.join(baseDir, `config_${self.user.id}.json`);

  const loadConfig = () => {
    try {
      if (!fs.existsSync(configPath)) {
        const defaultConfig = {
          exile_users: [],
          auto_reaction: null,
          auto_italic: false,
          auto_bold: false,
          auto_strong: false,
          mimic_user: null,
          last_word_enabled: true,
          confirm_style: "words",
          auto_lines: false,
          auto_dark: false,
          auto_spoil: false,
          roast_list: [],
          last_word_replies: [],
          hindi_insults: [],
          links: {},
          owners: [self.user.id]
        };
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
      }
      return JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (error) {
      console.error("Error loading config:", error);
      return {
        exile_users: [],
        roast_list: [],
        last_word_replies: [],
        hindi_insults: [],
        links: {},
        owners: [self.user.id]
      };
    }
  };

  const saveConfig = (config) => {
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error("Error saving config:", error);
    }
  };

  let config = loadConfig();
  const MAIN_OWNER_ID = self.user.id;
  let owners = config.owners || [MAIN_OWNER_ID];

  // Initialize state variables
  let spamTask = null, outlastTask = null, afkCheckTask = null, nitroTask = null;
  let spamActive = false, outlastActive = false, afkCheckActive = false;
  let m16Task = null, uziTask = null, ak47Task = null, nameChangeTask = null, alTask = null;
  let m16Active = false, uziActive = false, ak47Active = false, gcnActive = false, alActive = false;
  let pressureTasks = new Map();
  let gcPressureTasks = new Map();
  let gc1Tasks = new Map();
  let gc2Tasks = new Map();
  let pressureActive = new Map();
  let gcPressureActive = new Map();
  let gc1Active = new Map();
  let gc2Active = new Map();
  let autoReactions = new Map();
  let exileUsers = new Set(config.exile_users || []);
  let autoresponders = new Map();
  let voiceConnections = new Map();
  
  // Config values
  let autoItalic = config.auto_italic || false;
  let autoBold = config.auto_bold || false;
  let autoStrong = config.auto_strong || false;
  let mimicUser = config.mimic_user;
  let lastWordEnabled = config.last_word_enabled !== false;
  let confirmStyle = config.confirm_style || "words";
  let autoLines = config.auto_lines || false;
  let autoDark = config.auto_dark || false;
  let autoSpoil = config.auto_spoil || false;
  let roastList = config.roast_list || [];
  let lastWordReplies = config.last_word_replies || [];
  let hindiInsults = config.hindi_insults || [];
  let links = config.links || {};

  const prefix = '*';
  const startTime = Date.now();

  function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function parseUser(message, args) {
    const mention = message.mentions.users.first();
    return mention || (args[0] && self.users.cache.get(args[0]?.replace(/[<@!>]/g, ''))) || null;
  }

  function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }

  async function confirmAction(message) {
    if (confirmStyle === "words") {
      await message.channel.send("Action confirmed.");
    } else if (confirmStyle === "reactions") {
      await message.react('👍');
    } else if (confirmStyle === "delete") {
      await message.delete().catch(() => {});
    }
  }

  // Set presence
  self.user.setPresence({
    activities: [{ name: "Make your own bot at mintgram.live" }],
    status: "online"
  });

  self.on("ready", () => {
    console.log(`✅ ${self.user.tag} ready!`);
  });

  self.on("messageCreate", async (message) => {
    try {
      if (!message || message.author.bot) return;

      const authorId = message.author.id;
      const content = message.content.trim();
      const isCommand = content.startsWith(prefix);
      const isOwner = owners.includes(authorId);

      // Auto-features for self messages
      // Exile users auto-reply
if (exileUsers.has(message.author.id) && message.author.id !== self.user.id) {
  const fixedWords = ["Teri maa ki bhosda chud gayi ", "madarchod", "teri maa ka bhosda ka andar mera lund", "teri maa gb road ki randi", "madarchod teri maa ki bur ma hathi ka lund", "randi ka pilla madarchod"];
  
  // Add delay to avoid rate limiting
  setTimeout(async () => {
    await message.reply(`# <@${message.author.id}> ${getRandomElement(fixedWords)}`).catch(() => {});
  }, Math.random() * 100); // Random delay 0-1 second
}
      
      if (message.author.id === self.user.id && !isCommand) {
        let modifiedContent = message.content;
        let modified = false;
        
        if (autoBold) { modifiedContent = `**${modifiedContent}**`; modified = true; }
        if (autoStrong) { modifiedContent = `> # ${modifiedContent}`; modified = true; }
        if (autoItalic) { modifiedContent = `*${modifiedContent}*`; modified = true; }
        if (autoLines) { modifiedContent = `${modifiedContent}\n${'_'.repeat(modifiedContent.length)}`; modified = true; }
        if (autoDark) { modifiedContent = `\`\`\`${modifiedContent}\`\`\``; modified = true; }
        if (autoSpoil) { modifiedContent = `||${modifiedContent}||`; modified = true; }
        
        if (modified) {
          await message.edit(modifiedContent).catch(() => {});
        }
      }

      // Auto-reaction
      if (autoReactions.has(message.author.id)) {
        const emoji = autoReactions.get(message.author.id);
        await message.react(emoji).catch(() => {});
      }

      // Exile users
      if (exileUsers.has(message.author.id) && roastList.length > 0) {
        await message.reply(getRandomElement(roastList)).catch(() => {});
      }

      // Mimic user
      if (mimicUser && message.author.id === mimicUser) {
        await message.channel.send(message.content).catch(() => {});
      }

      // Last word
      if (lastWordEnabled && message.author.id !== self.user.id && lastWordReplies.length > 0) {
        const contentLower = message.content.toLowerCase();
        if (["last word", "last", "bye", "lasty"].some(t => contentLower.includes(t))) {
          await message.channel.send(getRandomElement(lastWordReplies)).catch(() => {});
        }
      }

      // Autoresponders
      for (const [trigger, response] of autoresponders) {
        if (message.content.toLowerCase().includes(trigger)) {
          await message.channel.send(response).catch(() => {});
          break;
        }
      }

      // Command handling
      if (!isCommand) return;
      if (!isOwner) return;

      const args = content.slice(prefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      // Link commands
      if (command === 'linkstore') {
        const linkName = args[0];
        const linkUrl = args[1];
        if (!linkName || !linkUrl) {
          await message.channel.send("Usage: *linkstore <name> <url>");
          return;
        }
        if (!linkUrl.startsWith('http')) {
          await message.channel.send("❌ URL must start with http or https");
          return;
        }
        if (links[linkName]) {
          await message.channel.send(`❌ Link '${linkName}' already exists!`);
          return;
        }
        links[linkName] = linkUrl;
        config.links = links;
        saveConfig(config);
        await message.channel.send(`✅ Link '${linkName}' saved! Use *${linkName} to send it`);
        return;
      } else if (command === 'linkdelete') {
        const linkName = args[0];
        if (!linkName) {
          await message.channel.send("Usage: *linkdelete <name>");
          return;
        }
        if (!links[linkName]) {
          await message.channel.send(`❌ Link '${linkName}' not found`);
          return;
        }
        delete links[linkName];
        config.links = links;
        saveConfig(config);
        await message.channel.send(`✅ Link '${linkName}' deleted!`);
        return;
      } else if (command === 'linkshow') {
        const allLinks = Object.entries(links).map(([name, url]) => `*${name} -> ${url}`).join('\n');
        if (allLinks) {
          await message.channel.send(`\`\`\`\n${allLinks}\n\`\`\``);
        } else {
          await message.channel.send("No stored links yet");
        }
        return;
      } else if (links[command]) {
        await message.channel.send(links[command]);
        return;
      }

      switch (command) {
        case 'ping': {
          const latency = Date.now() - message.createdTimestamp;
          const uptime = formatUptime(Date.now() - startTime);
          await message.channel.send(`\`\`\`\n~ Bot's Status\n\`\`\`\`\`\`js\nLatency = <(${latency}ms)>\nUptime = <(${uptime})>\n\`\`\``);
          break;
        }

        case 'spam': {
          const msgText = args.join(' ');
          if (!msgText) return;
          if (spamTask) clearInterval(spamTask);
          spamActive = true;
          spamTask = setInterval(() => {
            if (!spamActive) return;
            message.channel.send(msgText).catch(() => {});
          }, 100);
          await confirmAction(message);
          break;
        }

        case 'stopspam': {
          spamActive = false;
          if (spamTask) { clearInterval(spamTask); spamTask = null; }
          await confirmAction(message);
          break;
        }

        case 'autopressure': {
          const user = parseUser(message, args);
          if (user) {
            if (pressureTasks.has(user.id)) clearInterval(pressureTasks.get(user.id));
            pressureActive.set(user.id, true);
            const interval = setInterval(() => {
              if (!pressureActive.get(user.id)) return;
              message.channel.send(`> # ${getRandomElement(roastList)} ${user}`).catch(() => {});
            }, 500);
            pressureTasks.set(user.id, interval);
            await message.delete().catch(() => {});
          }
          break;
        }

        case 'stoppressure': {
          for (const [id] of pressureTasks) pressureActive.set(id, false);
          for (const [, interval] of pressureTasks) clearInterval(interval);
          pressureTasks.clear();
          await message.channel.send("Pressure stopped.");
          break;
        }

        case 'stopap': {
          for (const [id] of pressureTasks) pressureActive.set(id, false);
          for (const [, interval] of pressureTasks) clearInterval(interval);
          pressureTasks.clear();
          await message.delete().catch(() => {});
          break;
        }

        case 'gcpressure': {
          const msgText = args.join(' ');
          let counter = 0;
          if (gcPressureTasks.has(message.channel.id)) clearInterval(gcPressureTasks.get(message.channel.id));
          gcPressureActive.set(message.channel.id, true);
          const interval = setInterval(() => {
            if (!gcPressureActive.get(message.channel.id)) return;
            message.channel.send(msgText).catch(() => {});
            if (message.channel.type === 'GROUP_DM') {
              message.channel.setName(`mintgram.live ${counter++}`).catch(() => {});
            }
          }, 500);
          gcPressureTasks.set(message.channel.id, interval);
          await confirmAction(message);
          break;
        }

        case 'stopgcpressure': {
          gcPressureActive.set(message.channel.id, false);
          const interval = gcPressureTasks.get(message.channel.id);
          if (interval) { clearInterval(interval); gcPressureTasks.delete(message.channel.id); }
          await confirmAction(message);
          break;
        }

        case 'gc1': {
          const user = parseUser(message, args);
          if (user) {
            if (gc1Tasks.has(user.id)) clearInterval(gc1Tasks.get(user.id));
            gc1Active.set(user.id, true);
            let counter = 0;
            const interval = setInterval(() => {
              if (!gc1Active.get(user.id)) return;
              message.channel.send(`${user} ${getRandomElement(roastList)} \`\`\`\n${counter++}\n\`\`\``).catch(() => {});
            }, 500);
            gc1Tasks.set(user.id, interval);
            await confirmAction(message);
          }
          break;
        }

        case 'stopgc1': {
          for (const [id] of gc1Tasks) gc1Active.set(id, false);
          for (const [, interval] of gc1Tasks) clearInterval(interval);
          gc1Tasks.clear();
          await confirmAction(message);
          break;
        }

        case 'gc2': {
          const user = parseUser(message, args);
          if (user) {
            if (gc2Tasks.has(user.id)) clearInterval(gc2Tasks.get(user.id));
            gc2Active.set(user.id, true);
            let counter = 0;
            const interval = setInterval(() => {
              if (!gc2Active.get(user.id)) return;
              message.channel.send(`${user} ${getRandomElement(roastList)}`).then(msg => msg.pin().catch(() => {})).catch(() => {});
              if (message.channel.type === 'GROUP_DM') message.channel.setName(`get your own at mintgram.live ${counter++}`).catch(() => {});
            }, 500);
            gc2Tasks.set(user.id, interval);
            await confirmAction(message);
          }
          break;
        }

        case 'stopgc2': {
          for (const [id] of gc2Tasks) gc2Active.set(id, false);
          for (const [, interval] of gc2Tasks) clearInterval(interval);
          gc2Tasks.clear();
          await confirmAction(message);
          break;
        }

        case 'gcn': {
          const name = args.join(' ');
          let count = 1;
          if (nameChangeTask) clearInterval(nameChangeTask);
          gcnActive = true;
          nameChangeTask = setInterval(() => {
            if (!gcnActive) return;
            message.channel.setName(`${name} ${count++}`).catch(() => {});
          }, 500);
          await message.channel.send(`Started changing the channel name to '${name} 1'.`);
          break;
        }

        case 'stopgcn': {
          gcnActive = false;
          if (nameChangeTask) { clearInterval(nameChangeTask); nameChangeTask = null; }
          await message.channel.send("Stopped changing the channel name.");
          break;
        }

          case 'exile': {
            const user = parseUser(message, args);
            const fixedWords = ["Teri maa ki bhosda chud gayi ", "madarchod", "teri maa ka bhosda ka andar mera lund", "teri maa gb road ki randi", "madarchod teri maa ki bur ma hathi ka lund", "randi ka pilla madarchod"]

            if (user) { 
              exileUsers.add(user.id); 
              config.exile_users = Array.from(exileUsers);
              saveConfig(config);

              // Send confirmation
              await message.channel.send(`${user.tag} has been exiled.`);
              // Send immediate insult
              await message.channel.send(`# <@${user.id}> ${getRandomElement(fixedWords)}`);
            }
            break;
          }

        case 'stopexile': {
          const user = parseUser(message, args);
          if (user) { 
            exileUsers.delete(user.id); 
            config.exile_users = Array.from(exileUsers);
            saveConfig(config);
            await confirmAction(message); 
          }
          break;
        }

        case 'mimic': {
          const user = parseUser(message, args);
          if (user) { 
            mimicUser = user.id; 
            config.mimic_user = mimicUser;
            saveConfig(config);
            await confirmAction(message); 
          }
          break;
        }

        case 'stopmimic': {
          mimicUser = null;
          config.mimic_user = null;
          saveConfig(config);
          await confirmAction(message);
          break;
        }

        case 'autoreaction': {
          const user = parseUser(message, args);
          const emoji = args[args.length - 1];
          if (user && emoji) {
            autoReactions.set(user.id, emoji);
            await message.channel.send(`✅ Will auto-react to ${user.tag} with ${emoji}`);
          } else if (args[0] === 'me' && emoji) {
            autoReactions.set(self.user.id, emoji);
            await message.channel.send(`✅ Will auto-react to your messages with ${emoji}`);
          }
          break;
        }

        case 'stopautoreaction': {
          const user = parseUser(message, args);
          if (user) {
            autoReactions.delete(user.id);
            await message.channel.send(`❌ Stopped auto-reacting to ${user.tag}`);
          } else if (args[0] === 'me') {
            autoReactions.delete(self.user.id);
            await message.channel.send(`❌ Stopped auto-reacting to your messages`);
          }
          break;
        }

        case 'reactionoff': {
          autoReactions.clear();
          await confirmAction(message);
          break;
        }

        case 'autobold': {
          autoBold = true;
          config.auto_bold = true;
          saveConfig(config);
          await confirmAction(message);
          break;
        }

        case 'stopautobold': {
          autoBold = false;
          config.auto_bold = false;
          saveConfig(config);
          await confirmAction(message);
          break;
        }

        case 'autostrong': {
          autoStrong = true;
          config.auto_strong = true;
          saveConfig(config);
          await confirmAction(message);
          break;
        }

        case 'stopautostrong': {
          autoStrong = false;
          config.auto_strong = false;
          saveConfig(config);
          await confirmAction(message);
          break;
        }

        case 'autoitalic': {
          autoItalic = true;
          config.auto_italic = true;
          saveConfig(config);
          await confirmAction(message);
          break;
        }

        case 'stopautoitalic': {
          autoItalic = false;
          config.auto_italic = false;
          saveConfig(config);
          await confirmAction(message);
          break;
        }

        case 'autolines': {
          autoLines = true;
          config.auto_lines = true;
          saveConfig(config);
          await confirmAction(message);
          break;
        }

        case 'stopautolines': {
          autoLines = false;
          config.auto_lines = false;
          saveConfig(config);
          await confirmAction(message);
          break;
        }

        case 'autodark': {
          autoDark = true;
          config.auto_dark = true;
          saveConfig(config);
          await confirmAction(message);
          break;
        }

        case 'stopautodark': {
          autoDark = false;
          config.auto_dark = false;
          saveConfig(config);
          await confirmAction(message);
          break;
        }

        case 'autospoil': {
          autoSpoil = true;
          config.auto_spoil = true;
          saveConfig(config);
          await confirmAction(message);
          break;
        }

        case 'stopautospoil': {
          autoSpoil = false;
          config.auto_spoil = false;
          saveConfig(config);
          await confirmAction(message);
          break;
        }

        case 'info': {
          return message.reply(
            `📘 **About This Project**

This automation system is developed and maintained by  
**NovaLabs Software Team**.

🛠️ **Create your own setup:**  
https://mintgram.live  
_(We are actively working on more features.)_

☕ **Support development:**  
https://www.buymeacoffee.com/novalabs

Thank you for using our software.`
          );
        }
          case 'help': {
            const helpText = `
          ╔════════════════════════════════════════════════════════════════════╗
          ║                        📚 ALL SelfBot Commands                       ║
          ║                 Copyright © 2024 NovaLabs • mintgram.live           ║
          ╚════════════════════════════════════════════════════════════════════╝

          *Commands are owner-only. Use prefix: ${prefix}*

          ═══════════════════════════════════════════════════════════════════════
          🔧 **CORE COMMANDS**
          ═══════════════════════════════════════════════════════════════════════
          • *ping       - Check bot latency & uptime
          • *help       - Show this help menu
          • *info       - About NovaLabs & mintgram.live
          • *userinfo   - Get user information
          • *guildinfo  - Get server information

          ═══════════════════════════════════════════════════════════════════════
          🔄 **AUTO FEATURES**
          ═══════════════════════════════════════════════════════════════════════
          • *autobold        / *stopautobold     - Auto-bold messages
          • *autostrong      / *stopautostrong   - Auto-strong messages
          • *autoitalic      / *stopautoitalic   - Auto-italic messages
          • *autolines       / *stopautolines    - Auto-add underline
          • *autodark        / *stopautodark     - Auto-code block messages
          • *autospoil       / *stopautospoil    - Auto-spoiler messages
          • *autoreaction    / *stopautoreaction - Auto-react to user
          • *reactionoff     - Stop all auto-reactions

          ═══════════════════════════════════════════════════════════════════════
          🎯 **TARGET COMMANDS**
          ═══════════════════════════════════════════════════════════════════════
          • *exile          / *stopexile   - Auto-insult user
          • *mimic          / *stopmimic   - Mimic user's messages
          • *insult         - Insult mentioned user
          • *insult2        - Hindi insult
          • *autopressure   - Pressure user with insults
          • *stoppressure   - Stop all pressure
          • *stopap         - Delete + stop pressure

          ═══════════════════════════════════════════════════════════════════════
          💥 **SPAM & RAID**
          ═══════════════════════════════════════════════════════════════════════
          • *spam <text>    / *stopspam    - Spam text
          • *spam2 <#> <text>              - Limited spam
          • *outlast @user  / *outlaststop - Outlast user
          • *fs <#> <text>  - Fast spam messages
          • *loop <#> <text>- Loop messages
          • *ladder <words> - Ladder messages
          • *massdm <text>  - Mass DM users

          ═══════════════════════════════════════════════════════════════════════
          👥 **GROUP CHAT**
          ═══════════════════════════════════════════════════════════════════════
          • *gcpressure <text> / *stopgcpressure - Spam + rename GC
          • *gc1 @user         / *stopgc1        - GC spam with counter
          • *gc2 @user         / *stopgc2        - GC spam + pin + rename
          • *gcn <name>        / *stopgcn        - Auto-rename channel
          • *gcpfp <id>        - Get GC profile picture

          ═══════════════════════════════════════════════════════════════════════
          🔗 **LINK MANAGEMENT**
          ═══════════════════════════════════════════════════════════════════════
          • *linkstore <name> <url>   - Save link
          • *linkdelete <name>        - Delete link
          • *linkshow                 - List all links
          • *<linkname>               - Send saved link

          ═══════════════════════════════════════════════════════════════════════
          🛠️ **UTILITY**
          ═══════════════════════════════════════════════════════════════════════
          • *purge <#>       - Delete your messages
          • *c <#>           - Clear messages
          • *pfp @user       - Get user avatar
          • *banner @user    - Get user banner
          • *serverid <invite> - Get server ID from invite
          • *members         - List server members
          • *username <name> - Change username
          • *bio <text>      - Set bio
          • *avatar <url>    - Change avatar
          • *react <id> <emoji> - React to message
          • *typefake <sec>  - Fake typing
          • *getmsg <id>     - Get message content
          • *searchmsg <term> - Search messages
          • *webhook <text>  - Send via webhook
          • *clone @user     / *unclone - Clone profile
          • *delchannels     - Delete all channels
          • *reversemsg <id> - Reverse message
          • *fakemsg @user <text> - Fake message
═══════════════════════════════════════════════════════════════════════
          💡 **TIPS**
          • Use @mention or user ID for user commands
          • Links auto-send when typing *linkname
          • Auto-features only apply to your messages
          • Confirm style: words/reactions/delete

          ═══════════════════════════════════════════════════════════════════════
          🔗 **Website:** https://mintgram.live
          ☕ **Support:** https://www.buymeacoffee.com/novalabs
          ═══════════════════════════════════════════════════════════════════════`;

            // Send in multiple messages if too long
            const chunks = helpText.match(/[\s\S]{1,1900}/g) || [helpText];
            for (const chunk of chunks) {
              await message.channel.send(`\`\`\`${chunk}\`\`\``).catch(() => {});
            }
            break;
          }
          

      }
    } catch (error) {
      console.error(`Error in ${self.user.tag}:`, error);
    }
  });
  process.on("disconnect", () => {
    self.destroy();
    console.log(`❌ ${self.user.tag} disconnected`);
  });
});

// --Version 2