const Discord = require('discord.js');
const MongoClient = require('mongodb').MongoClient;
const prettifyRules = require('../prettify');
let url = process.env.MONGODB_URI;

module.exports = {
    name: 'removerule',
    description: 'Removes a rule to the list.',
    execute(message, args) {
        MongoClient.connect(url, {useUnifiedTopology: true}, function (err, db) {
            if (err) throw err;
            let dbo = db.db();
            dbo.collection("guilds").find({_id: message.guild.id}).toArray(function (err, result) {
                if (err) throw err;
                if (result) {
                    result = result[0];
                    let newRules = result["rules"];
                    newRules.splice(parseInt(args[0]) - 1, 1);
                    if (newRules.length === 0){
                        newRules = ["There are no rules currently set."];
                    }
                    dbo.collection("guilds").updateOne({_id: message.guild.id}, {$set: {rules: newRules}}, function (err, res) {
                        if (err) throw err;
                    });
                    let channel = message.guild.channels.find(channel => channel.name === "rules");
                    if (channel) {
                        channel.fetchMessages({limit: 10}).then(function (messages) {
                            messages.forEach(function (message) {
                                for (let embed of message.embeds) {
                                    if (embed.title === "These are the server rules, please read and accept them to gain access to the server.") {
                                        const newEmbed = new Discord.RichEmbed(message.embeds[0]);
                                        newEmbed.setDescription(prettifyRules(newRules).join("\n"));
                                        message.edit(newEmbed);
                                    }
                                }
                            });
                        });
                    }
                }
                db.close();
            });
        });
    },
};
