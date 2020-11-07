const Discord = require('discord.js');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const prettifyRules = require('./prettify');

require('dotenv').config();
let url = process.env.MONGODB_URI;

const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}
const prefix = "!";

let servers = {
    '298286689514815503': {
        role: "Semi-Scrubs"
    }, '635940653771128833': {
        role: "Member"
    }, '639635912027930637': {
        role: "Member"
    }
};

function postRules(serverId) {
    MongoClient.connect(url, {"useUnifiedTopology": true}, function (err, db) {
        if (err) throw err;
        let dbo = db.db();
        dbo.collection("guilds").find({_id: serverId}).toArray(function (err, result) {
            if (err) throw err;
            if (result) {
                result = result[0];
                let channel = client.guilds.get(result._id).channels.find(channel => channel.name === "rules");
                let foundRules = false;
                let rulesEmbed;
                let rulesMessage;
                if (channel) {
                    channel.fetchMessages({limit: 10}).then(function (messages) {
                        messages.forEach(function (message) {
                            if (message.embeds.length > 0) {
                                for (let embed of message.embeds) {
                                    if (embed.title === "These are the server rules, please read and accept them to gain access to the server.") {
                                        rulesEmbed = embed;
                                        rulesMessage = message;
                                        foundRules = true;
                                    }
                                }
                            }
                        });
                        if (foundRules) {
                            console.log(`Found the rules for the guild ${channel.guild.name}, and now I am editing the rules.`);
                            const newEmbed = new Discord.RichEmbed(rulesEmbed);
                            newEmbed.setDescription(prettifyRules(result["rules"]).join("\n"));
                            rulesMessage.edit(newEmbed);
                        } else {
                            console.log(`I could not find the rules for the guild ${channel.guild.name}, so I am posting them now`);
                            const rulesEmbed = new Discord.RichEmbed()
                                .setColor("#0099ff")
                                .setTitle("These are the server rules, please read and accept them to gain access to the server.")
                                .setDescription(prettifyRules(result["rules"]).join("\n"))
                                .setFooter("Please accept the rules with ✅ or decline them with ❌");
                            channel.send(rulesEmbed).then(function (rulesEmbed) {
                                rulesEmbed.react("✅").then(function () {
                                    rulesEmbed.react("❌").then(function () {
                                        console.log("Done posting the rules.");
                                    });
                                });
                            });
                        }
                    });
                }
            }
            db.close();
        });
    });
}

client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
        client.guilds.forEach(function (guild) {
            MongoClient.connect(url, {useUnifiedTopology: true}, function (err, db) {
                if (err) throw err;
                let dbo = db.db();
                dbo.collection("guilds").find({_id: guild.id}).toArray(function (err, result) {
                    if (err) throw err;
                    if (result.length === 0) {
                        let guildData = {_id: guild.id, rules: []};
                        dbo.collection("guilds").insertOne(guildData, function (err, res) {
                            if (err) throw err;
                        });
                    }
                    db.close();
                });
            });
            postRules(guild.id);
        });
    }
);
client.on("guildCreate", guild => {
    MongoClient.connect(url, {useUnifiedTopology: true}, function (err, db) {
        if (err) throw err;
        let dbo = db.db();
        dbo.collection("guilds").find({_id: guild.id}).toArray(function (err, result) {
            if (err) throw err;
            if (!result) {
                let guildData = {_id: guild.id, rules: ["There are no rules currently set."]};
                dbo.collection("guilds").insertOne(guildData, function (err, res) {
                    if (err) throw err;
                });
            }
            db.close();
        });
    });
    if (!guild.channels.find(channel => channel.name === "rules")) {
        guild.createChannel("rules", {type: "text"}).then(
            (chan) => {
                chan.overwritePermissions(guild.roles.find('name', '@everyone'), {
                    'VIEW_CHANNEL': true, 'SEND_MESSAGES': false
                })
            });
    }
});

client.on('messageReactionAdd', (reaction, user) => {
        if (reaction.message.guild) {
            if (!user.bot) {
                for (let embed of reaction.message.embeds) {
                    if (embed.title === "These are the server rules, please read and accept them to gain access to the server.") {
                        if (reaction.emoji.name === "✅") {
                            let reactor = reaction.message.guild.member(user);
                            let role = reaction.message.guild.roles.find(role => role.name === servers[reaction.message.guild.id]["role"]);
                            reactor.addRole(role);
                        } else if (reaction.emoji.name === "❌") {
                        } else {
                        }
                    }
                }
            }
        }
    }
);
client.on('raw', packet => {
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
    const channel = client.channels.get(packet.d.channel_id);
    if (channel.messages.has(packet.d.message_id)) return;
    channel.fetchMessage(packet.d.message_id).then(message => {
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
        const reaction = message.reactions.get(emoji);
        if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id));
        }
        if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            client.emit('messageReactionRemove', reaction, client.users.get(packet.d.user_id));
        }
    });
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'addrule') {
        client.commands.get('addrule').execute(message, args);
    } else if (command === 'removerule') {
        client.commands.get('removerule').execute(message, args);
    } else if (command === 'clearrules') {
        client.commands.get('clearrules').execute(message, args);
    }
});

//const trumpLimiter = require("./limit.js");
//trumpLimiter().listen(8000);