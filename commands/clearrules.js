const Discord = require('discord.js');
const MongoClient = require('mongodb').MongoClient;
let url = process.env.MONGODB_URI;

module.exports = {
    name: 'clearrules',
    description: 'Clears all rules.',
    execute(message, args) {
        let channel = message.guild.channels.find(channel => channel.name === "rules");
        if (channel) {
            channel.fetchMessages({limit: 10}).then(function (messages) {
                messages.forEach(function (message) {
                    for (let embed of message.embeds) {
                        if (embed.title === "These are the server rules, please read and accept them to gain access to the server.") {
                            const newEmbed = new Discord.RichEmbed(embed);
                            newEmbed.setDescription("There are no rules currently set.");
                            message.edit(newEmbed);
                        }
                    }
                });
            });
        }

        MongoClient.connect(url, {useUnifiedTopology: true}, function (err, db) {
            if (err) throw err;
            let dbo = db.db();
            dbo.collection("guilds").updateOne({_id: message.guild.id}, {$set: {rules: ["There are no rules currently set."]}}, function (err, res) {
                if (err) throw err;
                db.close();
            });
        });
    },
};
