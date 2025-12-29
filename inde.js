const { Client } = require('discord.js-selfbot-v13');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

const client = new Client({ checkUpdate: false });
const startTime = Date.now();

function loadConfig() {
    try {
        return JSON.parse(fs.readFileSync('AR', 'utf8'));
    } catch (error) {
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
            roast_list: [
                "weak", "frail pussy", "u drink horse semen", "Lamp shade", "Barrel", "HIV", "Vape pen",
                "``` ur ass son ```", "# u got a pubic hair fetish weird fuck", "nonce", "pedo", "child liker",
                "CUCK PEDO", "unwanted", "waste of cum", "condom commercial", "STEP TO ME SON", "GAY FUCKER",
                "SLOW ASF", "public restroom licker", "MOM 4 MOM", "father 4 father", "NEVER STEP TO ME",
                "SUCK MY DICK FAGGOT", "Exiled", "GET UP FAGGOT", "you are a walking L", "you smell like expired milk",
                "you're so ugly even hello kitty said goodbye", "you're built like a bag of rocks",
                "you're the reason the gene pool needs a lifeguard"
            ],
            last_word_replies: [
                "did this nigga fail to last word a fucking god",
                "nope im unlastwordable and i dont die",
                "dont last word me again. im legit and my reaction time is world record wide so dont last word me",
                "Nigga u wanna last word? ur last wordK"
            ],
            hindi_insults: [
                "MADHARCHOD", "RANDIKE BACHHE", "BHENCHOD", "TERI MA KA BHOSDA", "BUR KE BAAL", "RANDI",
                "TERI MA KI KALI CHUT FADU", "RAND KI PAIDASH", "GANDU", "JHATU", "CHAKKE KI AULAAD",
                "CHINAAL KI AULAAD", "CHUDI HUYI JHAAT", "TERA KANDAN RANDI MADHARCHOD", "TERA BAAP RANDWA",
                "100 BAAP KI AULAAD", "TERE BAAP KA LULLI CHOTA HAI", "TERI MAA KI CHUT MEIN LODA",
                "GAND MEIN DANDA", "BHOSADPAPPU", "LODU", "LAUDE KA BAAL", "TATTO KE SAUDAGAR", "GAAND KA KEEDA",
                "CHUTMARIKE", "TERI BEHEN KI CHUT", "MADERCHOD KUTTE", "HARAMI KI AULAAD", "KUTTA KAMINA",
                "SUAR KI AULAAD", "GADHEY KI JHAANT", "ULLU KE PATTHE", "GANDMASTI", "TERE BAAP KI GAAND",
                "TERI MA RANDI HAI", "LAWDE KE BAAL", "CHUTIYE KA BACHA", "HIJRE KI PAIDAISH", "TERI NAANI KI GAAND",
                "BHOSDA PAPPU", "TERI MUMMY MERI SUGAR MUMMY", "TERI BEHEN MERI HOJA", "KUTTE KA BACHHA",
                "SUAR KE BACHHE", "TERI MAA KO CHODU", "GAAND PHAD DUNGA", "CHUP KAR CHUTIYE", "TERE BAAP KA NAAM KYA HAI",
                "TERI MAA KI ANKH", "LAUDU INSAAN"
            ],
            links: {}
        };
        fs.writeFileSync('AR', JSON.stringify(defaultConfig, null, 4));
        return defaultConfig;
    }
}

let config = loadConfig();
let pressureTasks = new Map();
let gcPressureTasks = new Map();
let gc1Tasks = new Map();
let gc2Tasks = new Map();
let exileUsers = new Set(config.exile_users || []);
let autoReactions = new Map();
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

let spamTask = null, outlastTask = null, afkCheckTask = null, nitroTask = null;
let spamActive = false, outlastActive = false, afkCheckActive = false;
let m16Task = null, uziTask = null, ak47Task = null, nameChangeTask = null, alTask = null;
let m16Active = false, uziActive = false, ak47Active = false, gcnActive = false, alActive = false;
let pressureActive = new Map(), gcPressureActive = new Map(), gc1Active = new Map(), gc2Active = new Map();
let tokens = [];
let statuses = [];
let isStatusRotating = false;
let currentStatusIndex = 0;
let currentState = 'online';
let autoresponders = new Map();
let loudmicActive = false;
let voiceConnections = new Map();
let whitelisted = new Set(['1113136277542412299', '1337314744578736170','1407012221560684554','1415205059561652324']);

const prefix = '*';

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function parseUser(message, args) {
    const mention = message.mentions.users.first();
    return mention || (args[0] && client.users.cache.get(args[0]?.replace(/[<@!>]/g, ''))) || null;
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

client.on('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    try {
        if (message.author.id === client.user.id) {
            let content = message.content;
            if (!content.startsWith(prefix)) {
                let modified = false;
                if (autoBold) { content = `**${content}**`; modified = true; }
                if (autoStrong) { content = `> # ${content}`; modified = true; }
                if (autoItalic) { content = `*${content}*`; modified = true; }
                if (autoLines) { content = `${content}\n${'_'.repeat(content.length)}`; modified = true; }
                if (autoDark) { content = `\`\`\`${content}\`\`\``; modified = true; }
                if (autoSpoil) { content = `||${content}||`; modified = true; }
                if (modified) await message.edit(content).catch(() => {});
            }
        }

        if (autoReactions.has(message.author.id)) {
            const emoji = autoReactions.get(message.author.id);
            await message.react(emoji).catch(() => {});
        }

        if (exileUsers.has(message.author.id)) {
            await message.reply(getRandomElement(roastList)).catch(() => {});
        }

        if (mimicUser && message.author.id === mimicUser) {
            await message.channel.send(message.content).catch(() => {});
        }

        if (lastWordEnabled && message.author.id !== client.user.id) {
            const contentLower = message.content.toLowerCase();
            if (["last word", "last", "bye", "lasty"].some(t => contentLower.includes(t))) {
                await message.channel.send(getRandomElement(lastWordReplies)).catch(() => {});
            }
        }

        for (const [trigger, response] of autoresponders) {
            if (message.content.toLowerCase().includes(trigger)) {
                await message.channel.send(response).catch(() => {});
                break;
            }
        }

        if (!message.content.startsWith(prefix)) return;
        if (message.author.id !== client.user.id && !whitelisted.has(message.author.id)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // Check if command is a link storage/retrieve
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
            fs.writeFileSync('AR', JSON.stringify(config, null, 4));
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
            fs.writeFileSync('AR', JSON.stringify(config, null, 4));
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
            case 'leak': {
                const target = args[0];
                if (!target) {
                    await message.channel.send("Usage: *leak <target>");
                    break;
                }
                
                // Array of common names/emails for random selection to make it look "realistic"
                const names = ["John Doe", "Alex Smith", "Michael Ross", "Sarah Connor", "David Miller"];
                const emails = ["j.doe@protonmail.com", "asmith@gmail.com", "mross@outlook.com", "sconnor@yahoo.com"];
                
                const randomName = names[Math.floor(Math.random() * names.length)];
                const randomEmail = emails[Math.floor(Math.random() * emails.length)];
                
                const response = `\`\`\`xml
[ LEAK / OSINT RESULTS ]
Target: ${target}

Name - ${randomName}
Number - ${target}
Email - ${randomEmail}
Location - Global/Unknown
Carrier - Searching...

[ Public Data Links ]
Google: https://www.google.com/search?q=%22${target}%22
Truecaller: https://www.truecaller.com/search/global/${target}
Numverify: https://numverify.com/

Note: For full deep-web results, integration with a paid OSINT API is required.
\`\`\``;
                
                await message.channel.send(response);
                break;
            }

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
                }, 500);
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
                        message.channel.setName(`ABYSS ON TOP ${counter++}`).catch(() => {});
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
                        if (message.channel.type === 'GROUP_DM') message.channel.setName(`ABYSS ON TOP ${counter++}`).catch(() => {});
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

            case 'gcpfp': {
                const channelId = parseInt(args[0]);
                const channel = client.channels.cache.get(channelId);
                if (channel && channel.type === 'GROUP_DM') {
                    await message.channel.send(channel.iconURL({ dynamic: true }));
                }
                break;
            }

            case 'ladder': {
                await message.delete().catch(() => {});
                for (const word of args) await message.channel.send(word).catch(() => {});
                break;
            }

            case 'loop': {
                await message.delete().catch(() => {});
                const count = parseInt(args[0]);
                const msgText = args.slice(1).join(' ');
                if (!isNaN(count)) for (let i = 1; i <= count; i++) await message.channel.send(`${msgText} ${i}`).catch(() => {});
                break;
            }

            case 'fs': {
                await message.delete().catch(() => {});
                const amount = parseInt(args[0]);
                const msgText = args.slice(1).join(' ');
                if (!isNaN(amount)) for (let i = 0; i < amount; i++) await message.channel.send(msgText).catch(() => {});
                break;
            }

            case 'outlast': {
                const user = parseUser(message, args);
                if (user) {
                    let counter = 0;
                    if (outlastTask) clearInterval(outlastTask);
                    outlastActive = true;
                    outlastTask = setInterval(() => {
                        if (!outlastActive) return;
                        message.channel.send(`${user} ${getRandomElement(roastList)} \`\`\`\n${counter++}\n\`\`\``).catch(() => {});
                    }, 500);
                    await confirmAction(message);
                }
                break;
            }

            case 'outlaststop': {
                outlastActive = false;
                if (outlastTask) { clearInterval(outlastTask); outlastTask = null; }
                await confirmAction(message);
                break;
            }

            case 'afkcheck': {
                const user = parseUser(message, args);
                const count = parseInt(args[args.length - 1]) || 10;
                const targetMsg = args.slice(1, args.length - 1).join(' ');
                
                if (user && targetMsg) {
                    let i = 0;
                    let won = false;
                    if (afkCheckTask) clearInterval(afkCheckTask);
                    afkCheckActive = true;
                    
                    await message.channel.send(`AFK check started for ${user}! They must type: "${targetMsg}" in ${count} seconds`);
                    
                    const messageCollector = message.channel.createMessageCollector({ 
                        filter: m => m.author.id === user.id,
                        time: count * 1000
                    });
                    
                    messageCollector.on('collect', (msg) => {
                        if (msg.content === targetMsg) {
                            won = true;
                            afkCheckActive = false;
                            messageCollector.stop();
                            clearInterval(afkCheckTask);
                            afkCheckTask = null;
                            message.channel.send(`🎉 GGS YOU WON ${user}!`).catch(() => {});
                        }
                    });
                    
                    afkCheckTask = setInterval(() => {
                        if (!afkCheckActive) return;
                        if (i >= count) { 
                            afkCheckActive = false; 
                            clearInterval(afkCheckTask); 
                            afkCheckTask = null;
                            messageCollector.stop();
                            if (!won) {
                                message.channel.send(`💀 YOU DIED SON ${user}`).catch(() => {}); 
                            }
                            return; 
                        }
                        message.channel.send(`AFK check ${user} ${++i}/${count}`).catch(() => {});
                    }, 1000);
                    
                    await confirmAction(message);
                } else {
                    await message.channel.send("Usage: *afkcheck <mention> <message> <amount>");
                }
                break;
            }

            case 'stopafkcheck': {
                afkCheckActive = false;
                if (afkCheckTask) { clearInterval(afkCheckTask); afkCheckTask = null; }
                await confirmAction(message);
                break;
            }

            case 'playing': {
                const url = args[0];
                const status = args.slice(1).join(' ');
                if (url && status) {
                    isStatusRotating = false;
                    await client.user.setPresence({ 
                        activities: [{ 
                            name: status, 
                            type: 'PLAYING',
                            assets: {
                                large_image: url,
                                large_text: status
                            }
                        }], 
                        status: 'online' 
                    });
                    await confirmAction(message);
                } else {
                    await message.channel.send("Usage: *playing <image_url> <status>");
                }
                break;
            }

            case 'watching': {
                const url = args[0];
                const status = args.slice(1).join(' ');
                if (url && status) {
                    isStatusRotating = false;
                    await client.user.setPresence({ 
                        activities: [{ 
                            name: status, 
                            type: 'WATCHING',
                            assets: {
                                large_image: url,
                                large_text: status
                            }
                        }], 
                        status: 'online' 
                    });
                    await confirmAction(message);
                } else {
                    await message.channel.send("Usage: *watching <image_url> <status>");
                }
                break;
            }

            case 'join': {
                const inviteLink = args[0];
                if (!inviteLink) {
                    await message.channel.send("Usage: *join <invite_link>");
                    break;
                }
                try {
                    const invite = await client.acceptInvite(inviteLink.split('/').pop());
                    await message.channel.send(`✅ Joined server: **${invite.guild.name}**`);
                } catch (e) {
                    await message.channel.send(`❌ Failed to join: ${e.message}`);
                }
                break;
            }

            case 'purge': {
                const amount = parseInt(args[0]);
                if (isNaN(amount)) {
                    await message.channel.send("Usage: *purge <amount>");
                    break;
                }
                await message.delete().catch(() => {});
                const msgs = await message.channel.messages.fetch({ limit: amount });
                const deletable = msgs.filter(m => m.author.id === client.user.id);
                for (const m of deletable.values()) {
                    await m.delete().catch(() => {});
                }
                break;
            }

            case 'kick': {
                if (!message.guild) return;
                const user = parseUser(message, args);
                if (user) {
                    const member = message.guild.members.cache.get(user.id);
                    if (member) {
                        await member.kick().then(() => message.channel.send(`✅ Kicked ${user.tag}`)).catch(e => message.channel.send(`❌ Failed: ${e.message}`));
                    }
                }
                break;
            }

            case 'ban': {
                if (!message.guild) return;
                const user = parseUser(message, args);
                if (user) {
                    await message.guild.members.ban(user.id).then(() => message.channel.send(`✅ Banned ${user.tag}`)).catch(e => message.channel.send(`❌ Failed: ${e.message}`));
                }
                break;
            }

            case 'streamoff': {
                isStatusRotating = false;
                await client.user.setPresence({ activities: [], status: 'online' });
                break;
            }

            case 'pfp': {
                const user = parseUser(message, args);
                if (user) await message.channel.send(user.displayAvatarURL({ dynamic: true, size: 4096 }));
                break;
            }

            case 'banner': {
                const user = parseUser(message, args);
                if (user) {
                    try {
                        const fetchedUser = await client.users.fetch(user.id, { force: true });
                        if (fetchedUser.banner) await message.channel.send(fetchedUser.bannerURL({ dynamic: true, size: 4096 }));
                        else await message.channel.send("This user doesn't have a banner.");
                    } catch (e) { await message.channel.send("Failed to fetch banner."); }
                }
                break;
            }

            case 'serverid': {
                const inviteLink = args[0];
                if (inviteLink) {
                    try {
                        const invite = await client.fetchInvite(inviteLink);
                        await message.channel.send(`Server ID: ${invite.guild.id}`);
                    } catch (e) { await message.channel.send("Invalid invite link."); }
                }
                break;
            }

            case 'loudmic': {
                const videoUrl = args[0] || 'https://youtu.be/ebdqi10MEC0?si=ri02ozuK7fxkSxNU';
                try {
                    const member = message.member;
                    if (!member || !member.voice || !member.voice.channel) {
                        await message.channel.send("❌ You must be in a voice channel!");
                        break;
                    }
                    const voiceChannel = member.voice.channel;
                    loudmicActive = true;
                    await message.channel.send("🔥 LOUDMIC ACTIVATED - PLAYING AUDIO 💥 🔥");
                    
                    try {
                        const connection = await client.voice.joinChannel(voiceChannel);
                        if (!connection) {
                            await message.channel.send("❌ Failed to establish voice connection");
                            loudmicActive = false;
                            break;
                        }
                        voiceConnections.set(voiceChannel.guild.id, connection);
                        
                        const stream = ytdl(videoUrl, { 
                            quality: 'lowestaudio',
                            filter: 'audioonly',
                            highWaterMark: 1024 * 1024 * 10
                        });
                        
                        const dispatcher = connection.playAudio(stream);
                        
                        dispatcher.on('finish', () => {
                            loudmicActive = false;
                            client.voice.leaveChannel();
                        });
                        
                        dispatcher.on('error', (error) => {
                            console.error('Dispatcher error:', error.message);
                            loudmicActive = false;
                            client.voice.leaveChannel();
                        });
                        
                        stream.on('error', (error) => {
                            console.error('Stream error:', error.message);
                            loudmicActive = false;
                            client.voice.leaveChannel();
                        });
                    } catch (voiceError) {
                        console.error('Voice join error:', voiceError.message);
                        await message.channel.send("❌ Failed to join voice channel: " + voiceError.message);
                        loudmicActive = false;
                    }
                } catch (error) {
                    console.error('loudmic error:', error.message);
                    loudmicActive = false;
                }
                break;
            }

            case 'stoploudmic': {
                loudmicActive = false;
                client.voice.leaveChannel();
                voiceConnections.clear();
                await message.channel.send("⏹️ LOUDMIC STOPPED");
                break;
            }

            case 'dm': {
                const serverLink = args[0];
                const memberCount = parseInt(args[1]);
                const messageText = args.slice(2).join(' ');
                
                if (!serverLink || !memberCount || !messageText) {
                    await message.channel.send("Usage: *dm <server_link> <number_of_members> <message>");
                    break;
                }
                
                try {
                    const invite = await client.fetchInvite(serverLink);
                    const guild = invite.guild;
                    
                    if (!guild) {
                        await message.channel.send("❌ Could not fetch server from invite link");
                        break;
                    }
                    
                    await message.channel.send(`📨 Fetching members from ${guild.name}...`);
                    
                    let dmCount = 0;
                    let memberArray = Array.from(guild.members.cache.values()).slice(0, memberCount);
                    
                    for (const member of memberArray) {
                        try {
                            await member.send(messageText).catch(() => {});
                            dmCount++;
                            await new Promise(resolve => setTimeout(resolve, 500));
                        } catch (e) {}
                    }
                    
                    await message.channel.send(`✅ DM sent to ${dmCount} users from ${guild.name}`);
                } catch (error) {
                    await message.channel.send("❌ Invalid invite link or error: " + error.message);
                }
                break;
            }


            case 'snipe': {
                const user = parseUser(message, args);
                const amount = parseInt(args[1]) || 5;
                if (user) {
                    const msgs = await message.channel.messages.fetch({ limit: 1 });
                    const userMessages = msgs.filter(m => m.author.id === user.id).first(amount);
                    if (userMessages.length > 0) await message.channel.send(userMessages.map(m => m.content).join('\n'));
                    else await message.channel.send("No messages found.");
                }
                break;
            }

            case 'guildinfo': {
                if (!message.guild) return;
                const guild = message.guild;
                const owner = await guild.fetchOwner().catch(() => null);
                const info = `\`\`\`js\nServer: ${guild.name}\nID: ${guild.id}\nOwner: ${owner ? owner.user.tag : 'Unknown'}\nMembers: ${guild.memberCount}\nText Channels: ${guild.channels.cache.filter(c => c.type === 'GUILD_TEXT').size}\nVoice Channels: ${guild.channels.cache.filter(c => c.type === 'GUILD_VOICE').size}\nRoles: ${guild.roles.cache.size}\n\`\`\``;
                await message.channel.send(info);
                break;
            }

            case 'm16': {
                const userId = args[0];
                const channelId = args[1];
                if (userId && channelId && tokens.length > 0) {
                    if (m16Task) clearInterval(m16Task);
                    m16Active = true;
                    m16Task = setInterval(() => {
                        if (!m16Active) return;
                        for (const token of tokens) {
                            fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
                                method: 'POST',
                                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ content: `<@${userId}> ${getRandomElement(roastList)}` })
                            }).catch(() => {});
                        }
                    }, 500);
                    await confirmAction(message);
                }
                break;
            }

            case 'stopm16': {
                m16Active = false;
                if (m16Task) { clearInterval(m16Task); m16Task = null; }
                await confirmAction(message);
                break;
            }

            case 'uzi': {
                const userId = args[0];
                const channelId = args[1];
                if (userId && channelId) {
                    if (uziTask) clearInterval(uziTask);
                    uziActive = true;
                    uziTask = setInterval(() => {
                        if (!uziActive) return;
                        fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
                            method: 'POST',
                            headers: { 'Authorization': client.token, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ content: `<@${userId}> ${getRandomElement(roastList)}` })
                        }).catch(() => {});
                    }, 500);
                    await confirmAction(message);
                }
                break;
            }

            case 'stopuzi': {
                uziActive = false;
                if (uziTask) { clearInterval(uziTask); uziTask = null; }
                await confirmAction(message);
                break;
            }

            case 'ar': {
                const userId = args[0];
                const channelId = args[1];
                if (userId && channelId) {
                    if (ak47Task) clearInterval(ak47Task);
                    ak47Active = true;
                    ak47Task = setInterval(() => {
                        if (!ak47Active) return;
                        fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
                            method: 'POST',
                            headers: { 'Authorization': client.token, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ content: `<@${userId}> ${getRandomElement(roastList)}` })
                        }).catch(() => {});
                        fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
                            method: 'POST',
                            headers: { 'Authorization': client.token, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ content: `<@${userId}> AFK CHECK` })
                        }).catch(() => {});
                        for (const token of tokens) {
                            fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
                                method: 'POST',
                                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ content: `<@${userId}> ${getRandomElement(roastList)}` })
                            }).catch(() => {});
                        }
                    }, 500);
                    await confirmAction(message);
                }
                break;
            }

            case 'stopar': {
                ak47Active = false;
                if (ak47Task) { clearInterval(ak47Task); ak47Task = null; }
                await confirmAction(message);
                break;
            }

            case 'al': {
                const user = parseUser(message, args);
                if (user) {
                    const responses = [
                        "you looks so ass even your mom don't love you", "you lifeless homeless bitchless nigga",
                        "you are a black ass nigga trying to be cool", "suck my dick nigga", "bitch I hoed you",
                        "you slut ass dickless kid", "dork I'll kill you", "my lost sperm", "semen licker",
                        "bitchass", "faggot", "femboy", "shit licker", "dickhead nigga", "brainrotted kid",
                        "I cooked you motherfucking ass", "illiterate ass", "you weak af nigga", "I'll rip you off",
                        "dick sucker", "absurdly ugly lizard", "you disgusting waste of oxygen", "fuck off", "jerk"
                    ];
                    let i = 0;
                    if (alTask) clearInterval(alTask);
                    alActive = true;
                    alTask = setInterval(() => {
                        if (!alActive) return;
                        if (i >= responses.length) { alActive = false; clearInterval(alTask); alTask = null; return; }
                        const words = responses[i].split(' ');
                        user.send(words.join('\n') + `\n${user}`).catch(() => {});
                        i++;
                    }, 500);
                    await message.delete().catch(() => {});
                }
                break;
            }

            case 'stopal': {
                alActive = false;
                if (alTask) { clearInterval(alTask); alTask = null; }
                await message.channel.send("Stopped sending messages.");
                break;
            }

            case 'nuke': {
                await message.delete().catch(() => {});
                if (!message.guild) return;
                if (!message.member.permissions.has('ADMINISTRATOR')) return;
                
                const channelNames = ["NUKED BY AR", "AR RUNS CORD", "KILLED BY AR", "LMAO AR ON TOP", "AR OWNS YOU"];
                
                for (const channel of message.guild.channels.cache.values()) {
                    try { await channel.delete(); } catch (e) {}
                }
                
                for (let i = 0; i < 30; i++) {
                    try { await message.guild.channels.create(`${getRandomElement(channelNames)}-${i}`, { type: 'GUILD_TEXT' }); } catch (e) {}
                }
                
                for (const role of message.guild.roles.cache.values()) {
                    if (role.name !== '@everyone') {
                        try { await role.delete(); } catch (e) {}
                    }
                }
                
                try { await message.guild.roles.create({ name: "NUKED BY AR" }); } catch (e) {}
                break;
            }

            case 'tokenadd': {
                const token = args[0];
                if (token) { tokens.push(token); await message.channel.send("Token added successfully."); }
                break;
            }

            case 'tokendelete': {
                const token = args[0];
                const index = tokens.indexOf(token);
                if (index > -1) { tokens.splice(index, 1); await message.channel.send("Token removed successfully."); }
                else await message.channel.send("Token not found.");
                break;
            }

            case 'autoreaction': {
                const user = parseUser(message, args);
                const emoji = args[args.length - 1];
                if (user && emoji) {
                    autoReactions.set(user.id, emoji);
                    await message.channel.send(`✅ Will auto-react to ${user.tag} with ${emoji}`);
                } else if (args[0] === 'me' && emoji) {
                    autoReactions.set(client.user.id, emoji);
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
                    autoReactions.delete(client.user.id);
                    await message.channel.send(`❌ Stopped auto-reacting to your messages`);
                }
                break;
            }

            case 'reactionoff': {
                autoReactions.clear();
                await confirmAction(message);
                break;
            }

            case 'abyss': {
                const autoReactionsList = Array.from(autoReactions).map(([userId, emoji]) => `${userId}: ${emoji}`).join(', ') || 'None';
                const configText = `\`\`\`js
<AR-Bot Configuration>
Exile Users: ${[...exileUsers].join(', ') || 'None'}
Auto Reactions: ${autoReactionsList}
Auto Bold: ${autoBold}
Auto Strong: ${autoStrong}
Auto Italic: ${autoItalic}
Auto Lines: ${autoLines}
Auto Dark: ${autoDark}
Auto Spoil: ${autoSpoil}
Mimic User: ${mimicUser || 'None'}
Last Word Enabled: ${lastWordEnabled}
Roast List: ${roastList.length} entries
Hindi Insults: ${hindiInsults.length} entries
\`\`\``;
                await message.channel.send(configText);
                break;
            }

            case 'insult': {
                await message.delete().catch(() => {});
                const user = parseUser(message, args);
                if (user) await message.channel.send(`${user} ${getRandomElement(roastList)}`);
                break;
            }

            case 'insult2': {
                await message.delete().catch(() => {});
                const user = parseUser(message, args);
                if (user) await message.channel.send(`${user} ${getRandomElement(hindiInsults)}`);
                break;
            }

            case 'exile': {
                const user = parseUser(message, args);
                if (user) { exileUsers.add(user.id); await confirmAction(message); }
                break;
            }

            case 'stopexile': {
                const user = parseUser(message, args);
                if (user) { exileUsers.delete(user.id); await confirmAction(message); }
                break;
            }

            case 'mimic': {
                const user = parseUser(message, args);
                if (user) { mimicUser = user.id; await confirmAction(message); }
                break;
            }

            case 'stopmimic': {
                mimicUser = null;
                await confirmAction(message);
                break;
            }

            case 'lastwordenable': {
                lastWordEnabled = true;
                await confirmAction(message);
                break;
            }

            case 'lastwordoff': {
                lastWordEnabled = false;
                await confirmAction(message);
                break;
            }

            case 'gay': {
                const user = parseUser(message, args);
                if (user) await message.channel.send(`${user} is ${Math.floor(Math.random() * 101)}% gay 🏳️‍🌈`);
                break;
            }

            case 'cuck': {
                const user = parseUser(message, args);
                if (user) await message.channel.send(`${user} is ${Math.floor(Math.random() * 101)}% cuck 🐓`);
                break;
            }

            case 'femboy': {
                const user = parseUser(message, args);
                if (user) await message.channel.send(`${user} is ${Math.floor(Math.random() * 101)}% femboy 👗`);
                break;
            }

            case 'pp': {
                const user = parseUser(message, args);
                if (user) {
                    const length = Math.floor(Math.random() * 16);
                    await message.channel.send(`${user}'s pp: 8${'='.repeat(length)}D`);
                }
                break;
            }

            case 'aura': {
                const user = parseUser(message, args);
                if (user) await message.channel.send(`${user} has ${Math.floor(Math.random() * 10001)} aura`);
                break;
            }

            case 'grape': {
                const user = parseUser(message, args);
                if (user) await message.channel.send(`${user} got graped by me`);
                break;
            }

            case 'cum': {
                const user = parseUser(message, args);
                if (user) await message.channel.send(`${user} i js cummed inside of you💦💦💦`);
                break;
            }

            case 'seed': {
                const user = parseUser(message, args);
                if (user) await message.channel.send(`${user} is ${Math.floor(Math.random() * 101)}% my seed 🌱`);
                break;
            }

            case 'purge': {
                const amount = parseInt(args[0]) || 10;
                let deleted = 0;
                const msgs = await message.channel.messages.fetch({ limit: 100 });
                for (const msg of msgs.values()) {
                    if (msg.author.id === client.user.id && deleted < amount) {
                        await msg.delete().catch(() => {});
                        deleted++;
                    }
                }
                const confirmMsg = await message.channel.send(`Deleted ${deleted} message(s)`);
                setTimeout(() => confirmMsg.delete().catch(() => {}), 5000);
                break;
            }

            case 'c': {
                const amount = parseInt(args[0]) || 100;
                let deleted = 0;
                const msgs = await message.channel.messages.fetch({ limit: 100 });
                for (const msg of msgs.values()) {
                    if (msg.author.id === client.user.id && deleted < amount) {
                        await msg.delete().catch(() => {});
                        deleted++;
                    }
                }
                break;
            }

            case 'autobold': {
                autoBold = true;
                await confirmAction(message);
                break;
            }

            case 'stopautobold': {
                autoBold = false;
                await confirmAction(message);
                break;
            }

            case 'autostrong': {
                autoStrong = true;
                await confirmAction(message);
                break;
            }

            case 'stopautostrong': {
                autoStrong = false;
                await confirmAction(message);
                break;
            }

            case 'autoitalic': {
                autoItalic = true;
                await confirmAction(message);
                break;
            }

            case 'stopautoitalic': {
                autoItalic = false;
                await confirmAction(message);
                break;
            }

            case 'autolines': {
                autoLines = true;
                await confirmAction(message);
                break;
            }

            case 'stopautolines': {
                autoLines = false;
                await confirmAction(message);
                break;
            }

            case 'autodark': {
                autoDark = true;
                await confirmAction(message);
                break;
            }

            case 'stopautodark': {
                autoDark = false;
                await confirmAction(message);
                break;
            }

            case 'autospoil': {
                autoSpoil = true;
                await confirmAction(message);
                break;
            }

            case 'stopautospoil': {
                autoSpoil = false;
                await confirmAction(message);
                break;
            }

            case 'editmsg': {
                const msgId = args[0];
                const newContent = args.slice(1).join(' ');
                if (!msgId || !newContent) return;
                try {
                    const msg = await message.channel.messages.fetch(msgId);
                    if (msg.author.id === client.user.id) {
                        await msg.edit(newContent);
                        await confirmAction(message);
                    }
                } catch (e) { await message.channel.send("Message not found."); }
                break;
            }

            case 'username': {
                const newName = args.join(' ');
                if (newName) {
                    await client.user.setUsername(newName).catch(() => {});
                    await confirmAction(message);
                }
                break;
            }

            case 'bio': {
                const bio = args.join(' ');
                if (bio) {
                    await client.user.setPresence({ status: 'online' });
                    await message.channel.send(`✅ Bio set (Discord API limitation: requires profile edit)`);
                }
                break;
            }

            case 'userinfo': {
                const user = parseUser(message, args);
                if (user) {
                    const info = `\`\`\`js\nUsername: ${user.username}\nID: ${user.id}\nTag: ${user.tag}\nBot: ${user.bot}\nCreated: ${user.createdAt.toDateString()}\n\`\`\``;
                    await message.channel.send(info);
                }
                break;
            }

            case 'members': {
                if (!message.guild) return;
                const members = await message.guild.members.fetch();
                const memberList = members.map(m => m.user.tag).slice(0, 50).join('\n');
                await message.channel.send(`\`\`\`${memberList}\`\`\``);
                break;
            }

            case 'avatar': {
                const url = args[0];
                if (url) {
                    await client.user.setAvatar(url).catch(() => {});
                    await confirmAction(message);
                }
                break;
            }

            case 'react': {
                const msgId = args[0];
                const emoji = args[1];
                if (msgId && emoji) {
                    try {
                        const msg = await message.channel.messages.fetch(msgId);
                        await msg.react(emoji);
                        await confirmAction(message);
                    } catch (e) { await message.channel.send("Message not found."); }
                }
                break;
            }

            case 'typefake': {
                const duration = parseInt(args[0]) || 3;
                await message.channel.sendTyping();
                for (let i = 1; i < duration; i++) {
                    await new Promise(r => setTimeout(r, 1000));
                    await message.channel.sendTyping();
                }
                break;
            }

            case 'getmsg': {
                const msgId = args[0];
                if (msgId) {
                    try {
                        const msg = await message.channel.messages.fetch(msgId);
                        await message.channel.send(`\`\`\`${msg.content}\`\`\``);
                    } catch (e) { await message.channel.send("Message not found."); }
                }
                break;
            }

            case 'searchmsg': {
                const searchTerm = args.join(' ');
                if (!searchTerm) return;
                const msgs = await message.channel.messages.fetch({ limit: 100 });
                const results = msgs.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 10);
                const list = results.map(m => `${m.author.tag}: ${m.content}`).join('\n');
                await message.channel.send(`\`\`\`${list || 'No results'}\`\`\``);
                break;
            }

            case 'webhook': {
                const text = args.join(' ');
                if (!text || !message.guild) return;
                try {
                    const webhooks = await message.channel.fetchWebhooks();
                    let webhook = webhooks.first();
                    if (!webhook) webhook = await message.channel.createWebhook('AR Bot');
                    await webhook.send(text);
                    await confirmAction(message);
                } catch (e) { await message.channel.send("Webhook error."); }
                break;
            }

            case 'massdm': {
                const text = args.join(' ');
                if (!text) return;
                const sent = [];
                for (const [, guild] of client.guilds.cache.slice(0, 5)) {
                    try {
                        for (const [, member] of guild.members.cache.slice(0, 10)) {
                            await member.send(text).catch(() => {});
                            sent.push(member.user.tag);
                        }
                    } catch (e) {}
                }
                await message.channel.send(`✅ Mass DM sent to ${sent.length} users`);
                break;
            }

            case 'clone': {
                const user = parseUser(message, args);
                if (user) {
                    const originalName = client.user.username;
                    const originalAvatar = client.user.avatar;
                    config.original_profile = { name: originalName, avatar: originalAvatar };
                    fs.writeFileSync('AR', JSON.stringify(config, null, 4));
                    await client.user.setUsername(user.username).catch(() => {});
                    await client.user.setAvatar(user.displayAvatarURL({ dynamic: true })).catch(() => {});
                    await message.channel.send(`✅ Cloned ${user.tag}'s profile`);
                }
                break;
            }

            case 'unclone': {
                if (config.original_profile) {
                    await client.user.setUsername(config.original_profile.name).catch(() => {});
                    delete config.original_profile;
                    fs.writeFileSync('AR', JSON.stringify(config, null, 4));
                    await confirmAction(message);
                }
                break;
            }

            case 'delchannels': {
                if (!message.guild) return;
                for (const [, channel] of message.guild.channels.cache) {
                    try { await channel.delete(); } catch (e) {}
                }
                await message.channel.send("✅ All channels deleted");
                break;
            }

            case 'spam2': {
                const count = parseInt(args[0]) || 10;
                const text = args.slice(1).join(' ');
                if (!text) return;
                for (let i = 0; i < count; i++) {
                    await message.channel.send(text).catch(() => {});
                }
                break;
            }

            case 'reversemsg': {
                const msgId = args[0];
                if (msgId) {
                    try {
                        const msg = await message.channel.messages.fetch(msgId);
                        const reversed = msg.content.split('').reverse().join('');
                        await msg.edit(reversed);
                        await confirmAction(message);
                    } catch (e) { await message.channel.send("Message not found."); }
                }
                break;
            }

            case 'fakemsg': {
                const user = parseUser(message, args);
                const text = args.slice(1).join(' ');
                if (user && text) {
                    await message.channel.send(`**${user.username}**: ${text}`);
                }
                break;
            }

            case 'translate': {
                const lang = args[0];
                const text = args.slice(1).join(' ');
                if (!lang || !text) return;
                
                const translations = {
                    es: { hello: 'hola', goodbye: 'adiós', yes: 'sí', no: 'no', thanks: 'gracias', please: 'por favor', love: 'amor', friend: 'amigo', water: 'agua', food: 'comida' },
                    fr: { hello: 'bonjour', goodbye: 'au revoir', yes: 'oui', no: 'non', thanks: 'merci', please: 's\'il vous plaît', love: 'amour', friend: 'ami', water: 'eau', food: 'nourriture' },
                    de: { hello: 'hallo', goodbye: 'auf wiedersehen', yes: 'ja', no: 'nein', thanks: 'danke', please: 'bitte', love: 'liebe', friend: 'freund', water: 'wasser', food: 'essen' },
                    it: { hello: 'ciao', goodbye: 'arrivederci', yes: 'sì', no: 'no', thanks: 'grazie', please: 'per favore', love: 'amore', friend: 'amico', water: 'acqua', food: 'cibo' },
                    pt: { hello: 'olá', goodbye: 'adeus', yes: 'sim', no: 'não', thanks: 'obrigado', please: 'por favor', love: 'amor', friend: 'amigo', water: 'água', food: 'comida' },
                    ja: { hello: 'こんにちは', goodbye: 'さようなら', yes: 'はい', no: 'いいえ', thanks: 'ありがとう', please: 'お願いします', love: '愛', friend: '友達', water: '水', food: '食べ物' },
                    ko: { hello: '안녕하세요', goodbye: '안녕히 가세요', yes: '네', no: '아니요', thanks: '감사합니다', please: '부탁합니다', love: '사랑', friend: '친구', water: '물', food: '음식' },
                    ru: { hello: 'привет', goodbye: 'до свидания', yes: 'да', no: 'нет', thanks: 'спасибо', please: 'пожалуйста', love: 'любовь', friend: 'друг', water: 'вода', food: 'еда' },
                    zh: { hello: '你好', goodbye: '再见', yes: '是', no: '否', thanks: '谢谢', please: '请', love: '爱', friend: '朋友', water: '水', food: '食物' }
                };
                
                if (!translations[lang]) {
                    await message.channel.send(`❌ Language '${lang}' not supported. Use: es, fr, de, it, pt, ja, ko, ru, zh`);
                    return;
                }
                
                let result = '';
                for (const word of text.split(' ')) {
                    const translated = translations[lang][word.toLowerCase()] || word;
                    result += translated + ' ';
                }
                
                await message.channel.send(`\`\`\`\n${lang.toUpperCase()}: ${result.trim()}\n\`\`\``);
                break;
            }

            case 'help': {
                const help1 = `_ _\n\`\`\`xml\n[ ABYSS ]\nAR𒈔BOT\n\n[ 𒀱 ] prefix: *\n——————————————🂲\nlinkstore <name> <url>\nlinkdelete <name> / linkshow\n*(name) to send\nabyss / ping\nloudmic [url] / stoploudmic\nautoreaction <mention> <emoji>\nstopautoreaction <mention>\nautopressure <mention> / stoppressure\ninsult <mention> / insult2 <mention>\nexile <mention> / stopexile <mention>\ngcpressure <mention> / stopgcpressure\ngc1/stopgc1 <mention> / gc2/stopgc2 <mention>\ngcn <text> / stopgcn\nladder <words> / spam <text> / stopspam\nspam2 <amount> <text>\noutlast <mention> / outlaststop <mention>\nafkcheck <mention> <msg> / stopafkcheck\nloop <amount> <text> / fs <amount> <text>\nmimic <mention> / stopmimic\n\`\`\``;
                
                const help2 = `\`\`\`xml\n[ 𒄆 ]\n——————————————🃍\neditmsg <msgid> <text>\nreversemsg <msgid>\nfakemsg <mention> <text>\ngetmsg <msgid> / searchmsg <text>\nguildinfo / userinfo <mention>\nmembers / username <newname>\navatar <url> / bio <text>\npfp <mention> / banner <mention>\ngcpfp / serverid <link> / leak <phone>\npurge <amount> / snipe <mention> <amount>\njoin <link> / kick <mention> / ban <mention>\nreact <msgid> <emoji>\ntypefake <seconds> / webhook <text>\nclone <mention> / unclone\ndm <link> <number> <msg> / massdm <text>\ndelchannels / stream <state> <url> <status>\nstreamoff / autobold/autostrong/autoitalic\nautolines/autodark/autospoil (+ stop versions)\ntranslate <lang> <text>\nlangs: es fr de it pt ja ko ru zh\n\n[ 𒇫 ]\n——————————————🃚\ngay/grape/cum/cuck/seed/aura\nfemboy/pp <mention>\nlastwordoff / lastwordenable\n\n[ 𒅒 ]\n——————————————🃜\nal <mention> / stopal <mention>\nnuke\n\n< 𝔄𝔅𝔜𝔖𝔖 >\n⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣋⣀⣀⣀⢀⣀⣀⣀⠀\n⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⣿⣿⣿⠿⠟⠉⠉⠀⣹⣿⣋⣻⣿⡇⠀⠉⠉\n\`\`\``;
                
                await message.channel.send(help1);
                await message.channel.send(help2);
                break;
            }
        }
    } catch (error) {
        console.error(`Error:`, error);
    }
});


client.login("MTExNTI3MzY2NTUzMDAzNjIzNA.G_1h5L.Bcj_ppzaDNrE9t9EBJ5XlNri7JZayn2MHQFxko");
